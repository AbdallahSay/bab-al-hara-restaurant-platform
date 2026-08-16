using BabAlHara.Domain.Ordering;

namespace BabAlHara.Application.Kitchen;

public sealed record KitchenOrderItemDto(
    string ProductNameAr,
    string ProductNameEn,
    int Quantity);

public sealed record KitchenOrderDto(
    string PublicCode,
    DateTimeOffset CreatedAt,
    OrderType OrderType,
    OrderStatus Status,
    string CustomerName,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address,
    string? CustomerNote,
    string? RowVersion,
    IReadOnlyList<KitchenOrderItemDto> Items);

public sealed record OrderStatusHistoryDto(
    Guid Id,
    OrderStatus PreviousStatus,
    OrderStatus NewStatus,
    string? ActorId,
    string? ActorName,
    string? ActorRole,
    DateTimeOffset ChangedAtUtc,
    string? Notes);

public sealed record KitchenOrderDetailsDto(
    string PublicCode,
    DateTimeOffset CreatedAt,
    OrderType OrderType,
    OrderStatus Status,
    string CustomerName,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address,
    string? CustomerNote,
    string? RowVersion,
    IReadOnlyList<KitchenOrderItemDto> Items,
    IReadOnlyList<OrderStatusHistoryDto> StatusHistory);

public sealed record OrderTransitionCommand(
    string PublicCode,
    OrderStatus TargetStatus,
    string? RowVersion = null,
    string? Notes = null,
    string? ActorId = null,
    string? ActorName = null,
    string? ActorRole = null);

public sealed record OrderTransitionResult(
    bool IsSuccess,
    KitchenOrderDto? Order = null,
    string? ErrorCode = null,
    string? ErrorMessage = null,
    bool IsConcurrencyConflict = false,
    bool IsNotFound = false,
    bool IsInvalidTransition = false)
{
    public static OrderTransitionResult Success(KitchenOrderDto order) =>
        new(true, Order: order);

    public static OrderTransitionResult NotFound(string publicCode) =>
        new(false, ErrorCode: "order_not_found", ErrorMessage: $"Order '{publicCode}' was not found.", IsNotFound: true);

    public static OrderTransitionResult ConcurrencyConflict(string message = "The order has been modified by another operation.") =>
        new(false, ErrorCode: "concurrency_conflict", ErrorMessage: message, IsConcurrencyConflict: true);

    public static OrderTransitionResult InvalidTransition(string message) =>
        new(false, ErrorCode: "invalid_order_transition", ErrorMessage: message, IsInvalidTransition: true);
}

public sealed record ToggleMenuItemAvailabilityCommand(
    Guid MenuItemId,
    bool IsAvailable);

public sealed record MenuItemAvailabilityResult(
    bool IsSuccess,
    Guid MenuItemId,
    bool IsAvailable,
    bool IsNotFound = false)
{
    public static MenuItemAvailabilityResult Success(Guid menuItemId, bool isAvailable) =>
        new(true, menuItemId, isAvailable);

    public static MenuItemAvailabilityResult NotFound(Guid menuItemId) =>
        new(false, menuItemId, false, IsNotFound: true);
}

public sealed record OrderStatusChangedEvent(
    string PublicCode,
    OrderStatus PreviousStatus,
    OrderStatus NewStatus,
    DateTimeOffset ChangedAtUtc,
    string? RowVersion);

public sealed record MenuItemAvailabilityChangedEvent(
    Guid MenuItemId,
    bool IsAvailable);

public interface IKitchenOrderQueryService
{
    Task<IReadOnlyList<KitchenOrderDto>> GetActiveAsync(CancellationToken cancellationToken);
    Task<KitchenOrderDetailsDto?> GetByPublicCodeAsync(string publicCode, CancellationToken cancellationToken);
    Task<IReadOnlyList<OrderStatusHistoryDto>> GetOrderHistoryAsync(string publicCode, CancellationToken cancellationToken);
}

public interface IKitchenOrderCommandService
{
    Task<OrderTransitionResult> TransitionOrderStatusAsync(
        OrderTransitionCommand command,
        CancellationToken cancellationToken);

    Task<MenuItemAvailabilityResult> ToggleMenuItemAvailabilityAsync(
        ToggleMenuItemAvailabilityCommand command,
        CancellationToken cancellationToken);
}

public interface IKitchenRealtimeNotifier
{
    Task NotifyOrderCreatedAsync(KitchenOrderDto order, CancellationToken cancellationToken);
    Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken);
    Task NotifyMenuItemAvailabilityChangedAsync(MenuItemAvailabilityChangedEvent evt, CancellationToken cancellationToken);
}

public interface INewOrderNotifier
{
    Task NotifyAsync(KitchenOrderDto order, CancellationToken cancellationToken);
}
