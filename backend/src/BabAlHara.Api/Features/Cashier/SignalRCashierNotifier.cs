using BabAlHara.Application.Cashier;
using BabAlHara.Application.Operations;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Cashier;

public sealed class SignalRCashierNotifier(
    IHubContext<CashierHub, ICashierClient> hubContext,
    IOperationsRealtimeNotifier operationsNotifier)
    : ICashierOrderCompletedNotifier
{
    public async Task NotifyAsync(CashierOrderDto order, CancellationToken cancellationToken)
    {
        await hubContext.Clients.All.OrderCompleted(order.Id.ToString());
        try
        {
            await operationsNotifier.NotifyOperationsUpdatedAsync(cancellationToken);
        }
        catch
        {
            // Non-blocking best-effort notification
        }
    }
}
