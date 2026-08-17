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

public sealed record CategoryManagementDto(
    Guid Id,
    string NameAr,
    string NameEn,
    int DisplayOrder,
    bool IsActive,
    int ItemCount,
    string RowVersion);

public sealed record CreateCategoryRequest(
    string NameAr,
    string NameEn,
    int DisplayOrder,
    bool IsActive = true);

public sealed record UpdateCategoryRequest(
    string NameAr,
    string NameEn,
    int DisplayOrder,
    bool IsActive,
    string? RowVersion);

public sealed record ToggleActiveRequest(
    bool IsActive,
    string? RowVersion);

public sealed record MenuItemManagementDto(
    Guid Id,
    Guid CategoryId,
    string CategoryNameAr,
    string CategoryNameEn,
    string NameAr,
    string NameEn,
    string DescriptionAr,
    string DescriptionEn,
    decimal Price,
    string ImageReference,
    int PreparationMinutes,
    int DisplayOrder,
    bool IsActive,
    bool IsAvailable,
    string RowVersion);

public sealed record CreateMenuItemRequest(
    Guid CategoryId,
    string NameAr,
    string NameEn,
    string DescriptionAr,
    string DescriptionEn,
    decimal Price,
    string ImageReference,
    int PreparationMinutes,
    int DisplayOrder,
    bool IsActive = true,
    bool IsAvailable = true);

public sealed record UpdateMenuItemRequest(
    Guid CategoryId,
    string NameAr,
    string NameEn,
    string DescriptionAr,
    string DescriptionEn,
    decimal Price,
    string ImageReference,
    int PreparationMinutes,
    int DisplayOrder,
    bool IsActive,
    bool IsAvailable,
    string? RowVersion);

public sealed record ToggleMenuItemAvailabilityRequest(
    bool IsAvailable,
    string? RowVersion);

public static class ManagementCatalogResult
{
    public static ManagementCatalogResult<T> Success<T>(T data) =>
        new(true, Data: data);

    public static ManagementCatalogResult<T> NotFound<T>(string message = "Entity not found.") =>
        new(false, ErrorCode: "not_found", ErrorMessage: message, IsNotFound: true);

    public static ManagementCatalogResult<T> Conflict<T>(string message = "The entity has been modified by another operation.") =>
        new(false, ErrorCode: "stale_conflict", ErrorMessage: message, IsConflict: true);

    public static ManagementCatalogResult<T> ValidationError<T>(string message, string code = "validation_error") =>
        new(false, ErrorCode: code, ErrorMessage: message, IsValidation: true);
}

public sealed record ManagementCatalogResult<T>(
    bool IsSuccess,
    T? Data = default,
    string? ErrorCode = null,
    string? ErrorMessage = null,
    bool IsNotFound = false,
    bool IsConflict = false,
    bool IsValidation = false);

public interface IMenuQueryService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<MenuItemDto>> GetItemsAsync(
        Guid? categoryId,
        CancellationToken cancellationToken);

    Task<MenuItemDto?> GetItemAsync(Guid id, CancellationToken cancellationToken);
}

public interface IManagementCatalogService
{
    Task<IReadOnlyList<CategoryManagementDto>> GetCategoriesAsync(CancellationToken cancellationToken);

    Task<CategoryManagementDto?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<ManagementCatalogResult<CategoryManagementDto>> CreateCategoryAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken);

    Task<ManagementCatalogResult<CategoryManagementDto>> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken);

    Task<ManagementCatalogResult<CategoryManagementDto>> ToggleCategoryActiveAsync(
        Guid id,
        ToggleActiveRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MenuItemManagementDto>> GetMenuItemsAsync(
        Guid? categoryId,
        CancellationToken cancellationToken);

    Task<MenuItemManagementDto?> GetMenuItemByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<ManagementCatalogResult<MenuItemManagementDto>> CreateMenuItemAsync(
        CreateMenuItemRequest request,
        CancellationToken cancellationToken);

    Task<ManagementCatalogResult<MenuItemManagementDto>> UpdateMenuItemAsync(
        Guid id,
        UpdateMenuItemRequest request,
        CancellationToken cancellationToken);

    Task<ManagementCatalogResult<MenuItemManagementDto>> ToggleMenuItemAvailabilityAsync(
        Guid id,
        ToggleMenuItemAvailabilityRequest request,
        CancellationToken cancellationToken);

    Task<ManagementCatalogResult<MenuItemManagementDto>> ToggleMenuItemActiveAsync(
        Guid id,
        ToggleActiveRequest request,
        CancellationToken cancellationToken);
}
