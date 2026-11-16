using System.Security.Claims;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure.Tracking;
using Microsoft.AspNetCore.Authentication;

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
                    HttpContext context,
                    IWebHostEnvironment env,
                    ICustomerOrderTrackingService trackingService,
                    CancellationToken cancellationToken) =>
                {
                    Guid? customerId = null;
                    var authResult = await context.AuthenticateAsync(CustomerAuthSchemes.Customer);
                    if (authResult.Succeeded && authResult.Principal is not null)
                    {
                        var idStr = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (Guid.TryParse(idStr, out var parsedId))
                        {
                            customerId = parsedId;
                        }
                    }

                    var rawToken = TrackingCookieHelper.GetTrackingTokenFromCookie(context.Request, publicCode, env.IsDevelopment());

                    if (!customerId.HasValue && string.IsNullOrWhiteSpace(rawToken))
                    {
                        return Results.Unauthorized();
                    }

                    if (!string.IsNullOrWhiteSpace(rawToken))
                    {
                        // Validate Base64Url format
                        try
                        {
                            Microsoft.AspNetCore.WebUtilities.Base64UrlTextEncoder.Decode(rawToken);
                        }
                        catch
                        {
                            if (!customerId.HasValue)
                            {
                                return Results.Unauthorized();
                            }
                            rawToken = null;
                        }
                    }

                    var dto = await trackingService.GetTrackingDataAsync(publicCode, rawToken, customerId, cancellationToken);

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

        endpoints
            .MapPost(
                "/api/orders/track/{publicCode}/reorder-preview",
                async (
                    string publicCode,
                    HttpContext context,
                    IWebHostEnvironment env,
                    ICustomerOrderTrackingService trackingService,
                    CancellationToken cancellationToken) =>
                {
                    Guid? customerId = null;
                    var authResult = await context.AuthenticateAsync(CustomerAuthSchemes.Customer);
                    if (authResult.Succeeded && authResult.Principal is not null)
                    {
                        var idStr = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
                        if (Guid.TryParse(idStr, out var parsedId))
                        {
                            customerId = parsedId;
                        }
                    }

                    var rawToken = TrackingCookieHelper.GetTrackingTokenFromCookie(context.Request, publicCode, env.IsDevelopment());

                    if (!customerId.HasValue && string.IsNullOrWhiteSpace(rawToken))
                    {
                        return Results.Unauthorized();
                    }

                    if (!string.IsNullOrWhiteSpace(rawToken))
                    {
                        // Validate Base64Url format
                        try
                        {
                            Microsoft.AspNetCore.WebUtilities.Base64UrlTextEncoder.Decode(rawToken);
                        }
                        catch
                        {
                            if (!customerId.HasValue)
                            {
                                return Results.Unauthorized();
                            }
                            rawToken = null;
                        }
                    }

                    var dto = await trackingService.GetReorderPreviewAsync(publicCode, rawToken, customerId, cancellationToken);

                    if (dto is null)
                    {
                        return Results.Unauthorized();
                    }

                    return Results.Ok(dto);
                })
            .RequireRateLimiting("tracking-read")
            .WithName("GetOrderReorderPreview")
            .WithTags("Orders")
            .AllowAnonymous()
            .Produces<ReorderPreviewDto>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }
}
