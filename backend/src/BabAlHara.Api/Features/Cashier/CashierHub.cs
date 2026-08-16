using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Cashier;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Cashier;

public interface ICashierClient
{
    Task OrderReady(CashierOrderDto order);
    Task OrderCompleted(string orderId);
}

[Authorize(Policy = AuthorizationPolicies.Cashier)]
public sealed class CashierHub : Hub<ICashierClient>
{
}
