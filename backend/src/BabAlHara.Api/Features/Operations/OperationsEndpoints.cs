using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Operations;
using Microsoft.AspNetCore.Mvc;

namespace BabAlHara.Api.Features.Operations;

public static class OperationsEndpoints
{
    public static IEndpointRouteBuilder MapOperationsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var management = endpoints
            .MapGroup("/api/management/operations")
            .WithTags("Management Operations")
            .RequireAuthorization(AuthorizationPolicies.Management);

        management
            .MapGet(
                "",
                async (
                    [FromServices] IOperationsQueryService service,
                    CancellationToken cancellationToken) =>
                {
                    var snapshot = await service.GetOperationsSnapshotAsync(cancellationToken);
                    return Results.Ok(snapshot);
                })
            .WithName("GetOperationsSnapshot")
            .Produces<OperationsCommandCenterResponse>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }
}
