using BabAlHara.Domain.Ordering;

namespace BabAlHara.Application.Tracking;

public sealed record CustomerOrderItemDto(
    string ProductNameAr,
    string ProductNameEn,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record CustomerTimelineEntryDto(
    string Status,
    DateTimeOffset ChangedAt);

public sealed record CustomerOrderTrackingDto(
    string PublicCode,
    string Status,
    string OrderType,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastUpdatedAt,
    IReadOnlyList<CustomerOrderItemDto> Items,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    string PaymentMethod,
    string PaymentStatus,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address,
    IReadOnlyList<CustomerTimelineEntryDto> StatusTimeline);

public interface ICustomerOrderTrackingNotifier
{
    Task NotifyOrderUpdatedAsync(string publicCode, CancellationToken cancellationToken);
}

public interface ICustomerOrderTrackingService
{
    string GenerateTrackingToken();
    string HashToken(string rawToken);
    Task<CustomerOrderTrackingDto?> GetTrackingDataAsync(string publicCode, string rawToken, CancellationToken cancellationToken);
    Task<ReorderPreviewDto?> GetReorderPreviewAsync(string publicCode, string rawToken, CancellationToken cancellationToken);
}

public sealed record ReorderEligibleItemDto(
    Guid MenuItemId,
    string NameAr,
    string NameEn,
    string ImageReference,
    int Quantity,
    decimal CurrentPrice);

public sealed record ReorderUnavailableItemDto(
    Guid? MenuItemId,
    string HistoricalNameAr,
    string HistoricalNameEn,
    string Reason);

public sealed record ReorderPreviewDto(
    string PublicCode,
    string OrderType,
    IReadOnlyList<ReorderEligibleItemDto> EligibleItems,
    IReadOnlyList<ReorderUnavailableItemDto> UnavailableItems,
    Guid? SuggestedDeliveryAreaId,
    string? SuggestedDeliveryAreaNameAr,
    string? SuggestedDeliveryAreaNameEn,
    string? SuggestedAddress,
    string? SuggestedCustomerNote);
