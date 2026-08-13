using BabAlHara.Application.Kitchen;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Kitchen;

public sealed class SignalRNewOrderNotifier(IHubContext<KitchenHub, IKitchenClient> hubContext)
    : INewOrderNotifier
{
    public Task NotifyAsync(KitchenOrderDto order, CancellationToken cancellationToken) =>
        hubContext.Clients.All.NewOrder(order);
}
