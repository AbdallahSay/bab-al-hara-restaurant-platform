namespace BabAlHara.Domain.Delivery;

public sealed class DeliveryArea
{
    private DeliveryArea()
    {
    }

    public DeliveryArea(
        Guid id,
        string nameAr,
        string nameEn,
        decimal deliveryFee,
        int estimatedDeliveryMinutes,
        bool isActive = true)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(deliveryFee);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(estimatedDeliveryMinutes);

        Id = id;
        NameAr = RequireText(nameAr, nameof(nameAr));
        NameEn = RequireText(nameEn, nameof(nameEn));
        DeliveryFee = deliveryFee;
        EstimatedDeliveryMinutes = estimatedDeliveryMinutes;
        IsActive = isActive;
    }

    public Guid Id { get; private set; }

    public string NameAr { get; private set; } = string.Empty;

    public string NameEn { get; private set; } = string.Empty;

    public decimal DeliveryFee { get; private set; }

    public int EstimatedDeliveryMinutes { get; private set; }

    public bool IsActive { get; private set; }

    private static string RequireText(string value, string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A non-empty value is required.", parameterName)
            : value.Trim();
}
