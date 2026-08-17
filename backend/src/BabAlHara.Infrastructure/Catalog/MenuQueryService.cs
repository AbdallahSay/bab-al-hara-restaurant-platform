using BabAlHara.Application.Catalog;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Catalog;

public sealed class MenuQueryService(AppDbContext dbContext) : IMenuQueryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(
        CancellationToken cancellationToken) =>
        await dbContext.Categories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.NameEn)
            .Select(category => new CategoryDto(
                category.Id,
                category.NameAr,
                category.NameEn,
                category.DisplayOrder))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MenuItemDto>> GetItemsAsync(
        Guid? categoryId,
        CancellationToken cancellationToken) =>
        await dbContext.MenuItems
            .AsNoTracking()
            .Where(item => item.IsActive && item.Category.IsActive)
            .Where(item => !categoryId.HasValue || item.CategoryId == categoryId)
            .OrderBy(item => item.Category.DisplayOrder)
            .ThenBy(item => item.DisplayOrder)
            .ThenBy(item => item.NameEn)
            .Select(item => Map(item))
            .ToListAsync(cancellationToken);

    public Task<MenuItemDto?> GetItemAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.MenuItems
            .AsNoTracking()
            .Where(item => item.Id == id && item.IsActive && item.Category.IsActive)
            .Select(item => Map(item))
            .SingleOrDefaultAsync(cancellationToken);

    private static MenuItemDto Map(Domain.Catalog.MenuItem item) =>
        new(
            item.Id,
            item.CategoryId,
            item.NameAr,
            item.NameEn,
            item.DescriptionAr,
            item.DescriptionEn,
            item.Price,
            item.ImageReference,
            item.PreparationMinutes,
            item.IsAvailable);
}
