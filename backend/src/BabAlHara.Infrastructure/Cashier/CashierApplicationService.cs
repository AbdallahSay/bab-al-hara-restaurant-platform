using BabAlHara.Application.Cashier;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Cashier;

public sealed class CashierApplicationService(
    AppDbContext dbContext,
    ICashierOrderCompletedNotifier notifier,
    ICustomerOrderTrackingNotifier trackingNotifier) : ICashierOrderService
{
    public async Task<IReadOnlyList<CashierOrderDto>> GetReadyOrdersAsync(CancellationToken cancellationToken)
    {
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Ready)
            .Include(o => o.Items)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(o => new CashierOrderDto(
            o.Id,
            o.PublicCode,
            o.CreatedAt,
            o.OrderType,
            o.Status,
            o.CustomerName,
            o.DeliveryAreaNameAr,
            o.DeliveryAreaNameEn,
            o.Address,
            o.CustomerNote,
            o.Subtotal,
            o.DeliveryFee,
            o.Total,
            o.PaymentMethod,
            o.PaymentStatus,
            o.DriverId,
            o.DriverName,
            o.DriverAssignedAtUtc,
            o.RowVersion,
            o.Items.Select(i => new CashierOrderItemDto(i.ProductNameAr, i.ProductNameEn, i.Quantity)).ToList()
        )).ToList();
    }

    public async Task<CompleteCashTakeawayResult> CompleteCashTakeawayHandoffAsync(
        Guid orderId,
        byte[] rowVersion,
        string actorId,
        string actorRole,
        CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
        {
            return CompleteCashTakeawayResult.NotFound;
        }

        dbContext.Entry(order).Property(o => o.RowVersion).OriginalValue = rowVersion;

        try
        {
            order.CompleteCashTakeawayHandoff(
                actorId,
                actorId,
                actorRole,
                DateTimeOffset.UtcNow,
                "Cashier confirmed takeaway handoff and received cash payment");
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("already marked as paid", StringComparison.OrdinalIgnoreCase)
                || order.PaymentStatus == PaymentStatus.Paid)
            {
                return CompleteCashTakeawayResult.AlreadyCompleted;
            }
            if (ex.Message.Contains("only valid for Takeaway", StringComparison.OrdinalIgnoreCase))
            {
                return CompleteCashTakeawayResult.InvalidOrderType;
            }
            return CompleteCashTakeawayResult.InvalidState;
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return CompleteCashTakeawayResult.StaleData;
        }

        var dto = new CashierOrderDto(
            order.Id,
            order.PublicCode,
            order.CreatedAt,
            order.OrderType,
            order.Status,
            order.CustomerName,
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
            order.RowVersion,
            order.Items.Select(i => new CashierOrderItemDto(i.ProductNameAr, i.ProductNameEn, i.Quantity)).ToList());

        await notifier.NotifyAsync(dto, cancellationToken);

        try
        {
            await trackingNotifier.NotifyOrderUpdatedAsync(order.PublicCode, CancellationToken.None);
        }
        catch
        {
            // Best-effort: tracking notification failure must not affect cashier handoff result
        }

        return CompleteCashTakeawayResult.Success;
    }
}
