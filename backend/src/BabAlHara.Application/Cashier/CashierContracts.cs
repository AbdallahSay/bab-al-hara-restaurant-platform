using BabAlHara.Domain.Ordering;

namespace BabAlHara.Application.Cashier;

public sealed record CashierOrderItemDto(
    string ProductNameAr,
    string ProductNameEn,
    int Quantity);

public sealed record CashierOrderDto(
    Guid Id,
    string PublicCode,
    DateTimeOffset CreatedAt,
    OrderType OrderType,
    OrderStatus Status,
    string CustomerName,
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
    byte[] RowVersion,
    IReadOnlyList<CashierOrderItemDto> Items);

public enum CompleteCashTakeawayResult
{
    Success,
    NotFound,
    StaleData,
    InvalidState,
    InvalidOrderType,
    AlreadyCompleted,
}

public interface ICashierOrderService
{
    Task<IReadOnlyList<CashierOrderDto>> GetReadyOrdersAsync(CancellationToken cancellationToken);

    Task<CompleteCashTakeawayResult> CompleteCashTakeawayHandoffAsync(
        Guid orderId,
        byte[] rowVersion,
        string actorId,
        string actorRole,
        CancellationToken cancellationToken);
}

public interface ICashierOrderCompletedNotifier
{
    Task NotifyAsync(CashierOrderDto order, CancellationToken cancellationToken);
}
