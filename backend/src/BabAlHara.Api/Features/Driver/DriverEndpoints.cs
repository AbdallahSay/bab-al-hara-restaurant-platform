using System.Security.Claims;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Driver;

namespace BabAlHara.Api.Features.Driver;

public sealed record AssignDriverRequest(Guid DriverId, string? RowVersion = null);

public sealed record DriverTransitionRequest(string? RowVersion = null, string? Notes = null);

public static class DriverEndpoints
{
    public static IEndpointRouteBuilder MapDriverEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        //
        // Cashier Driver Operations
        //
        var cashier = endpoints.MapGroup("/api/cashier")
            .WithTags("Cashier Drivers")
            .RequireAuthorization(AuthorizationPolicies.Cashier);

        cashier
            .MapGet(
                "/drivers",
                (IDriverOrderService service, CancellationToken cancellationToken) =>
                    service.GetAvailableDriversAsync(cancellationToken))
            .WithName("GetAvailableDrivers")
            .Produces<IReadOnlyList<DriverSummaryDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        cashier
            .MapPost(
                "/orders/{id}/assign-driver",
                (string id, AssignDriverRequest request, ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                    ExecuteAssignDriverAsync(id, request, user, service, cancellationToken))
            .WithName("AssignDriverCashierAlias")
            .Produces<DriverOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        //
        // General Orders Driver Assignment Endpoint (Cashier policy)
        //
        endpoints
            .MapPost(
                "/api/orders/{id}/assign-driver",
                (string id, AssignDriverRequest request, ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                    ExecuteAssignDriverAsync(id, request, user, service, cancellationToken))
            .RequireAuthorization(AuthorizationPolicies.Cashier)
            .WithTags("Orders")
            .WithName("AssignDriverToOrder")
            .Produces<DriverOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        //
        // Driver App Endpoints
        //
        var driver = endpoints.MapGroup("/api/driver")
            .WithTags("Driver")
            .RequireAuthorization(AuthorizationPolicies.Driver);

        driver
            .MapGet(
                "/orders/assigned",
                async (ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                {
                    var driverId = GetUserId(user);
                    if (driverId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var orders = await service.GetAssignedOrdersAsync(driverId.Value, cancellationToken);
                    return Results.Ok(orders);
                })
            .WithName("GetAssignedDriverOrders")
            .Produces<IReadOnlyList<DriverOrderDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        driver
            .MapPost(
                "/orders/{id}/start-delivery",
                (string id, DriverTransitionRequest? request, ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                    ExecuteStartDeliveryAsync(id, request, user, service, cancellationToken))
            .WithName("StartDeliveryAlias")
            .Produces<DriverOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized);

        driver
            .MapPost(
                "/orders/{id}/mark-delivered",
                (string id, DriverTransitionRequest? request, ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                    ExecuteMarkDeliveredAsync(id, request, user, service, cancellationToken))
            .WithName("MarkDeliveredAlias")
            .Produces<DriverOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized);

        //
        // Canonical Order Transition Endpoints for Drivers
        //
        endpoints
            .MapPost(
                "/api/orders/{id}/start-delivery",
                (string id, DriverTransitionRequest? request, ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                    ExecuteStartDeliveryAsync(id, request, user, service, cancellationToken))
            .RequireAuthorization(AuthorizationPolicies.Driver)
            .WithTags("Orders")
            .WithName("StartOrderDelivery")
            .Produces<DriverOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized);

        endpoints
            .MapPost(
                "/api/orders/{id}/mark-delivered",
                (string id, DriverTransitionRequest? request, ClaimsPrincipal user, IDriverOrderService service, CancellationToken cancellationToken) =>
                    ExecuteMarkDeliveredAsync(id, request, user, service, cancellationToken))
            .RequireAuthorization(AuthorizationPolicies.Driver)
            .WithTags("Orders")
            .WithName("MarkOrderDelivered")
            .Produces<DriverOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }

    private static async Task<IResult> ExecuteAssignDriverAsync(
        string id,
        AssignDriverRequest request,
        ClaimsPrincipal user,
        IDriverOrderService service,
        CancellationToken cancellationToken)
    {
        var actorId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        var actorRole = user.FindFirstValue(ClaimTypes.Role) ?? "Cashier";

        var command = new AssignDriverCommand(
            OrderIdOrCode: id,
            DriverId: request.DriverId,
            RowVersion: request.RowVersion,
            ActorId: actorId,
            ActorRole: actorRole);

        var result = await service.AssignDriverAsync(command, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(result.Order);
        }

        if (result.IsNotFound)
        {
            return Results.Problem(
                title: "Order Not Found",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        if (result.IsDriverNotFound)
        {
            return Results.Problem(
                title: "Driver Not Found",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        if (result.IsConcurrencyConflict)
        {
            return Results.Problem(
                title: "Order Conflict",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        return Results.Problem(
            title: "Invalid Order Operation",
            detail: result.ErrorMessage,
            statusCode: StatusCodes.Status400BadRequest,
            extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
    }

    private static async Task<IResult> ExecuteStartDeliveryAsync(
        string id,
        DriverTransitionRequest? request,
        ClaimsPrincipal user,
        IDriverOrderService service,
        CancellationToken cancellationToken)
    {
        var driverId = GetUserId(user);
        if (driverId is null)
        {
            return Results.Unauthorized();
        }

        var actorName = user.FindFirstValue("DisplayName") ?? user.Identity?.Name ?? "Driver";
        var actorRole = user.FindFirstValue(ClaimTypes.Role) ?? "Driver";

        var command = new DriverTransitionCommand(
            OrderIdOrCode: id,
            DriverId: driverId.Value,
            RowVersion: request?.RowVersion,
            Notes: request?.Notes,
            ActorName: actorName,
            ActorRole: actorRole);

        var result = await service.StartDeliveryAsync(command, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(result.Order);
        }

        if (result.IsNotFound)
        {
            return Results.Problem(
                title: "Order Not Found",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        if (result.IsForbidden)
        {
            return Results.Problem(
                title: "Forbidden",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status403Forbidden,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        if (result.IsConcurrencyConflict)
        {
            return Results.Problem(
                title: "Order Conflict",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        return Results.Problem(
            title: "Invalid Order Transition",
            detail: result.ErrorMessage,
            statusCode: StatusCodes.Status400BadRequest,
            extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
    }

    private static async Task<IResult> ExecuteMarkDeliveredAsync(
        string id,
        DriverTransitionRequest? request,
        ClaimsPrincipal user,
        IDriverOrderService service,
        CancellationToken cancellationToken)
    {
        var driverId = GetUserId(user);
        if (driverId is null)
        {
            return Results.Unauthorized();
        }

        var actorName = user.FindFirstValue("DisplayName") ?? user.Identity?.Name ?? "Driver";
        var actorRole = user.FindFirstValue(ClaimTypes.Role) ?? "Driver";

        var command = new DriverTransitionCommand(
            OrderIdOrCode: id,
            DriverId: driverId.Value,
            RowVersion: request?.RowVersion,
            Notes: request?.Notes,
            ActorName: actorName,
            ActorRole: actorRole);

        var result = await service.MarkDeliveredAsync(command, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(result.Order);
        }

        if (result.IsNotFound)
        {
            return Results.Problem(
                title: "Order Not Found",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        if (result.IsForbidden)
        {
            return Results.Problem(
                title: "Forbidden",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status403Forbidden,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        if (result.IsConcurrencyConflict)
        {
            return Results.Problem(
                title: "Order Conflict",
                detail: result.ErrorMessage,
                statusCode: StatusCodes.Status409Conflict,
                extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
        }

        return Results.Problem(
            title: "Invalid Order Transition",
            detail: result.ErrorMessage,
            statusCode: StatusCodes.Status400BadRequest,
            extensions: new Dictionary<string, object?> { ["code"] = result.ErrorCode });
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idStr, out var id) ? id : null;
    }
}
