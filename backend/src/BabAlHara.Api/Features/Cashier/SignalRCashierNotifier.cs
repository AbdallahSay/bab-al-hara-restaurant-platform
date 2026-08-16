using BabAlHara.Application.Cashier;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Cashier;

public sealed class SignalRCashierNotifier(IHubContext<CashierHub, ICashierClient> hubContext)
    : ICashierOrderCompletedNotifier
{
    public Task NotifyAsync(CashierOrderDto order, CancellationToken cancellationToken) =>
        hubContext.Clients.All.OrderCompleted(order.Id.ToString());
}
