using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Operations;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Operations;

public sealed class SignalROperationsRealtimeNotifier(
    IHubContext<OperationsHub, IOperationsClient> hubContext)
    : IOperationsRealtimeNotifier
{
    public Task NotifyOperationsUpdatedAsync(CancellationToken cancellationToken) =>
        hubContext.Clients.All.OperationsUpdated();

    public Task NotifyOrderCreatedAsync(string publicCode, CancellationToken cancellationToken) =>
        hubContext.Clients.All.OrderCreated(publicCode);

    public Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken) =>
        hubContext.Clients.All.OrderStatusChanged(evt);

    public Task NotifyDriverAssignedAsync(DriverAssignedEvent evt, CancellationToken cancellationToken) =>
        hubContext.Clients.All.DriverAssigned(evt);
}
