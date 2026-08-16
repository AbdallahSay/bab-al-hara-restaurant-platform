using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Driver;

public interface IDriverClient
{
    Task DriverAssigned(DriverAssignedEvent evt);
    Task OrderStatusChanged(OrderStatusChangedEvent evt);
}

[Authorize(Policy = AuthorizationPolicies.Driver)]
public sealed class DriverHub : Hub<IDriverClient>;
