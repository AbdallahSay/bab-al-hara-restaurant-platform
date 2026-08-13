using BabAlHara.Application.Catalog;
using BabAlHara.Application.Delivery;

namespace BabAlHara.Api.Features.Catalog;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var catalog = endpoints.MapGroup("/api/menu").WithTags("Menu");
        catalog
            .MapGet(
                "/categories",
                (IMenuQueryService service, CancellationToken cancellationToken) =>
                    service.GetCategoriesAsync(cancellationToken))
            .WithName("GetMenuCategories")
            .Produces<IReadOnlyList<CategoryDto>>();
        catalog
            .MapGet(
                "/items",
                (Guid? categoryId, IMenuQueryService service, CancellationToken cancellationToken) =>
                    service.GetItemsAsync(categoryId, cancellationToken))
            .WithName("GetMenuItems")
            .Produces<IReadOnlyList<MenuItemDto>>();
        catalog
            .MapGet(
                "/items/{id:guid}",
                async (Guid id, IMenuQueryService service, CancellationToken cancellationToken) =>
                {
                    var item = await service.GetItemAsync(id, cancellationToken);
                    return item is null ? Results.NotFound() : Results.Ok(item);
                })
            .WithName("GetMenuItem")
            .Produces<MenuItemDto>()
            .Produces(StatusCodes.Status404NotFound);

        endpoints
            .MapGet(
                "/api/delivery-areas",
                (IDeliveryAreaQueryService service, CancellationToken cancellationToken) =>
                    service.GetActiveAsync(cancellationToken))
            .WithName("GetDeliveryAreas")
            .WithTags("Delivery")
            .Produces<IReadOnlyList<DeliveryAreaDto>>();

        return endpoints;
    }
}
