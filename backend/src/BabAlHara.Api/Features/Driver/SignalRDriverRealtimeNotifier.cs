using BabAlHara.Api.Features.Cashier;
using BabAlHara.Api.Features.Kitchen;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Driver;

public sealed class SignalRDriverRealtimeNotifier(
    IHubContext<DriverHub, IDriverClient> driverHubContext,
    IHubContext<CashierHub, ICashierClient> cashierHubContext,
    IHubContext<KitchenHub, IKitchenClient> kitchenHubContext)
    : IDriverRealtimeNotifier
{
    public async Task NotifyDriverAssignedAsync(DriverAssignedEvent evt, CancellationToken cancellationToken)
    {
        await driverHubContext.Clients.All.DriverAssigned(evt);
        await cashierHubContext.Clients.All.DriverAssigned(evt);
    }

    public async Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken)
    {
        await driverHubContext.Clients.All.OrderStatusChanged(evt);
        await cashierHubContext.Clients.All.OrderStatusChanged(evt);
        await kitchenHubContext.Clients.All.OrderStatusChanged(evt);
    }
}
