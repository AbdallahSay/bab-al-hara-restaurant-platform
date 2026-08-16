using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Kitchen;

public sealed class KitchenOrderQueryService(AppDbContext dbContext) : IKitchenOrderQueryService
{
    private static readonly HashSet<OrderStatus> ActiveKitchenStatuses =
    [
        OrderStatus.Pending,
        OrderStatus.Confirmed,
        OrderStatus.Preparing,
        OrderStatus.Ready,
    ];

    public async Task<IReadOnlyList<KitchenOrderDto>> GetActiveAsync(
        CancellationToken cancellationToken) =>
        await dbContext.Orders
            .AsNoTracking()
            .Where(order => ActiveKitchenStatuses.Contains(order.Status))
            .OrderBy(order => order.CreatedAt)
            .Select(order => new KitchenOrderDto(
                order.PublicCode,
                order.CreatedAt,
                order.OrderType,
                order.Status,
                order.CustomerName,
                order.DeliveryAreaNameAr,
                order.DeliveryAreaNameEn,
                order.Address,
                order.CustomerNote,
                order.RowVersion != null ? Convert.ToBase64String(order.RowVersion) : null,
                order.Items
                    .OrderBy(item => item.Id)
                    .Select(item => new KitchenOrderItemDto(
                        item.ProductNameAr,
                        item.ProductNameEn,
                        item.Quantity))
                    .ToList()))
            .ToListAsync(cancellationToken);

    public async Task<KitchenOrderDetailsDto?> GetByPublicCodeAsync(
        string publicCode,
        CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .SingleOrDefaultAsync(o => o.PublicCode == publicCode, cancellationToken);

        if (order is null)
        {
            return null;
        }

        return new KitchenOrderDetailsDto(
            order.PublicCode,
            order.CreatedAt,
            order.OrderType,
            order.Status,
            order.CustomerName,
            order.DeliveryAreaNameAr,
            order.DeliveryAreaNameEn,
            order.Address,
            order.CustomerNote,
            order.RowVersion != null ? Convert.ToBase64String(order.RowVersion) : null,
            order.Items
                .OrderBy(item => item.Id)
                .Select(item => new KitchenOrderItemDto(
                    item.ProductNameAr,
                    item.ProductNameEn,
                    item.Quantity))
                .ToList(),
            order.StatusHistory
                .OrderBy(h => h.ChangedAtUtc)
                .Select(h => new OrderStatusHistoryDto(
                    h.Id,
                    h.PreviousStatus,
                    h.NewStatus,
                    h.ActorId,
                    h.ActorName,
                    h.ActorRole,
                    h.ChangedAtUtc,
                    h.Notes))
                .ToList());
    }

    public async Task<IReadOnlyList<OrderStatusHistoryDto>> GetOrderHistoryAsync(
        string publicCode,
        CancellationToken cancellationToken) =>
        await dbContext.OrderStatusHistories
            .AsNoTracking()
            .Where(h => h.Order != null && h.Order.PublicCode == publicCode)
            .OrderBy(h => h.ChangedAtUtc)
            .Select(h => new OrderStatusHistoryDto(
                h.Id,
                h.PreviousStatus,
                h.NewStatus,
                h.ActorId,
                h.ActorName,
                h.ActorRole,
                h.ChangedAtUtc,
                h.Notes))
            .ToListAsync(cancellationToken);
}
