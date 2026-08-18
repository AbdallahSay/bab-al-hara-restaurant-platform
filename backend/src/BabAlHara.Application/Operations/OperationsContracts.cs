using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Ordering;

namespace BabAlHara.Application.Operations;

public sealed record OperationsSummaryDto(
    int ActiveOrders,
    int Pending,
    int Confirmed,
    int Preparing,
    int Ready,
    int OnTheWay,
    int DeliveryWaitingForDriver);

public sealed record OperationsAttentionItemDto(
    Guid OrderId,
    string PublicCode,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset CurrentStatusSinceUtc,
    OrderType OrderType,
    OrderStatus Status,
    string ReasonCode,
    string CustomerName,
    decimal Total);

public sealed record OperationsOrderItemDto(
    string ProductNameAr,
    string ProductNameEn,
    int Quantity);

public sealed record OperationsStatusHistoryDto(
    OrderStatus PreviousStatus,
    OrderStatus NewStatus,
    string? ActorRole,
    DateTimeOffset ChangedAtUtc,
    string? Notes);

public sealed record OperationsActiveOrderDto(
    Guid OrderId,
    string PublicCode,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset CurrentStatusSinceUtc,
    OrderType OrderType,
    OrderStatus Status,
    string CustomerName,
    string CustomerPhone,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address,
    string? CustomerNote,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus,
    Guid? DriverId,
    string? DriverName,
    DateTimeOffset? DriverAssignedAtUtc,
    IReadOnlyList<OperationsOrderItemDto> Items,
    IReadOnlyList<OperationsStatusHistoryDto> StatusHistory);

public sealed record OperationsCommandCenterResponse(
    OperationsSummaryDto Summary,
    IReadOnlyList<OperationsAttentionItemDto> AttentionItems,
    IReadOnlyList<OperationsActiveOrderDto> ActiveOrders);

public interface IOperationsQueryService
{
    Task<OperationsCommandCenterResponse> GetOperationsSnapshotAsync(CancellationToken cancellationToken);
}

public interface IOperationsRealtimeNotifier
{
    Task NotifyOperationsUpdatedAsync(CancellationToken cancellationToken);
    Task NotifyOrderCreatedAsync(string publicCode, CancellationToken cancellationToken);
    Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken);
    Task NotifyDriverAssignedAsync(DriverAssignedEvent evt, CancellationToken cancellationToken);
}
