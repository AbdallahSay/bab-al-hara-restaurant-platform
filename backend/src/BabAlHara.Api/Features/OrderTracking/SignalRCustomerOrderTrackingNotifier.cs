using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure.Persistence;
using BabAlHara.Infrastructure.Tracking;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabAlHara.Api.Features.OrderTracking;

/// <summary>
/// SignalR implementation of <see cref="ICustomerOrderTrackingNotifier"/>.
/// Placed in the Api project (not Infrastructure) to avoid a circular project reference
/// since it references <see cref="OrderTrackingHub"/> and <see cref="IOrderTrackingClient"/>
/// which are defined here.
/// </summary>
public sealed partial class SignalRCustomerOrderTrackingNotifier(
    IHubContext<OrderTrackingHub, IOrderTrackingClient> hubContext,
    AppDbContext dbContext,
    ILogger<SignalRCustomerOrderTrackingNotifier> logger)
    : ICustomerOrderTrackingNotifier
{
    public async Task NotifyOrderUpdatedAsync(string publicCode, CancellationToken cancellationToken)
    {
        try
        {
            var order = await dbContext.Orders
                .Include(o => o.Items)
                .Include(o => o.StatusHistory)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.PublicCode == publicCode, cancellationToken);

            if (order is null)
            {
                return;
            }

            var dto = CustomerOrderTrackingService.MapToDto(order);
            await hubContext.Clients.Group($"tracking:{publicCode}").OrderTrackingUpdated(dto);
        }
        catch (Exception ex)
        {
            LogRealtimeNotificationFailure(logger, publicCode, ex);
        }
    }

    [LoggerMessage(
        EventId = 2300,
        Level = LogLevel.Warning,
        Message = "Order {PublicCode} customer realtime tracking notification failed.")]
    private static partial void LogRealtimeNotificationFailure(
        ILogger logger,
        string publicCode,
        Exception exception);
}
