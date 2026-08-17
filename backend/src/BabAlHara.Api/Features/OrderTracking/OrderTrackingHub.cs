using System.Security.Cryptography;
using System.Text;
using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.Features.OrderTracking;

public interface IOrderTrackingClient
{
    Task OrderTrackingUpdated(CustomerOrderTrackingDto data);
}

public sealed class OrderTrackingHub(AppDbContext dbContext, IWebHostEnvironment env) : Hub<IOrderTrackingClient>
{
    private const string GroupPrefix = "tracking:";

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        if (httpContext is null)
        {
            Context.Abort();
            return;
        }

        var publicCode = httpContext.Request.Query["publicCode"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(publicCode))
        {
            Context.Abort();
            return;
        }

        var rawToken = TrackingCookieHelper.GetTrackingTokenFromCookie(
            httpContext.Request,
            publicCode,
            env.IsDevelopment());

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            Context.Abort();
            return;
        }

        string hash;
        try
        {
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
            hash = Convert.ToHexString(hashBytes).ToLowerInvariant();
        }
        catch
        {
            Context.Abort();
            return;
        }

        var order = await dbContext.Orders
            .AsNoTracking()
            .Where(o => o.PublicCode == publicCode && o.TrackingTokenHash == hash)
            .Select(o => new { o.PublicCode, o.TrackingTokenExpiresAtUtc })
            .FirstOrDefaultAsync();

        if (order is null)
        {
            Context.Abort();
            return;
        }

        if (order.TrackingTokenExpiresAtUtc.HasValue && order.TrackingTokenExpiresAtUtc.Value <= DateTimeOffset.UtcNow)
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"{GroupPrefix}{order.PublicCode}");
        await base.OnConnectedAsync();
    }
}
