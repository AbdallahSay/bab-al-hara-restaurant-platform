using BabAlHara.Application.Operations;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Operations;

public sealed class OperationsQueryService(AppDbContext dbContext) : IOperationsQueryService
{
    private static readonly HashSet<OrderStatus> ActiveStatuses =
    [
        OrderStatus.Pending,
        OrderStatus.Confirmed,
        OrderStatus.Preparing,
        OrderStatus.Ready,
        OrderStatus.OnTheWay,
    ];

    public async Task<OperationsCommandCenterResponse> GetOperationsSnapshotAsync(CancellationToken cancellationToken)
    {
        var activeOrders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => ActiveStatuses.Contains(o.Status))
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var pendingCount = 0;
        var confirmedCount = 0;
        var preparingCount = 0;
        var readyCount = 0;
        var onTheWayCount = 0;
        var deliveryWaitingForDriverCount = 0;

        var attentionItems = new List<OperationsAttentionItemDto>();
        var mappedActiveOrders = new List<OperationsActiveOrderDto>(activeOrders.Count);

        foreach (var order in activeOrders)
        {
            switch (order.Status)
            {
                case OrderStatus.Pending:
                    pendingCount++;
                    break;
                case OrderStatus.Confirmed:
                    confirmedCount++;
                    break;
                case OrderStatus.Preparing:
                    preparingCount++;
                    break;
                case OrderStatus.Ready:
                    readyCount++;
                    if (order.OrderType == OrderType.Delivery && order.DriverId is null)
                    {
                        deliveryWaitingForDriverCount++;
                    }
                    break;
                case OrderStatus.OnTheWay:
                    onTheWayCount++;
                    break;
            }

            var latestHistory = order.StatusHistory
                .OrderByDescending(h => h.ChangedAtUtc)
                .FirstOrDefault();

            var currentStatusSinceUtc = latestHistory?.ChangedAtUtc ?? order.CreatedAt;

            // Factual attention rules
            if (order.Status == OrderStatus.Ready && order.OrderType == OrderType.Delivery && order.DriverId is null)
            {
                attentionItems.Add(new OperationsAttentionItemDto(
                    order.Id,
                    order.PublicCode,
                    order.CreatedAt,
                    currentStatusSinceUtc,
                    order.OrderType,
                    order.Status,
                    "unassigned_ready_delivery",
                    order.CustomerName,
                    order.Total));
            }
            else if (order.Status == OrderStatus.Pending)
            {
                attentionItems.Add(new OperationsAttentionItemDto(
                    order.Id,
                    order.PublicCode,
                    order.CreatedAt,
                    currentStatusSinceUtc,
                    order.OrderType,
                    order.Status,
                    "unacknowledged_pending",
                    order.CustomerName,
                    order.Total));
            }

            var items = order.Items
                .OrderBy(i => i.Id)
                .Select(i => new OperationsOrderItemDto(
                    i.ProductNameAr,
                    i.ProductNameEn,
                    i.Quantity))
                .ToList();

            var statusHistory = order.StatusHistory
                .OrderBy(h => h.ChangedAtUtc)
                .Select(h => new OperationsStatusHistoryDto(
                    h.PreviousStatus,
                    h.NewStatus,
                    h.ActorRole,
                    h.ChangedAtUtc,
                    h.Notes))
                .ToList();

            mappedActiveOrders.Add(new OperationsActiveOrderDto(
                order.Id,
                order.PublicCode,
                order.CreatedAt,
                currentStatusSinceUtc,
                order.OrderType,
                order.Status,
                order.CustomerName,
                order.CustomerPhone,
                order.DeliveryAreaNameAr,
                order.DeliveryAreaNameEn,
                order.Address,
                order.CustomerNote,
                order.Subtotal,
                order.DeliveryFee,
                order.Total,
                order.PaymentMethod,
                order.PaymentStatus,
                order.DriverId,
                order.DriverName,
                order.DriverAssignedAtUtc,
                items,
                statusHistory));
        }

        var summary = new OperationsSummaryDto(
            ActiveOrders: activeOrders.Count,
            Pending: pendingCount,
            Confirmed: confirmedCount,
            Preparing: preparingCount,
            Ready: readyCount,
            OnTheWay: onTheWayCount,
            DeliveryWaitingForDriver: deliveryWaitingForDriverCount);

        attentionItems.Sort((a, b) => a.CreatedAtUtc.CompareTo(b.CreatedAtUtc));

        return new OperationsCommandCenterResponse(
            summary,
            attentionItems,
            mappedActiveOrders);
    }
}
