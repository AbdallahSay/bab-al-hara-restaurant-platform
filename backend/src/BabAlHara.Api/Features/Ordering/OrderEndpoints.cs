using System.Security.Claims;
using BabAlHara.Api.Features.OrderTracking;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Ordering;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;

namespace BabAlHara.Api.Features.Ordering;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints
            .MapPost(
                "/api/orders",
                async (
                    CreateOrderRequest request,
                    IOrderApplicationService service,
                    HttpContext httpContext,
                    IWebHostEnvironment env,
                    CancellationToken cancellationToken) =>
                {
                    Guid? customerId = null;
                    var authResult = await httpContext.AuthenticateAsync(CustomerAuthSchemes.Customer);
                    if (authResult.Succeeded && authResult.Principal is not null)
                    {
                        var idStr = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (Guid.TryParse(idStr, out var parsedId))
                        {
                            customerId = parsedId;
                        }
                    }

                    var command = new CreateOrderCommand(
                        request.CustomerName ?? string.Empty,
                        request.CustomerPhone ?? string.Empty,
                        request.OrderType,
                        request.DeliveryAreaId,
                        request.Address,
                        request.CustomerNote,
                        request.Items?
                            .Select(item => new CreateOrderLine(item.MenuItemId, item.Quantity))
                            .ToList() ?? [],
                        customerId);
                    var outcome = await service.CreateAsync(command, cancellationToken);
                    if (outcome.IsSuccess)
                    {
                        if (!string.IsNullOrWhiteSpace(outcome.RawTrackingToken) && outcome.TrackingTokenExpiresAtUtc.HasValue)
                        {
                            TrackingCookieHelper.AppendTrackingCookie(
                                httpContext.Response,
                                outcome.Order!.PublicCode,
                                outcome.RawTrackingToken,
                                outcome.TrackingTokenExpiresAtUtc.Value,
                                env.IsDevelopment(),
                                httpContext.Request.IsHttps);
                        }

                        return Results.Created($"/api/orders/{outcome.Order!.PublicCode}", outcome.Order);
                    }

                    var rejection = outcome.Rejection!;
                    return Results.Problem(
                        statusCode: rejection.IsConflict
                            ? StatusCodes.Status409Conflict
                            : StatusCodes.Status400BadRequest,
                        title: "The order could not be created.",
                        detail: rejection.Message,
                        extensions: new Dictionary<string, object?> { ["code"] = rejection.Code });
                })
            .RequireRateLimiting("guest-order")
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("CreateOrder")
            .WithTags("Orders")
            .Produces<CreatedOrderDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return endpoints;
    }
}
