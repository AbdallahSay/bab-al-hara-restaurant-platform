namespace BabAlHara.Application.Catalog;

public sealed record CategoryDto(Guid Id, string NameAr, string NameEn, int DisplayOrder);

public sealed record MenuItemDto(
    Guid Id,
    Guid CategoryId,
    string NameAr,
    string NameEn,
    string DescriptionAr,
    string DescriptionEn,
    decimal Price,
    string ImageReference,
    int PreparationMinutes,
    bool IsAvailable);

public interface IMenuQueryService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MenuItemDto>> GetItemsAsync(
        Guid? categoryId,
        CancellationToken cancellationToken);

    Task<MenuItemDto?> GetItemAsync(Guid id, CancellationToken cancellationToken);
}
