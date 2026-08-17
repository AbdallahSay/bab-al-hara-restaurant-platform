using BabAlHara.Application.Catalog;
using Microsoft.Net.Http.Headers;

namespace BabAlHara.Api.Features.Catalog;

public static class MenuImageEndpoints
{
    public static IEndpointRouteBuilder MapMenuImageEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints
            .MapGet(
                "/api/menu-images/{id:guid}",
                async (Guid id, HttpContext httpContext, IManagementCatalogService service, CancellationToken cancellationToken) =>
                {
                    var image = await service.GetImageAssetAsync(id, cancellationToken);
                    if (image is null)
                    {
                        return Results.NotFound();
                    }

                    var entityTag = new EntityTagHeaderValue($"\"{image.ContentHash}\"");
                    var requestHeaders = httpContext.Request.GetTypedHeaders();

                    if (requestHeaders.IfNoneMatch.Contains(entityTag))
                    {
                        return Results.StatusCode(StatusCodes.Status304NotModified);
                    }

                    var responseHeaders = httpContext.Response.GetTypedHeaders();
                    responseHeaders.CacheControl = new CacheControlHeaderValue
                    {
                        Public = true,
                        MaxAge = TimeSpan.FromDays(365)
                    };
                    responseHeaders.ETag = entityTag;

                    return Results.File(image.Content, image.ContentType);
                })
            .AllowAnonymous()
            .WithName("GetMenuImage")
            .WithTags("MenuImages")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status304NotModified)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }
}
