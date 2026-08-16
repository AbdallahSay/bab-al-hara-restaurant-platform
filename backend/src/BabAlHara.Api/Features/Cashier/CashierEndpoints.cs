using System.Security.Claims;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Cashier;
using Microsoft.AspNetCore.Mvc;

namespace BabAlHara.Api.Features.Cashier;

public sealed record CompleteCashTakeawayRequest(string RowVersion);

public static class CashierEndpoints
{
    public static void MapCashierEndpoints(this IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/api/cashier/orders")
            .RequireAuthorization(AuthorizationPolicies.Cashier)
            .WithTags("Cashier");

        group.MapGet("", async (
            [FromServices] ICashierOrderService service,
            CancellationToken cancellationToken) =>
        {
            var orders = await service.GetReadyOrdersAsync(cancellationToken);
            return Results.Ok(orders);
        });

        builder.MapPost("/api/orders/{id:guid}/cash-payment/confirm", async (
            Guid id,
            [FromBody] CompleteCashTakeawayRequest request,
            [FromServices] ICashierOrderService service,
            ClaimsPrincipal user,
            CancellationToken cancellationToken) =>
        {
            var actorId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var actorRole = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var rowVersion = Convert.FromBase64String(request.RowVersion);

            var result = await service.CompleteCashTakeawayHandoffAsync(
                id,
                rowVersion,
                actorId,
                actorRole,
                cancellationToken);

            return result switch
            {
                CompleteCashTakeawayResult.Success => Results.Ok(),
                CompleteCashTakeawayResult.NotFound => Results.NotFound(),
                CompleteCashTakeawayResult.StaleData => Results.Conflict(new ProblemDetails
                {
                    Title = "Concurrency Conflict",
                    Detail = "The order has been modified by another user. Please refresh and try again."
                }),
                CompleteCashTakeawayResult.AlreadyCompleted => Results.Conflict(new ProblemDetails
                {
                    Title = "Already Completed",
                    Detail = "The order has already been completed or paid."
                }),
                CompleteCashTakeawayResult.InvalidState => Results.UnprocessableEntity(new ProblemDetails
                {
                    Title = "Invalid State",
                    Detail = "The order is not in a valid state for this operation (must be Ready)."
                }),
                CompleteCashTakeawayResult.InvalidOrderType => Results.UnprocessableEntity(new ProblemDetails
                {
                    Title = "Invalid Order Type",
                    Detail = "This operation is only valid for Takeaway orders."
                }),
                _ => Results.StatusCode(500)
            };
        })
        .RequireAuthorization(AuthorizationPolicies.Cashier)
        .WithTags("Orders");
    }
}
