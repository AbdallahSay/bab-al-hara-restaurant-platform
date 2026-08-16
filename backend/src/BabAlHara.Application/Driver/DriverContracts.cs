using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Ordering;

namespace BabAlHara.Application.Driver;

public sealed record DriverOrderItemDto(
    string ProductNameAr,
    string ProductNameEn,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record DriverOrderDto(
    Guid Id,
    string PublicCode,
    DateTimeOffset CreatedAt,
    OrderType OrderType,
    OrderStatus Status,
    string CustomerName,
    string CustomerPhone,
    Guid? DeliveryAreaId,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address,
    decimal DeliveryFee,
    decimal Subtotal,
    decimal Total,
    string? CustomerNote,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus,
    Guid? DriverId,
    string? DriverName,
    DateTimeOffset? DriverAssignedAtUtc,
    string? RowVersion,
    IReadOnlyList<DriverOrderItemDto> Items);

public sealed record DriverSummaryDto(
    Guid Id,
    string Name,
    string Email,
    string? PhoneNumber);

public sealed record AssignDriverCommand(
    string OrderIdOrCode,
    Guid DriverId,
    string? RowVersion = null,
    string? ActorId = null,
    string? ActorRole = null);

public sealed record AssignDriverResult(
    bool IsSuccess,
    DriverOrderDto? Order = null,
    string? ErrorCode = null,
    string? ErrorMessage = null,
    bool IsNotFound = false,
    bool IsDriverNotFound = false,
    bool IsConcurrencyConflict = false,
    bool IsInvalidOperation = false)
{
    public static AssignDriverResult Success(DriverOrderDto order) =>
        new(true, Order: order);

    public static AssignDriverResult NotFound(string idOrCode) =>
        new(false, ErrorCode: "order_not_found", ErrorMessage: $"Order '{idOrCode}' was not found.", IsNotFound: true);

    public static AssignDriverResult DriverNotFound(Guid driverId) =>
        new(false, ErrorCode: "driver_not_found", ErrorMessage: $"Driver '{driverId}' was not found.", IsDriverNotFound: true);

    public static AssignDriverResult ConcurrencyConflict(string message = "The order has been modified by another operation.") =>
        new(false, ErrorCode: "concurrency_conflict", ErrorMessage: message, IsConcurrencyConflict: true);

    public static AssignDriverResult InvalidOperation(string message) =>
        new(false, ErrorCode: "invalid_order_transition", ErrorMessage: message, IsInvalidOperation: true);
}

public sealed record DriverTransitionCommand(
    string OrderIdOrCode,
    Guid DriverId,
    string? RowVersion = null,
    string? Notes = null,
    string? ActorName = null,
    string? ActorRole = null);

public sealed record DriverTransitionResult(
    bool IsSuccess,
    DriverOrderDto? Order = null,
    string? ErrorCode = null,
    string? ErrorMessage = null,
    bool IsNotFound = false,
    bool IsForbidden = false,
    bool IsConcurrencyConflict = false,
    bool IsInvalidTransition = false)
{
    public static DriverTransitionResult Success(DriverOrderDto order) =>
        new(true, Order: order);

    public static DriverTransitionResult NotFound(string idOrCode) =>
        new(false, ErrorCode: "order_not_found", ErrorMessage: $"Order '{idOrCode}' was not found.", IsNotFound: true);

    public static DriverTransitionResult Forbidden(string message = "You are not authorized to perform this transition on the order.") =>
        new(false, ErrorCode: "forbidden", ErrorMessage: message, IsForbidden: true);

    public static DriverTransitionResult ConcurrencyConflict(string message = "The order has been modified by another operation.") =>
        new(false, ErrorCode: "concurrency_conflict", ErrorMessage: message, IsConcurrencyConflict: true);

    public static DriverTransitionResult InvalidTransition(string message) =>
        new(false, ErrorCode: "invalid_order_transition", ErrorMessage: message, IsInvalidTransition: true);
}

public sealed record DriverAssignedEvent(
    string PublicCode,
    Guid DriverId,
    string DriverName,
    DateTimeOffset AssignedAtUtc,
    string? RowVersion);

public interface IDriverOrderService
{
    Task<IReadOnlyList<DriverSummaryDto>> GetAvailableDriversAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<DriverOrderDto>> GetAssignedOrdersAsync(Guid driverId, CancellationToken cancellationToken);
    Task<AssignDriverResult> AssignDriverAsync(AssignDriverCommand command, CancellationToken cancellationToken);
    Task<DriverTransitionResult> StartDeliveryAsync(DriverTransitionCommand command, CancellationToken cancellationToken);
    Task<DriverTransitionResult> MarkDeliveredAsync(DriverTransitionCommand command, CancellationToken cancellationToken);
}

public interface IDriverRealtimeNotifier
{
    Task NotifyDriverAssignedAsync(DriverAssignedEvent evt, CancellationToken cancellationToken);
    Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken);
}
