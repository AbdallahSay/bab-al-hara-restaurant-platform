using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabAlHara.Infrastructure.Kitchen;

public sealed partial class KitchenOrderCommandService(
    AppDbContext dbContext,
    IKitchenRealtimeNotifier realtimeNotifier,
    TimeProvider timeProvider,
    ILogger<KitchenOrderCommandService> logger) : IKitchenOrderCommandService
{
    private static readonly HashSet<OrderStatus> AllowedKitchenTargetStatuses =
    [
        OrderStatus.Confirmed,
        OrderStatus.Preparing,
        OrderStatus.Ready,
    ];

    public async Task<OrderTransitionResult> TransitionOrderStatusAsync(
        OrderTransitionCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (!AllowedKitchenTargetStatuses.Contains(command.TargetStatus))
        {
            return OrderTransitionResult.InvalidTransition(
                $"Kitchen operations only allow transitions to Confirmed, Preparing, or Ready. '{command.TargetStatus}' is not allowed.");
        }

        var order = await dbContext.Orders
            .Include(o => o.Items)
            .SingleOrDefaultAsync(o => o.PublicCode == command.PublicCode, cancellationToken);

        if (order is null)
        {
            return OrderTransitionResult.NotFound(command.PublicCode);
        }

        if (!string.IsNullOrWhiteSpace(command.RowVersion))
        {
            byte[] clientRowVersion;
            try
            {
                clientRowVersion = Convert.FromBase64String(command.RowVersion);
            }
            catch (FormatException)
            {
                return OrderTransitionResult.ConcurrencyConflict("The provided row version is not a valid Base64 string.");
            }

            if (order.RowVersion is not null && !order.RowVersion.SequenceEqual(clientRowVersion))
            {
                return OrderTransitionResult.ConcurrencyConflict();
            }

            dbContext.Entry(order).Property(o => o.RowVersion).OriginalValue = clientRowVersion;
        }

        var previousStatus = order.Status;
        try
        {
            order.TransitionStatus(
                command.TargetStatus,
                command.ActorId,
                command.ActorName,
                command.ActorRole,
                timeProvider.GetUtcNow(),
                command.Notes);
        }
        catch (InvalidOperationException ex)
        {
            return OrderTransitionResult.InvalidTransition(ex.Message);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return OrderTransitionResult.ConcurrencyConflict();
        }

        var orderDto = MapKitchenOrder(order);
        var changedEvent = new OrderStatusChangedEvent(
            order.PublicCode,
            previousStatus,
            order.Status,
            timeProvider.GetUtcNow(),
            orderDto.RowVersion);

        try
        {
            await realtimeNotifier.NotifyOrderStatusChangedAsync(changedEvent, CancellationToken.None);
        }
        catch (Exception ex)
        {
            LogRealtimeBroadcastFailed(logger, order.PublicCode, ex);
        }

        return OrderTransitionResult.Success(orderDto);
    }

    public async Task<MenuItemAvailabilityResult> ToggleMenuItemAvailabilityAsync(
        ToggleMenuItemAvailabilityCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var item = await dbContext.MenuItems
            .SingleOrDefaultAsync(m => m.Id == command.MenuItemId, cancellationToken);

        if (item is null)
        {
            return MenuItemAvailabilityResult.NotFound(command.MenuItemId);
        }

        item.SetAvailability(command.IsAvailable);
        await dbContext.SaveChangesAsync(cancellationToken);

        var changedEvent = new MenuItemAvailabilityChangedEvent(item.Id, item.IsAvailable);
        try
        {
            await realtimeNotifier.NotifyMenuItemAvailabilityChangedAsync(changedEvent, CancellationToken.None);
        }
        catch (Exception ex)
        {
            LogMenuItemBroadcastFailed(logger, item.Id, ex);
        }

        return MenuItemAvailabilityResult.Success(item.Id, item.IsAvailable);
    }

    private static KitchenOrderDto MapKitchenOrder(Order order) =>
        new(
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
                .ToList());

    [LoggerMessage(
        EventId = 3001,
        Level = LogLevel.Warning,
        Message = "Failed to broadcast OrderStatusChanged realtime event for order {PublicCode}")]
    private static partial void LogRealtimeBroadcastFailed(
        ILogger logger,
        string publicCode,
        Exception exception);

    [LoggerMessage(
        EventId = 3002,
        Level = LogLevel.Warning,
        Message = "Failed to broadcast MenuItemAvailabilityChanged realtime event for item {ItemId}")]
    private static partial void LogMenuItemBroadcastFailed(
        ILogger logger,
        Guid itemId,
        Exception exception);
}
