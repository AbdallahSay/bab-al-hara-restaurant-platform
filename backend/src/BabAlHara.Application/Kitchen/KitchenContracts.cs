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
    IReadOnlyList<KitchenOrderItemDto> Items);

public interface IKitchenOrderQueryService
{
    Task<IReadOnlyList<KitchenOrderDto>> GetActiveAsync(CancellationToken cancellationToken);
}

public interface INewOrderNotifier
{
    Task NotifyAsync(KitchenOrderDto order, CancellationToken cancellationToken);
}
