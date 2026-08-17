using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace BabAlHara.Api.Features.OrderTracking;

public interface IOrderTrackingClient
{
    Task OrderTrackingUpdated(CustomerOrderTrackingDto data);
}

public sealed class OrderTrackingHub(AppDbContext dbContext) : Hub<IOrderTrackingClient>
{
    private const string GroupPrefix = "tracking:";

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var rawToken = httpContext?.Request.Query["access_token"].FirstOrDefault();

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

        var publicCode = await dbContext.Orders
            .AsNoTracking()
            .Where(o => o.TrackingTokenHash == hash)
            .Select(o => o.PublicCode)
            .FirstOrDefaultAsync();

        if (publicCode is null)
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"{GroupPrefix}{publicCode}");
        await base.OnConnectedAsync();
    }
}
