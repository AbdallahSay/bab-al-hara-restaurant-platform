using BabAlHara.Application.Catalog;
using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Catalog;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabAlHara.Infrastructure.Catalog;

public sealed partial class ManagementCatalogService(
    AppDbContext dbContext,
    IKitchenRealtimeNotifier realtimeNotifier,
    ILogger<ManagementCatalogService> logger) : IManagementCatalogService
{
    public async Task<IReadOnlyList<CategoryManagementDto>> GetCategoriesAsync(
        CancellationToken cancellationToken)
    {
        var categories = await dbContext.Categories
            .AsNoTracking()
            .Include(c => c.MenuItems)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NameEn)
            .ToListAsync(cancellationToken);

        return categories.Select(MapCategory).ToList();
    }

    public async Task<CategoryManagementDto?> GetCategoryByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories
            .AsNoTracking()
            .Include(c => c.MenuItems)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

        return category is null ? null : MapCategory(category);
    }

    public async Task<ManagementCatalogResult<CategoryManagementDto>> CreateCategoryAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationError = ValidateCategoryInputs(request.NameAr, request.NameEn, request.DisplayOrder);
        if (validationError is not null)
        {
            return ManagementCatalogResult.ValidationError<CategoryManagementDto>(validationError);
        }

        var category = new Category(
            Guid.NewGuid(),
            request.NameAr,
            request.NameEn,
            request.DisplayOrder,
            request.IsActive);

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ManagementCatalogResult.Success(MapCategory(category));
    }

    public async Task<ManagementCatalogResult<CategoryManagementDto>> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var category = await dbContext.Categories
            .Include(c => c.MenuItems)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (category is null)
        {
            return ManagementCatalogResult.NotFound<CategoryManagementDto>($"Category '{id}' was not found.");
        }

        var concurrencyResult = CheckConcurrency(category, request.RowVersion);
        if (concurrencyResult is not null)
        {
            return concurrencyResult;
        }

        var validationError = ValidateCategoryInputs(request.NameAr, request.NameEn, request.DisplayOrder);
        if (validationError is not null)
        {
            return ManagementCatalogResult.ValidationError<CategoryManagementDto>(validationError);
        }

        category.Update(request.NameAr, request.NameEn, request.DisplayOrder, request.IsActive);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<CategoryManagementDto>();
        }

        return ManagementCatalogResult.Success(MapCategory(category));
    }

    public async Task<ManagementCatalogResult<CategoryManagementDto>> ToggleCategoryActiveAsync(
        Guid id,
        ToggleActiveRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var category = await dbContext.Categories
            .Include(c => c.MenuItems)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (category is null)
        {
            return ManagementCatalogResult.NotFound<CategoryManagementDto>($"Category '{id}' was not found.");
        }

        var concurrencyResult = CheckConcurrency(category, request.RowVersion);
        if (concurrencyResult is not null)
        {
            return concurrencyResult;
        }

        category.SetActive(request.IsActive);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<CategoryManagementDto>();
        }

        return ManagementCatalogResult.Success(MapCategory(category));
    }

    public async Task<IReadOnlyList<MenuItemManagementDto>> GetMenuItemsAsync(
        Guid? categoryId,
        CancellationToken cancellationToken)
    {
        var items = await dbContext.MenuItems
            .AsNoTracking()
            .Include(m => m.Category)
            .Where(m => !categoryId.HasValue || m.CategoryId == categoryId.Value)
            .OrderBy(m => m.Category.DisplayOrder)
            .ThenBy(m => m.DisplayOrder)
            .ThenBy(m => m.NameEn)
            .ToListAsync(cancellationToken);

        return items.Select(MapMenuItem).ToList();
    }

    public async Task<MenuItemManagementDto?> GetMenuItemByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var item = await dbContext.MenuItems
            .AsNoTracking()
            .Include(m => m.Category)
            .SingleOrDefaultAsync(m => m.Id == id, cancellationToken);

        return item is null ? null : MapMenuItem(item);
    }

    public async Task<ManagementCatalogResult<MenuItemManagementDto>> CreateMenuItemAsync(
        CreateMenuItemRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var category = await dbContext.Categories
            .SingleOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (category is null)
        {
            return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(
                $"Category '{request.CategoryId}' does not exist.",
                "category_not_found");
        }

        var validationError = ValidateMenuItemInputs(
            request.NameAr,
            request.NameEn,
            request.DescriptionAr,
            request.DescriptionEn,
            request.Price,
            request.ImageReference,
            request.PreparationMinutes,
            request.DisplayOrder);

        if (validationError is not null)
        {
            return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(validationError);
        }

        var item = new MenuItem(
            Guid.NewGuid(),
            request.CategoryId,
            request.NameAr,
            request.NameEn,
            request.DescriptionAr,
            request.DescriptionEn,
            request.Price,
            request.ImageReference,
            request.PreparationMinutes,
            request.DisplayOrder,
            request.IsActive,
            request.IsAvailable);

        dbContext.MenuItems.Add(item);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ManagementCatalogResult.Success(MapMenuItem(item, category));
    }

    public async Task<ManagementCatalogResult<MenuItemManagementDto>> UpdateMenuItemAsync(
        Guid id,
        UpdateMenuItemRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var item = await dbContext.MenuItems
            .Include(m => m.Category)
            .SingleOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (item is null)
        {
            return ManagementCatalogResult.NotFound<MenuItemManagementDto>($"Menu item '{id}' was not found.");
        }

        var concurrencyResult = CheckConcurrency(item, request.RowVersion);
        if (concurrencyResult is not null)
        {
            return concurrencyResult;
        }

        if (item.CategoryId != request.CategoryId)
        {
            var targetCategory = await dbContext.Categories
                .SingleOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);

            if (targetCategory is null)
            {
                return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(
                    $"Category '{request.CategoryId}' does not exist.",
                    "category_not_found");
            }
        }

        var validationError = ValidateMenuItemInputs(
            request.NameAr,
            request.NameEn,
            request.DescriptionAr,
            request.DescriptionEn,
            request.Price,
            request.ImageReference,
            request.PreparationMinutes,
            request.DisplayOrder);

        if (validationError is not null)
        {
            return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(validationError);
        }

        var availabilityChanged = item.IsAvailable != request.IsAvailable;

        item.Update(
            request.CategoryId,
            request.NameAr,
            request.NameEn,
            request.DescriptionAr,
            request.DescriptionEn,
            request.Price,
            request.ImageReference,
            request.PreparationMinutes,
            request.DisplayOrder,
            request.IsActive,
            request.IsAvailable);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>();
        }

        if (availabilityChanged)
        {
            await BroadcastAvailabilityChangedAsync(item.Id, item.IsAvailable);
        }

        return ManagementCatalogResult.Success(MapMenuItem(item));
    }

    public async Task<ManagementCatalogResult<MenuItemManagementDto>> ToggleMenuItemAvailabilityAsync(
        Guid id,
        ToggleMenuItemAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var item = await dbContext.MenuItems
            .Include(m => m.Category)
            .SingleOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (item is null)
        {
            return ManagementCatalogResult.NotFound<MenuItemManagementDto>($"Menu item '{id}' was not found.");
        }

        var concurrencyResult = CheckConcurrency(item, request.RowVersion);
        if (concurrencyResult is not null)
        {
            return concurrencyResult;
        }

        item.SetAvailability(request.IsAvailable);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>();
        }

        await BroadcastAvailabilityChangedAsync(item.Id, item.IsAvailable);

        return ManagementCatalogResult.Success(MapMenuItem(item));
    }

    public async Task<ManagementCatalogResult<MenuItemManagementDto>> ToggleMenuItemActiveAsync(
        Guid id,
        ToggleActiveRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var item = await dbContext.MenuItems
            .Include(m => m.Category)
            .SingleOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (item is null)
        {
            return ManagementCatalogResult.NotFound<MenuItemManagementDto>($"Menu item '{id}' was not found.");
        }

        var concurrencyResult = CheckConcurrency(item, request.RowVersion);
        if (concurrencyResult is not null)
        {
            return concurrencyResult;
        }

        item.SetActive(request.IsActive);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>();
        }

        return ManagementCatalogResult.Success(MapMenuItem(item));
    }

    public const long MaxImageSizeBytes = 5 * 1024 * 1024; // 5 MB

    public async Task<ManagementCatalogResult<MenuItemManagementDto>> UploadMenuItemImageAsync(
        Guid menuItemId,
        Stream imageStream,
        string contentType,
        string? fileName,
        long contentLength,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(imageStream);

        if (contentLength is <= 0 or > MaxImageSizeBytes)
        {
            return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(
                "Image file size must be between 1 byte and 5 MB.",
                "invalid_file_size");
        }

        using var memoryStream = new MemoryStream((int)Math.Min(contentLength, MaxImageSizeBytes));
        await imageStream.CopyToAsync(memoryStream, cancellationToken);
        var bytes = memoryStream.ToArray();

        if (bytes.Length == 0 || bytes.Length > MaxImageSizeBytes)
        {
            return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(
                "Image file size must be between 1 byte and 5 MB.",
                "invalid_file_size");
        }

        var resolvedContentType = InspectAndValidateImageSignature(bytes, contentType, fileName);
        if (resolvedContentType is null)
        {
            return ManagementCatalogResult.ValidationError<MenuItemManagementDto>(
                "Unsupported image format. Allowed formats are JPEG, PNG, and WEBP.",
                "invalid_image_format");
        }

        var item = await dbContext.MenuItems
            .Include(m => m.Category)
            .SingleOrDefaultAsync(m => m.Id == menuItemId, cancellationToken);

        if (item is null)
        {
            return ManagementCatalogResult.NotFound<MenuItemManagementDto>($"Menu item '{menuItemId}' was not found.");
        }

        var contentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(bytes)).ToLowerInvariant();
        var sanitizedFileName = string.IsNullOrWhiteSpace(fileName) ? null : Path.GetFileName(fileName);

        var asset = new MenuImageAsset(
            Guid.NewGuid(),
            resolvedContentType,
            bytes.Length,
            contentHash,
            bytes,
            sanitizedFileName,
            DateTimeOffset.UtcNow);

        dbContext.MenuImageAssets.Add(asset);
        item.SetImageAsset(asset.Id, $"/api/menu-images/{asset.Id}");

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>();
        }

        return ManagementCatalogResult.Success(MapMenuItem(item));
    }

    public async Task<ManagementCatalogResult<MenuItemManagementDto>> RemoveMenuItemImageAsync(
        Guid menuItemId,
        CancellationToken cancellationToken)
    {
        var item = await dbContext.MenuItems
            .Include(m => m.Category)
            .SingleOrDefaultAsync(m => m.Id == menuItemId, cancellationToken);

        if (item is null)
        {
            return ManagementCatalogResult.NotFound<MenuItemManagementDto>($"Menu item '{menuItemId}' was not found.");
        }

        item.ClearImageAsset("/images/menu/default.webp");

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>();
        }

        return ManagementCatalogResult.Success(MapMenuItem(item));
    }

    public async Task<ImageAssetBinary?> GetImageAssetAsync(
        Guid imageAssetId,
        CancellationToken cancellationToken)
    {
        return await dbContext.MenuImageAssets
            .AsNoTracking()
            .Where(a => a.Id == imageAssetId)
            .Select(a => new ImageAssetBinary(a.ContentType, a.ContentHash, a.Content))
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static string? InspectAndValidateImageSignature(byte[] bytes, string providedContentType, string? fileName)
    {
        if (bytes.Length < 12)
        {
            return null;
        }

        // JPEG: FF D8 FF
        if (bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF)
        {
            return "image/jpeg";
        }

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.Length >= 8 &&
            bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
            bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A)
        {
            return "image/png";
        }

        // WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
        if (bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
            bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50)
        {
            return "image/webp";
        }

        return null;
    }

    private async Task BroadcastAvailabilityChangedAsync(Guid itemId, bool isAvailable)
    {
        var evt = new MenuItemAvailabilityChangedEvent(itemId, isAvailable);
        try
        {
            await realtimeNotifier.NotifyMenuItemAvailabilityChangedAsync(evt, CancellationToken.None);
        }
        catch (Exception ex)
        {
            LogMenuItemBroadcastFailed(logger, itemId, ex);
        }
    }

    private ManagementCatalogResult<CategoryManagementDto>? CheckConcurrency(
        Category category,
        string? rowVersion)
    {
        if (string.IsNullOrWhiteSpace(rowVersion))
        {
            return null;
        }

        byte[] clientRowVersion;
        try
        {
            clientRowVersion = Convert.FromBase64String(rowVersion);
        }
        catch (FormatException)
        {
            return ManagementCatalogResult.Conflict<CategoryManagementDto>("The provided row version is not a valid Base64 string.");
        }

        if (category.RowVersion is not null && !category.RowVersion.SequenceEqual(clientRowVersion))
        {
            return ManagementCatalogResult.Conflict<CategoryManagementDto>();
        }

        dbContext.Entry(category).Property(c => c.RowVersion).OriginalValue = clientRowVersion;
        return null;
    }

    private ManagementCatalogResult<MenuItemManagementDto>? CheckConcurrency(
        MenuItem item,
        string? rowVersion)
    {
        if (string.IsNullOrWhiteSpace(rowVersion))
        {
            return null;
        }

        byte[] clientRowVersion;
        try
        {
            clientRowVersion = Convert.FromBase64String(rowVersion);
        }
        catch (FormatException)
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>("The provided row version is not a valid Base64 string.");
        }

        if (item.RowVersion is not null && !item.RowVersion.SequenceEqual(clientRowVersion))
        {
            return ManagementCatalogResult.Conflict<MenuItemManagementDto>();
        }

        dbContext.Entry(item).Property(m => m.RowVersion).OriginalValue = clientRowVersion;
        return null;
    }

    private static string? ValidateCategoryInputs(string nameAr, string nameEn, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(nameAr) || nameAr.Trim().Length > 120)
        {
            return "A valid Arabic name (1-120 characters) is required.";
        }

        if (string.IsNullOrWhiteSpace(nameEn) || nameEn.Trim().Length > 120)
        {
            return "A valid English name (1-120 characters) is required.";
        }

        if (displayOrder < 0)
        {
            return "Display order must be non-negative.";
        }

        return null;
    }

    private static string? ValidateMenuItemInputs(
        string nameAr,
        string nameEn,
        string descriptionAr,
        string descriptionEn,
        decimal price,
        string imageReference,
        int preparationMinutes,
        int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(nameAr) || nameAr.Trim().Length > 160)
        {
            return "A valid Arabic name (1-160 characters) is required.";
        }

        if (string.IsNullOrWhiteSpace(nameEn) || nameEn.Trim().Length > 160)
        {
            return "A valid English name (1-160 characters) is required.";
        }

        if (string.IsNullOrWhiteSpace(descriptionAr) || descriptionAr.Trim().Length > 600)
        {
            return "A valid Arabic description (1-600 characters) is required.";
        }

        if (string.IsNullOrWhiteSpace(descriptionEn) || descriptionEn.Trim().Length > 600)
        {
            return "A valid English description (1-600 characters) is required.";
        }

        if (price < 0)
        {
            return "Price must be non-negative.";
        }

        if (string.IsNullOrWhiteSpace(imageReference) || imageReference.Trim().Length > 240)
        {
            return "A valid image reference (1-240 characters) is required.";
        }

        if (preparationMinutes is < 1 or > 240)
        {
            return "Preparation time must be between 1 and 240 minutes.";
        }

        if (displayOrder < 0)
        {
            return "Display order must be non-negative.";
        }

        return null;
    }

    private static CategoryManagementDto MapCategory(Category category) =>
        new(
            category.Id,
            category.NameAr,
            category.NameEn,
            category.DisplayOrder,
            category.IsActive,
            category.MenuItems?.Count ?? 0,
            category.RowVersion != null ? Convert.ToBase64String(category.RowVersion) : string.Empty);

    private static MenuItemManagementDto MapMenuItem(MenuItem item) =>
        new(
            item.Id,
            item.CategoryId,
            item.Category?.NameAr ?? string.Empty,
            item.Category?.NameEn ?? string.Empty,
            item.NameAr,
            item.NameEn,
            item.DescriptionAr,
            item.DescriptionEn,
            item.Price,
            item.ImageReference,
            item.PreparationMinutes,
            item.DisplayOrder,
            item.IsActive,
            item.IsAvailable,
            item.RowVersion != null ? Convert.ToBase64String(item.RowVersion) : string.Empty);

    private static MenuItemManagementDto MapMenuItem(MenuItem item, Category category) =>
        new(
            item.Id,
            item.CategoryId,
            category.NameAr,
            category.NameEn,
            item.NameAr,
            item.NameEn,
            item.DescriptionAr,
            item.DescriptionEn,
            item.Price,
            item.ImageReference,
            item.PreparationMinutes,
            item.DisplayOrder,
            item.IsActive,
            item.IsAvailable,
            item.RowVersion != null ? Convert.ToBase64String(item.RowVersion) : string.Empty);

    [LoggerMessage(
        EventId = 4001,
        Level = LogLevel.Warning,
        Message = "Failed to broadcast MenuItemAvailabilityChanged realtime event for item {ItemId}")]
    private static partial void LogMenuItemBroadcastFailed(
        ILogger logger,
        Guid itemId,
        Exception exception);
}
