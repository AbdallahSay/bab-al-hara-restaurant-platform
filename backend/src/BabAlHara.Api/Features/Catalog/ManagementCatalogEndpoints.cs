using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Catalog;
using Microsoft.AspNetCore.Antiforgery;

namespace BabAlHara.Api.Features.Catalog;

public static class ManagementCatalogEndpoints
{
    public static IEndpointRouteBuilder MapManagementCatalogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var management = endpoints
            .MapGroup("/api/management")
            .WithTags("ManagementCatalog")
            .RequireAuthorization(AuthorizationPolicies.Management);

        //
        // Category Endpoints
        //

        management
            .MapGet(
                "/categories",
                (IManagementCatalogService service, CancellationToken cancellationToken) =>
                    service.GetCategoriesAsync(cancellationToken))
            .WithName("GetManagementCategories")
            .Produces<IReadOnlyList<CategoryManagementDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapGet(
                "/categories/{id:guid}",
                async (Guid id, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var category = await service.GetCategoryByIdAsync(id, cancellationToken);
                    return category is null
                        ? Results.Problem(
                            title: "Category Not Found",
                            detail: $"Category '{id}' was not found.",
                            statusCode: StatusCodes.Status404NotFound,
                            extensions: new Dictionary<string, object?> { ["code"] = "not_found" })
                        : Results.Ok(category);
                })
            .WithName("GetManagementCategory")
            .Produces<CategoryManagementDto>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPost(
                "/categories",
                async (CreateCategoryRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.CreateCategoryAsync(request, cancellationToken);
                    if (result.IsSuccess)
                    {
                        return Results.Created($"/api/management/categories/{result.Data!.Id}", result.Data);
                    }

                    return FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("CreateManagementCategory")
            .Produces<CategoryManagementDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPut(
                "/categories/{id:guid}",
                async (Guid id, UpdateCategoryRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.UpdateCategoryAsync(id, request, cancellationToken);
                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("UpdateManagementCategory")
            .Produces<CategoryManagementDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPatch(
                "/categories/{id:guid}/status",
                async (Guid id, ToggleActiveRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.ToggleCategoryActiveAsync(id, request, cancellationToken);
                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("ToggleCategoryStatus")
            .Produces<CategoryManagementDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        //
        // Menu Item Endpoints
        //

        management
            .MapGet(
                "/menu-items",
                (Guid? categoryId, IManagementCatalogService service, CancellationToken cancellationToken) =>
                    service.GetMenuItemsAsync(categoryId, cancellationToken))
            .WithName("GetManagementMenuItems")
            .Produces<IReadOnlyList<MenuItemManagementDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapGet(
                "/menu-items/{id:guid}",
                async (Guid id, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var item = await service.GetMenuItemByIdAsync(id, cancellationToken);
                    return item is null
                        ? Results.Problem(
                            title: "Menu Item Not Found",
                            detail: $"Menu item '{id}' was not found.",
                            statusCode: StatusCodes.Status404NotFound,
                            extensions: new Dictionary<string, object?> { ["code"] = "not_found" })
                        : Results.Ok(item);
                })
            .WithName("GetManagementMenuItem")
            .Produces<MenuItemManagementDto>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPost(
                "/menu-items",
                async (CreateMenuItemRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.CreateMenuItemAsync(request, cancellationToken);
                    if (result.IsSuccess)
                    {
                        return Results.Created($"/api/management/menu-items/{result.Data!.Id}", result.Data);
                    }

                    return FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("CreateManagementMenuItem")
            .Produces<MenuItemManagementDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPut(
                "/menu-items/{id:guid}",
                async (Guid id, UpdateMenuItemRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.UpdateMenuItemAsync(id, request, cancellationToken);
                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("UpdateManagementMenuItem")
            .Produces<MenuItemManagementDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPatch(
                "/menu-items/{id:guid}/availability",
                async (Guid id, ToggleMenuItemAvailabilityRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.ToggleMenuItemAvailabilityAsync(id, request, cancellationToken);
                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("ToggleManagementMenuItemAvailability")
            .Produces<MenuItemManagementDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPatch(
                "/menu-items/{id:guid}/status",
                async (Guid id, ToggleActiveRequest request, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.ToggleMenuItemActiveAsync(id, request, cancellationToken);
                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("ToggleMenuItemStatus")
            .Produces<MenuItemManagementDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapPost(
                "/menu-items/{id:guid}/image",
                async (Guid id, IFormFile file, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    if (file is null || file.Length == 0)
                    {
                        return Results.Problem(
                            title: "Validation Error",
                            detail: "No image file was provided.",
                            statusCode: StatusCodes.Status400BadRequest,
                            extensions: new Dictionary<string, object?> { ["code"] = "missing_file" });
                    }

                    await using var stream = file.OpenReadStream();
                    var result = await service.UploadMenuItemImageAsync(
                        id,
                        stream,
                        file.ContentType,
                        file.FileName,
                        file.Length,
                        cancellationToken);

                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .DisableAntiforgery() // Antiforgery validated via header token attribute
            .WithName("UploadMenuItemImage")
            .Produces<MenuItemManagementDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        management
            .MapDelete(
                "/menu-items/{id:guid}/image",
                async (Guid id, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var result = await service.RemoveMenuItemImageAsync(id, cancellationToken);
                    return result.IsSuccess ? Results.Ok(result.Data) : FormatProblemResult(result);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("RemoveMenuItemImage")
            .Produces<MenuItemManagementDto>()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }

    private static IResult FormatProblemResult<T>(ManagementCatalogResult<T> result)
    {
        if (result.IsNotFound)
        {
            return Results.Problem(
                title: "Not Found",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode ?? "not_found" });
        }

        if (result.IsConflict)
        {
            return Results.Problem(
                title: "Conflict",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode ?? "stale_conflict" });
        }

        return Results.Problem(
            title: "Validation Error",
            detail: result.ErrorMessage,
            statusCode: StatusCodes.Status400BadRequest,
            extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode ?? "validation_error" });
    }
}
