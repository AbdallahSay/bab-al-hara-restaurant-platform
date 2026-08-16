using BabAlHara.Application.Kitchen;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Kitchen;

public sealed class SignalRKitchenRealtimeNotifier(
    IHubContext<KitchenHub, IKitchenClient> hubContext)
    : IKitchenRealtimeNotifier, INewOrderNotifier
{
    public Task NotifyOrderCreatedAsync(KitchenOrderDto order, CancellationToken cancellationToken) =>
        hubContext.Clients.All.NewOrder(order);

    public Task NotifyAsync(KitchenOrderDto order, CancellationToken cancellationToken) =>
        NotifyOrderCreatedAsync(order, cancellationToken);

    public Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken) =>
        hubContext.Clients.All.OrderStatusChanged(evt);

    public Task NotifyMenuItemAvailabilityChangedAsync(MenuItemAvailabilityChangedEvent evt, CancellationToken cancellationToken) =>
        hubContext.Clients.All.MenuItemAvailabilityChanged(evt);
}
