using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Operations;

public interface IOperationsClient
{
    Task OperationsUpdated();
    Task OrderCreated(string publicCode);
    Task OrderStatusChanged(OrderStatusChangedEvent evt);
    Task DriverAssigned(DriverAssignedEvent evt);
}

[Authorize(Policy = AuthorizationPolicies.Management)]
public sealed class OperationsHub : Hub<IOperationsClient>;
