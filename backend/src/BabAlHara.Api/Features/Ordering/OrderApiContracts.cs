using BabAlHara.Domain.Ordering;

namespace BabAlHara.Api.Features.Ordering;

public sealed record CreateOrderLineRequest(Guid MenuItemId, int Quantity);

public sealed record CreateOrderRequest(
    string? CustomerName,
    string? CustomerPhone,
    OrderType OrderType,
    Guid? DeliveryAreaId,
    string? Address,
    string? CustomerNote,
    IReadOnlyList<CreateOrderLineRequest>? Items);
