namespace BabAlHara.Domain.Catalog;

public sealed class MenuItem
{
    private MenuItem()
    {
    }

    public MenuItem(
        Guid id,
        Guid categoryId,
        string nameAr,
        string nameEn,
        string descriptionAr,
        string descriptionEn,
        decimal price,
        string imageReference,
        int preparationMinutes,
        int displayOrder = 0,
        bool isActive = true,
        bool isAvailable = true)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(price);
        ArgumentOutOfRangeException.ThrowIfLessThan(preparationMinutes, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(preparationMinutes, 240);
        ArgumentOutOfRangeException.ThrowIfNegative(displayOrder);

        Id = id;
        CategoryId = categoryId;
        NameAr = RequireText(nameAr, nameof(nameAr));
        NameEn = RequireText(nameEn, nameof(nameEn));
        DescriptionAr = RequireText(descriptionAr, nameof(descriptionAr));
        DescriptionEn = RequireText(descriptionEn, nameof(descriptionEn));
        Price = price;
        ImageReference = RequireText(imageReference, nameof(imageReference));
        PreparationMinutes = preparationMinutes;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        IsAvailable = isAvailable;
    }

    public Guid Id { get; private set; }

    public Guid CategoryId { get; private set; }

    public Category Category { get; private set; } = null!;

    public string NameAr { get; private set; } = string.Empty;

    public string NameEn { get; private set; } = string.Empty;

    public string DescriptionAr { get; private set; } = string.Empty;

    public string DescriptionEn { get; private set; } = string.Empty;

    public decimal Price { get; private set; }

    public string ImageReference { get; private set; } = string.Empty;

    public int PreparationMinutes { get; private set; }

    public int DisplayOrder { get; private set; }

    public bool IsActive { get; private set; }

    public bool IsAvailable { get; private set; }

    public byte[]? RowVersion { get; private set; }

    public void Update(
        Guid categoryId,
        string nameAr,
        string nameEn,
        string descriptionAr,
        string descriptionEn,
        decimal price,
        string imageReference,
        int preparationMinutes,
        int displayOrder,
        bool isActive,
        bool isAvailable)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(price);
        ArgumentOutOfRangeException.ThrowIfLessThan(preparationMinutes, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(preparationMinutes, 240);
        ArgumentOutOfRangeException.ThrowIfNegative(displayOrder);

        CategoryId = categoryId;
        NameAr = RequireText(nameAr, nameof(nameAr));
        NameEn = RequireText(nameEn, nameof(nameEn));
        DescriptionAr = RequireText(descriptionAr, nameof(descriptionAr));
        DescriptionEn = RequireText(descriptionEn, nameof(descriptionEn));
        Price = price;
        ImageReference = RequireText(imageReference, nameof(imageReference));
        PreparationMinutes = preparationMinutes;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        IsAvailable = isAvailable;
    }

    public void SetAvailability(bool isAvailable)
    {
        IsAvailable = isAvailable;
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
