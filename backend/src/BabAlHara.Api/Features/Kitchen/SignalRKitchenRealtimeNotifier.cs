using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Operations;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Kitchen;

public sealed class SignalRKitchenRealtimeNotifier(
    IHubContext<KitchenHub, IKitchenClient> hubContext,
    IOperationsRealtimeNotifier operationsNotifier)
    : IKitchenRealtimeNotifier, INewOrderNotifier
{
    public async Task NotifyOrderCreatedAsync(KitchenOrderDto order, CancellationToken cancellationToken)
    {
        await hubContext.Clients.All.NewOrder(order);
        try
        {
            await operationsNotifier.NotifyOrderCreatedAsync(order.PublicCode, cancellationToken);
        }
        catch
        {
            // Non-blocking best-effort notification
        }
    }

    public Task NotifyAsync(KitchenOrderDto order, CancellationToken cancellationToken) =>
        NotifyOrderCreatedAsync(order, cancellationToken);

    public async Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken)
    {
        await hubContext.Clients.All.OrderStatusChanged(evt);
        try
        {
            await operationsNotifier.NotifyOrderStatusChangedAsync(evt, cancellationToken);
        }
        catch
        {
            // Non-blocking best-effort notification
        }
    }

    public Task NotifyMenuItemAvailabilityChangedAsync(MenuItemAvailabilityChangedEvent evt, CancellationToken cancellationToken) =>
        hubContext.Clients.All.MenuItemAvailabilityChanged(evt);
}
