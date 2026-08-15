using BabAlHara.Application.Kitchen;
using BabAlHara.Api.Platform.Security;

namespace BabAlHara.Api.Features.Kitchen;

public static class KitchenEndpoints
{
    public static IEndpointRouteBuilder MapKitchenEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints
            .MapGet(
                "/api/kitchen/orders/active",
                (IKitchenOrderQueryService service, CancellationToken cancellationToken) =>
                    service.GetActiveAsync(cancellationToken))
            .RequireAuthorization(AuthorizationPolicies.Kitchen)
            .WithName("GetActiveKitchenOrders")
            .WithTags("Kitchen")
            .Produces<IReadOnlyList<KitchenOrderDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }
}
