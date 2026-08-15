namespace BabAlHara.Domain.Ordering;

public sealed class OrderItem
{
    private OrderItem()
    {
    }

    internal OrderItem(
        Guid id,
        Guid menuItemId,
        string productNameAr,
        string productNameEn,
        int quantity,
        decimal unitPrice)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegative(unitPrice);

        Id = id;
        MenuItemId = menuItemId;
        ProductNameAr = RequireText(productNameAr, nameof(productNameAr));
        ProductNameEn = RequireText(productNameEn, nameof(productNameEn));
        Quantity = quantity;
        UnitPrice = unitPrice;
        LineTotal = unitPrice * quantity;
    }

    public Guid Id { get; private set; }

    public Guid OrderId { get; private set; }

    public Order Order { get; private set; } = null!;

    public Guid MenuItemId { get; private set; }

    public string ProductNameAr { get; private set; } = string.Empty;

    public string ProductNameEn { get; private set; } = string.Empty;

    public int Quantity { get; private set; }

    public decimal UnitPrice { get; private set; }

    public decimal LineTotal { get; private set; }

    private static string RequireText(string value, string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A non-empty value is required.", parameterName)
            : value.Trim();
}
