using BabAlHara.Domain.Ordering;

namespace BabAlHara.Application.Ordering;

public sealed record CreateOrderLine(Guid MenuItemId, int Quantity);

public sealed record CreateOrderCommand(
    string CustomerName,
    string CustomerPhone,
    OrderType OrderType,
    Guid? DeliveryAreaId,
    string? Address,
    string? CustomerNote,
    IReadOnlyList<CreateOrderLine> Items,
    Guid? CustomerId = null);

public sealed record CreatedOrderDto(
    string PublicCode,
    DateTimeOffset CreatedAt,
    OrderType OrderType,
    OrderStatus Status,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus);

public sealed record OrderRejection(string Code, string Message, bool IsConflict = false);

public sealed record CreateOrderOutcome(
    CreatedOrderDto? Order,
    string? RawTrackingToken,
    DateTimeOffset? TrackingTokenExpiresAtUtc,
    OrderRejection? Rejection)
{
    public bool IsSuccess => Order is not null;

    public static CreateOrderOutcome Success(
        CreatedOrderDto order,
        string rawTrackingToken,
        DateTimeOffset trackingTokenExpiresAtUtc) =>
        new(order, rawTrackingToken, trackingTokenExpiresAtUtc, null);

    public static CreateOrderOutcome Failure(string code, string message, bool isConflict = false) =>
        new(null, null, null, new OrderRejection(code, message, isConflict));
}

public interface IOrderApplicationService
{
    Task<CreateOrderOutcome> CreateAsync(
        CreateOrderCommand command,
        CancellationToken cancellationToken);
}

public interface IOrderCodeGenerator
{
    string Create(DateTimeOffset timestamp);
}
