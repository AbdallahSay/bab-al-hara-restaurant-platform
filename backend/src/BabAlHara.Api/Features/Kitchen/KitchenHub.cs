using BabAlHara.Application.Kitchen;
using BabAlHara.Api.Platform.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BabAlHara.Api.Features.Kitchen;

public interface IKitchenClient
{
    Task NewOrder(KitchenOrderDto order);
}

[Authorize(Policy = AuthorizationPolicies.Kitchen)]
public sealed class KitchenHub : Hub<IKitchenClient>;
