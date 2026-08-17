using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Cashier;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Cashier;

public interface ICashierClient
{
    Task OrderReady(CashierOrderDto order);
    Task OrderCompleted(string orderId);
    Task NewOrder(KitchenOrderDto order);
    Task OrderStatusChanged(OrderStatusChangedEvent evt);
    Task DriverAssigned(DriverAssignedEvent evt);
}

[Authorize(Policy = AuthorizationPolicies.Cashier)]
public sealed class CashierHub : Hub<ICashierClient>
{
}
