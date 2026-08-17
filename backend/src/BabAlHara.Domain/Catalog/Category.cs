namespace BabAlHara.Domain.Catalog;

public sealed class Category
{
    private readonly List<MenuItem> menuItems = [];

    private Category()
    {
    }

    public Category(Guid id, string nameAr, string nameEn, int displayOrder, bool isActive = true)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(displayOrder);

        Id = id;
        NameAr = RequireText(nameAr, nameof(nameAr));
        NameEn = RequireText(nameEn, nameof(nameEn));
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public Guid Id { get; private set; }

    public string NameAr { get; private set; } = string.Empty;

    public string NameEn { get; private set; } = string.Empty;

    public int DisplayOrder { get; private set; }

    public bool IsActive { get; private set; }

    public byte[]? RowVersion { get; private set; }

    public IReadOnlyCollection<MenuItem> MenuItems => menuItems;

    public void Update(string nameAr, string nameEn, int displayOrder, bool isActive)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(displayOrder);

        NameAr = RequireText(nameAr, nameof(nameAr));
        NameEn = RequireText(nameEn, nameof(nameEn));
        DisplayOrder = displayOrder;
        IsActive = isActive;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
    }

    private static string RequireText(string value, string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A non-empty value is required.", parameterName)
            : value.Trim();
}
