namespace BabAlHara.Application.Delivery;

public sealed record DeliveryAreaDto(
    Guid Id,
    string NameAr,
    string NameEn,
    decimal DeliveryFee,
    int EstimatedDeliveryMinutes);

public interface IDeliveryAreaQueryService
{
    Task<IReadOnlyList<DeliveryAreaDto>> GetActiveAsync(CancellationToken cancellationToken);
}
