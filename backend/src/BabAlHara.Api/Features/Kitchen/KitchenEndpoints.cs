using System.Security.Claims;
using BabAlHara.Application.Kitchen;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Domain.Ordering;

namespace BabAlHara.Api.Features.Kitchen;

public sealed record TransitionOrderRequest(string? RowVersion, string? Notes);

public sealed record UpdateAvailabilityRequest(bool IsAvailable);

public sealed record UnifiedTransitionRequest(OrderStatus TargetStatus, string? RowVersion, string? Notes);

public static class KitchenEndpoints
{
    public static IEndpointRouteBuilder MapKitchenEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var kitchen = endpoints.MapGroup("/api/kitchen").WithTags("Kitchen").RequireAuthorization(AuthorizationPolicies.Kitchen);

        kitchen
            .MapGet(
                "/orders/active",
                (IKitchenOrderQueryService service, CancellationToken cancellationToken) =>
                    service.GetActiveAsync(cancellationToken))
            .WithName("GetActiveKitchenOrders")
            .Produces<IReadOnlyList<KitchenOrderDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapGet(
                "/orders",
                (IKitchenOrderQueryService service, CancellationToken cancellationToken) =>
                    service.GetActiveAsync(cancellationToken))
            .WithName("GetKitchenOrdersList")
            .Produces<IReadOnlyList<KitchenOrderDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapGet(
                "/orders/{publicCode}",
                async (string publicCode, IKitchenOrderQueryService service, CancellationToken cancellationToken) =>
                {
                    var order = await service.GetByPublicCodeAsync(publicCode, cancellationToken);
                    return order is null
                        ? Results.Problem(
                            title: "Order Not Found",
                            detail: $"Order '{publicCode}' was not found.",
                            statusCode: StatusCodes.Status404NotFound,
                            extensions: new Dictionary<string, object?> { ["code"] = "order_not_found" })
                        : Results.Ok(order);
                })
            .WithName("GetKitchenOrder")
            .Produces<KitchenOrderDetailsDto>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapGet(
                "/orders/{publicCode}/history",
                async (string publicCode, IKitchenOrderQueryService service, CancellationToken cancellationToken) =>
                {
                    var history = await service.GetOrderHistoryAsync(publicCode, cancellationToken);
                    return Results.Ok(history);
                })
            .WithName("GetKitchenOrderHistory")
            .Produces<IReadOnlyList<OrderStatusHistoryDto>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/orders/{publicCode}/confirm",
                (string publicCode, TransitionOrderRequest? request, ClaimsPrincipal user, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteTransitionAsync(publicCode, OrderStatus.Confirmed, request, user, commandService, cancellationToken))
            .WithName("ConfirmKitchenOrder")
            .Produces<KitchenOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/orders/{publicCode}/start-preparing",
                (string publicCode, TransitionOrderRequest? request, ClaimsPrincipal user, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteTransitionAsync(publicCode, OrderStatus.Preparing, request, user, commandService, cancellationToken))
            .WithName("StartPreparingKitchenOrder")
            .Produces<KitchenOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/orders/{publicCode}/prepare",
                (string publicCode, TransitionOrderRequest? request, ClaimsPrincipal user, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteTransitionAsync(publicCode, OrderStatus.Preparing, request, user, commandService, cancellationToken))
            .WithName("PrepareKitchenOrderAlias")
            .Produces<KitchenOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/orders/{publicCode}/mark-ready",
                (string publicCode, TransitionOrderRequest? request, ClaimsPrincipal user, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteTransitionAsync(publicCode, OrderStatus.Ready, request, user, commandService, cancellationToken))
            .WithName("MarkReadyKitchenOrder")
            .Produces<KitchenOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/orders/{publicCode}/ready",
                (string publicCode, TransitionOrderRequest? request, ClaimsPrincipal user, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteTransitionAsync(publicCode, OrderStatus.Ready, request, user, commandService, cancellationToken))
            .WithName("ReadyKitchenOrderAlias")
            .Produces<KitchenOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/orders/{publicCode}/transition",
                (string publicCode, UnifiedTransitionRequest request, ClaimsPrincipal user, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteTransitionAsync(publicCode, request.TargetStatus, new TransitionOrderRequest(request.RowVersion, request.Notes), user, commandService, cancellationToken))
            .WithName("TransitionKitchenOrder")
            .Produces<KitchenOrderDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        kitchen
            .MapPost(
                "/menu-items/{id:guid}/availability",
                (Guid id, UpdateAvailabilityRequest request, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteToggleAvailabilityAsync(id, request, commandService, cancellationToken))
            .WithName("ToggleKitchenMenuItemAvailability")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        endpoints
            .MapPost(
                "/api/menu/items/{id:guid}/availability",
                (Guid id, UpdateAvailabilityRequest request, IKitchenOrderCommandService commandService, CancellationToken cancellationToken) =>
                    ExecuteToggleAvailabilityAsync(id, request, commandService, cancellationToken))
            .RequireAuthorization(AuthorizationPolicies.Kitchen)
            .WithName("ToggleMenuItemAvailability")
            .WithTags("Menu")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);

        return endpoints;
    }

    private static async Task<IResult> ExecuteTransitionAsync(
        string publicCode,
        OrderStatus targetStatus,
        TransitionOrderRequest? request,
        ClaimsPrincipal user,
        IKitchenOrderCommandService commandService,
        CancellationToken cancellationToken)
    {
        var actorId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        var actorName = user.FindFirstValue("DisplayName") ?? user.Identity?.Name ?? "Kitchen Staff";
        var actorRole = user.FindFirstValue(ClaimTypes.Role) ?? "Kitchen";

        var command = new OrderTransitionCommand(
            PublicCode: publicCode,
            TargetStatus: targetStatus,
            RowVersion: request?.RowVersion,
            Notes: request?.Notes,
            ActorId: actorId,
            ActorName: actorName,
            ActorRole: actorRole);

        var result = await commandService.TransitionOrderStatusAsync(command, cancellationToken);

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

    private static async Task<IResult> ExecuteToggleAvailabilityAsync(
        Guid id,
        UpdateAvailabilityRequest request,
        IKitchenOrderCommandService commandService,
        CancellationToken cancellationToken)
    {
        var command = new ToggleMenuItemAvailabilityCommand(id, request.IsAvailable);
        var result = await commandService.ToggleMenuItemAvailabilityAsync(command, cancellationToken);

        if (result.IsNotFound)
        {
            return Results.Problem(
                title: "Menu Item Not Found",
                detail: $"Menu item '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound,
                extensions: new Dictionary<string, object?> { ["code"] = "menu_item_not_found" });
        }

        return Results.Ok(new { menuItemId = result.MenuItemId, isAvailable = result.IsAvailable });
    }
}
