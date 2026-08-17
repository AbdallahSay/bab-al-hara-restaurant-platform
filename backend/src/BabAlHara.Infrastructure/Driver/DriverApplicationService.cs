using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Identity;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabAlHara.Infrastructure.Driver;

public sealed partial class DriverApplicationService(
    AppDbContext dbContext,
    UserManager<StaffUser> userManager,
    IDriverRealtimeNotifier realtimeNotifier,
    ICustomerOrderTrackingNotifier trackingNotifier,
    TimeProvider timeProvider,
    ILogger<DriverApplicationService> logger) : IDriverOrderService
{
    public async Task<IReadOnlyList<DriverSummaryDto>> GetAvailableDriversAsync(CancellationToken cancellationToken)
    {
        var drivers = await userManager.GetUsersInRoleAsync(DevelopmentDataSeeder.DriverRole);
        return drivers
            .Select(d => new DriverSummaryDto(
                d.Id,
                d.DisplayName,
                d.Email ?? string.Empty,
                d.PhoneNumber))
            .OrderBy(d => d.Name)
            .ToList();
    }

    public async Task<IReadOnlyList<DriverOrderDto>> GetAssignedOrdersAsync(Guid driverId, CancellationToken cancellationToken)
    {
        var activeOrders = await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.DriverId == driverId && (o.Status == OrderStatus.Ready || o.Status == OrderStatus.OnTheWay))
            .OrderBy(o => o.Status == OrderStatus.OnTheWay ? 0 : 1)
            .ThenBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var deliveredOrders = await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.DriverId == driverId && o.Status == OrderStatus.Delivered)
            .OrderByDescending(o => o.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        return activeOrders
            .Concat(deliveredOrders)
            .Select(MapDriverOrder)
            .ToList();
    }

    public async Task<AssignDriverResult> AssignDriverAsync(
        AssignDriverCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var driver = await userManager.FindByIdAsync(command.DriverId.ToString());
        if (driver is null)
        {
            return AssignDriverResult.DriverNotFound(command.DriverId);
        }

        var isDriver = await userManager.IsInRoleAsync(driver, DevelopmentDataSeeder.DriverRole);
        if (!isDriver)
        {
            return AssignDriverResult.InvalidOperation("The selected staff user is not assigned to the Driver role.");
        }

        var order = await FindOrderByIdOrCodeAsync(command.OrderIdOrCode, cancellationToken);
        if (order is null)
        {
            return AssignDriverResult.NotFound(command.OrderIdOrCode);
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
                return AssignDriverResult.ConcurrencyConflict("The provided row version is not a valid Base64 string.");
            }

            if (order.RowVersion is not null && !order.RowVersion.SequenceEqual(clientRowVersion))
            {
                return AssignDriverResult.ConcurrencyConflict();
            }

            dbContext.Entry(order).Property(o => o.RowVersion).OriginalValue = clientRowVersion;
        }

        try
        {
            order.AssignDriver(
                driver.Id,
                driver.DisplayName,
                command.ActorId,
                command.ActorRole,
                timeProvider.GetUtcNow());
        }
        catch (InvalidOperationException ex)
        {
            return AssignDriverResult.InvalidOperation(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return AssignDriverResult.InvalidOperation(ex.Message);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return AssignDriverResult.ConcurrencyConflict();
        }

        var orderDto = MapDriverOrder(order);
        var assignedEvent = new DriverAssignedEvent(
            order.PublicCode,
            driver.Id,
            driver.DisplayName,
            order.DriverAssignedAtUtc ?? timeProvider.GetUtcNow(),
            orderDto.RowVersion);

        try
        {
            await realtimeNotifier.NotifyDriverAssignedAsync(assignedEvent, CancellationToken.None);
        }
        catch (Exception ex)
        {
            LogDriverAssignedBroadcastFailed(logger, order.PublicCode, ex);
        }

        return AssignDriverResult.Success(orderDto);
    }

    public async Task<DriverTransitionResult> StartDeliveryAsync(
        DriverTransitionCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var order = await FindOrderByIdOrCodeAsync(command.OrderIdOrCode, cancellationToken);
        if (order is null)
        {
            return DriverTransitionResult.NotFound(command.OrderIdOrCode);
        }

        var isElevatedRole = string.Equals(command.ActorRole, DevelopmentDataSeeder.ManagerRole, StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(command.ActorRole, DevelopmentDataSeeder.AdminRole, StringComparison.OrdinalIgnoreCase);

        if (!isElevatedRole && order.DriverId != command.DriverId)
        {
            return DriverTransitionResult.Forbidden("You are not the driver assigned to this order.");
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
                return DriverTransitionResult.ConcurrencyConflict("The provided row version is not a valid Base64 string.");
            }

            if (order.RowVersion is not null && !order.RowVersion.SequenceEqual(clientRowVersion))
            {
                return DriverTransitionResult.ConcurrencyConflict();
            }

            dbContext.Entry(order).Property(o => o.RowVersion).OriginalValue = clientRowVersion;
        }

        var previousStatus = order.Status;
        try
        {
            order.TransitionStatus(
                OrderStatus.OnTheWay,
                command.DriverId.ToString(),
                command.ActorName,
                command.ActorRole,
                timeProvider.GetUtcNow(),
                command.Notes);
        }
        catch (InvalidOperationException ex)
        {
            return DriverTransitionResult.InvalidTransition(ex.Message);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return DriverTransitionResult.ConcurrencyConflict();
        }

        var orderDto = MapDriverOrder(order);
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
            LogDeliveryStatusBroadcastFailed(logger, order.PublicCode, ex);
        }

        try
        {
            await trackingNotifier.NotifyOrderUpdatedAsync(order.PublicCode, CancellationToken.None);
        }
        catch (Exception ex)
        {
            LogTrackingBroadcastFailed(logger, order.PublicCode, ex);
        }

        return DriverTransitionResult.Success(orderDto);
    }

    public async Task<DriverTransitionResult> MarkDeliveredAsync(
        DriverTransitionCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var order = await FindOrderByIdOrCodeAsync(command.OrderIdOrCode, cancellationToken);
        if (order is null)
        {
            return DriverTransitionResult.NotFound(command.OrderIdOrCode);
        }

        var isElevatedRole = string.Equals(command.ActorRole, DevelopmentDataSeeder.ManagerRole, StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(command.ActorRole, DevelopmentDataSeeder.AdminRole, StringComparison.OrdinalIgnoreCase);

        if (!isElevatedRole && order.DriverId != command.DriverId)
        {
            return DriverTransitionResult.Forbidden("You are not the driver assigned to this order.");
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
                return DriverTransitionResult.ConcurrencyConflict("The provided row version is not a valid Base64 string.");
            }

            if (order.RowVersion is not null && !order.RowVersion.SequenceEqual(clientRowVersion))
            {
                return DriverTransitionResult.ConcurrencyConflict();
            }

            dbContext.Entry(order).Property(o => o.RowVersion).OriginalValue = clientRowVersion;
        }

        var previousStatus = order.Status;
        try
        {
            order.TransitionStatus(
                OrderStatus.Delivered,
                command.DriverId.ToString(),
                command.ActorName,
                command.ActorRole,
                timeProvider.GetUtcNow(),
                command.Notes);
        }
        catch (InvalidOperationException ex)
        {
            return DriverTransitionResult.InvalidTransition(ex.Message);
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return DriverTransitionResult.ConcurrencyConflict();
        }

        var orderDto = MapDriverOrder(order);
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
            LogDeliveryStatusBroadcastFailed(logger, order.PublicCode, ex);
        }

        try
        {
            await trackingNotifier.NotifyOrderUpdatedAsync(order.PublicCode, CancellationToken.None);
        }
        catch (Exception ex)
        {
            LogTrackingBroadcastFailed(logger, order.PublicCode, ex);
        }

        return DriverTransitionResult.Success(orderDto);
    }

    private async Task<Order?> FindOrderByIdOrCodeAsync(string idOrCode, CancellationToken cancellationToken)
    {
        if (Guid.TryParse(idOrCode, out var orderId))
        {
            return await dbContext.Orders
                .Include(o => o.Items)
                .SingleOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        }

        return await dbContext.Orders
            .Include(o => o.Items)
            .SingleOrDefaultAsync(o => o.PublicCode == idOrCode, cancellationToken);
    }

    private static DriverOrderDto MapDriverOrder(Order order) =>
        new(
            order.Id,
            order.PublicCode,
            order.CreatedAt,
            order.OrderType,
            order.Status,
            order.CustomerName,
            order.CustomerPhone,
            order.DeliveryAreaId,
            order.DeliveryAreaNameAr,
            order.DeliveryAreaNameEn,
            order.Address,
            order.DeliveryFee,
            order.Subtotal,
            order.Total,
            order.CustomerNote,
            order.PaymentMethod,
            order.PaymentStatus,
            order.DriverId,
            order.DriverName,
            order.DriverAssignedAtUtc,
            order.RowVersion != null ? Convert.ToBase64String(order.RowVersion) : null,
            order.Items
                .OrderBy(item => item.Id)
                .Select(item => new DriverOrderItemDto(
                    item.ProductNameAr,
                    item.ProductNameEn,
                    item.Quantity,
                    item.UnitPrice,
                    item.LineTotal))
                .ToList());

    [LoggerMessage(
        EventId = 4001,
        Level = LogLevel.Warning,
        Message = "Failed to broadcast DriverAssigned realtime event for order {PublicCode}")]
    private static partial void LogDriverAssignedBroadcastFailed(
        ILogger logger,
        string publicCode,
        Exception exception);

    [LoggerMessage(
        EventId = 4002,
        Level = LogLevel.Warning,
        Message = "Failed to broadcast OrderStatusChanged delivery realtime event for order {PublicCode}")]
    private static partial void LogDeliveryStatusBroadcastFailed(
        ILogger logger,
        string publicCode,
        Exception exception);

    [LoggerMessage(
        EventId = 4003,
        Level = LogLevel.Warning,
        Message = "Failed to broadcast customer tracking update for order {PublicCode}")]
    private static partial void LogTrackingBroadcastFailed(
        ILogger logger,
        string publicCode,
        Exception exception);
}
