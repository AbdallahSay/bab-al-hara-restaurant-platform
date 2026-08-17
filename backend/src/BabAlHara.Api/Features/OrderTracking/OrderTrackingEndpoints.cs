using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure.Tracking;

namespace BabAlHara.Api.Features.OrderTracking;

public static class OrderTrackingEndpoints
{
    public static IEndpointRouteBuilder MapOrderTrackingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints
            .MapGet(
                "/api/orders/track/{publicCode}",
                async (
                    string publicCode,
                    HttpRequest request,
                    ICustomerOrderTrackingService trackingService,
                    CancellationToken cancellationToken) =>
                {
                    var rawToken = request.Headers["X-Tracking-Token"].FirstOrDefault();

                    if (string.IsNullOrWhiteSpace(rawToken))
                    {
                        return Results.Unauthorized();
                    }

                    // Validate Base64Url format
                    try
                    {
                        Microsoft.AspNetCore.WebUtilities.Base64UrlTextEncoder.Decode(rawToken);
                    }
                    catch
                    {
                        return Results.Unauthorized();
                    }

                    var dto = await trackingService.GetTrackingDataAsync(publicCode, rawToken, cancellationToken);

                    if (dto is null)
                    {
                        return Results.Unauthorized();
                    }

                    return Results.Ok(dto);
                })
            .RequireRateLimiting("tracking-read")
            .WithName("GetOrderTracking")
            .WithTags("Orders")
            .AllowAnonymous()
            .Produces<CustomerOrderTrackingDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }
}
