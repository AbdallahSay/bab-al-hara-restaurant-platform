using System.Security.Claims;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.RestaurantControl;
using BabAlHara.Infrastructure.Identity;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BabAlHara.Api.Features.RestaurantControl;

public static class RestaurantControlEndpoints
{
    public static IEndpointRouteBuilder MapRestaurantControlEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints
            .MapGet(
                "/api/restaurant/status",
                async (
                    [FromServices] IRestaurantControlService service,
                    CancellationToken cancellationToken) =>
                {
                    var response = await service.GetPublicStatusAsync(cancellationToken);
                    return Results.Ok(response);
                })
            .AllowAnonymous()
            .WithName("GetRestaurantPublicStatus")
            .WithTags("Restaurant status")
            .Produces<RestaurantPublicStatusResponse>();

        var management = endpoints
            .MapGroup("/api/management/restaurant/status")
            .RequireAuthorization(AuthorizationPolicies.Management)
            .WithTags("Restaurant management");

        management
            .MapGet(
                "",
                async (
                    [FromServices] IRestaurantControlService service,
                    CancellationToken cancellationToken) =>
                {
                    var dto = await service.GetControlStatusAsync(cancellationToken);
                    return Results.Ok(dto);
                })
            .WithName("GetRestaurantControlStatus")
            .Produces<RestaurantControlDto>();

        management
            .MapPut(
                "",
                async (
                    [FromBody] UpdateRestaurantControlRequest request,
                    [FromServices] IRestaurantControlService service,
                    [FromServices] UserManager<StaffUser> userManager,
                    ClaimsPrincipal user,
                    CancellationToken cancellationToken) =>
                {
                    var staffUser = await userManager.GetUserAsync(user);
                    var updatedBy = staffUser?.DisplayName ?? user.Identity?.Name ?? "Staff";

                    var command = new UpdateRestaurantControlCommand(
                        request.AcceptingOrders,
                        request.PauseMessageAr,
                        request.PauseMessageEn,
                        request.RowVersion,
                        updatedBy);

                    var outcome = await service.UpdateControlStatusAsync(command, cancellationToken);
                    if (outcome.Status == UpdateRestaurantControlResultStatus.Conflict)
                    {
                        return Results.Conflict(new ProblemDetails
                        {
                            Title = "Concurrency Conflict",
                            Detail = "The restaurant status has been modified by another staff member. Please refresh and try again."
                        });
                    }

                    return Results.Ok(outcome.Control);
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("UpdateRestaurantControlStatus")
            .Produces<RestaurantControlDto>()
            .ProducesProblem(StatusCodes.Status409Conflict);

        return endpoints;
    }
}
