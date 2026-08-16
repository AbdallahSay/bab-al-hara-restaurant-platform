using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Application.Catalog;
using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Ordering;
using Microsoft.AspNetCore.Mvc;

namespace BabAlHara.Api.IntegrationTests;

public sealed class KitchenApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task GetActiveKitchenOrdersReturnsActiveQueueAndExcludesDelivered()
    {
        await factory.ResetAsync();

        await CreateSampleOrderInDbAsync("BH-ACTIVE-001", OrderStatus.Pending);
        await CreateSampleOrderInDbAsync("BH-ACTIVE-002", OrderStatus.Preparing);
        await CreateSampleOrderInDbAsync("BH-DELIVERED-001", OrderStatus.Delivered);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        var response = await kitchenClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var orders = await response.Content.ReadFromJsonAsync<List<KitchenOrderDto>>(JsonOptions);
        Assert.NotNull(orders);
        Assert.Contains(orders, o => o.PublicCode == "BH-ACTIVE-001");
        Assert.Contains(orders, o => o.PublicCode == "BH-ACTIVE-002");
        Assert.DoesNotContain(orders, o => o.PublicCode == "BH-DELIVERED-001");

        var active1 = orders.First(o => o.PublicCode == "BH-ACTIVE-001");
        Assert.NotNull(active1.RowVersion);
        Assert.NotEmpty(active1.RowVersion);
        Assert.NotEmpty(active1.Items);
    }

    [Fact]
    public async Task GetKitchenOrderReturnsOrderDetailsAndHistory()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-DETAILS-001", OrderStatus.Pending);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        var confirmResponse = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/confirm",
            new { notes = "Confirming order" });
        Assert.Equal(HttpStatusCode.OK, confirmResponse.StatusCode);

        var detailsResponse = await kitchenClient.GetAsync($"/api/kitchen/orders/{order.PublicCode}");
        Assert.Equal(HttpStatusCode.OK, detailsResponse.StatusCode);

        var details = await detailsResponse.Content.ReadFromJsonAsync<KitchenOrderDetailsDto>(JsonOptions);
        Assert.NotNull(details);
        Assert.Equal("BH-DETAILS-001", details.PublicCode);
        Assert.Equal(OrderStatus.Confirmed, details.Status);
        Assert.Single(details.StatusHistory);
        Assert.Equal(OrderStatus.Pending, details.StatusHistory[0].PreviousStatus);
        Assert.Equal(OrderStatus.Confirmed, details.StatusHistory[0].NewStatus);
        Assert.Equal("Kitchen", details.StatusHistory[0].ActorRole);
        Assert.Equal("Confirming order", details.StatusHistory[0].Notes);

        var historyResponse = await kitchenClient.GetAsync($"/api/kitchen/orders/{order.PublicCode}/history");
        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);
        var history = await historyResponse.Content.ReadFromJsonAsync<List<OrderStatusHistoryDto>>(JsonOptions);
        Assert.NotNull(history);
        Assert.Single(history);
    }

    [Fact]
    public async Task StateTransitionsPendingToConfirmedToPreparingToReadySucceedsAndBroadcastsSignalR()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-FLOW-001", OrderStatus.Pending);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        factory.Notifier.Clear();

        // 1. Confirm: Pending -> Confirmed
        var confirmResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/confirm",
            new { notes = "Order confirmed" });
        Assert.Equal(HttpStatusCode.OK, confirmResp.StatusCode);
        var confirmedDto = await confirmResp.Content.ReadFromJsonAsync<KitchenOrderDto>(JsonOptions);
        Assert.NotNull(confirmedDto);
        Assert.Equal(OrderStatus.Confirmed, confirmedDto.Status);

        Assert.Single(factory.Notifier.StatusChanges);
        var evt1 = factory.Notifier.StatusChanges[^1];
        Assert.Equal("BH-FLOW-001", evt1.PublicCode);
        Assert.Equal(OrderStatus.Pending, evt1.PreviousStatus);
        Assert.Equal(OrderStatus.Confirmed, evt1.NewStatus);

        // 2. Start Preparing: Confirmed -> Preparing
        var prepareResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/start-preparing",
            new { notes = "Started grilling" });
        Assert.Equal(HttpStatusCode.OK, prepareResp.StatusCode);
        var preparingDto = await prepareResp.Content.ReadFromJsonAsync<KitchenOrderDto>(JsonOptions);
        Assert.NotNull(preparingDto);
        Assert.Equal(OrderStatus.Preparing, preparingDto.Status);

        Assert.Equal(2, factory.Notifier.StatusChanges.Count);
        var evt2 = factory.Notifier.StatusChanges[^1];
        Assert.Equal(OrderStatus.Confirmed, evt2.PreviousStatus);
        Assert.Equal(OrderStatus.Preparing, evt2.NewStatus);

        // 3. Mark Ready: Preparing -> Ready
        var readyResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/mark-ready",
            new { notes = "Packed and ready for pickup/delivery" });
        Assert.Equal(HttpStatusCode.OK, readyResp.StatusCode);
        var readyDto = await readyResp.Content.ReadFromJsonAsync<KitchenOrderDto>(JsonOptions);
        Assert.NotNull(readyDto);
        Assert.Equal(OrderStatus.Ready, readyDto.Status);

        Assert.Equal(3, factory.Notifier.StatusChanges.Count);
        var evt3 = factory.Notifier.StatusChanges[^1];
        Assert.Equal(OrderStatus.Preparing, evt3.PreviousStatus);
        Assert.Equal(OrderStatus.Ready, evt3.NewStatus);
    }

    [Fact]
    public async Task UnifiedTransitionEndpointWorksForKitchenTransitions()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-UNIFIED-001", OrderStatus.Pending);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        var response = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/transition",
            new { targetStatus = "Preparing", notes = "Direct start" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<KitchenOrderDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal(OrderStatus.Preparing, dto.Status);
    }

    [Fact]
    public async Task StateTransitionsRejectIllegalTransitionsWith400BadRequest()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-ILLEGAL-001", OrderStatus.Pending);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        // Illegal: Pending -> Ready
        var badResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/mark-ready",
            new { });
        Assert.Equal(HttpStatusCode.BadRequest, badResp.StatusCode);

        var problem = await badResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.True(problem.Extensions.ContainsKey("code"));
        Assert.Equal("invalid_order_transition", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task StateTransitionsRejectOutOfScopeTargetStatus()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-OOS-001", OrderStatus.Preparing);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        // Kitchen cannot transition to Delivered or OnTheWay
        var badResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/transition",
            new { targetStatus = "Delivered" });

        Assert.Equal(HttpStatusCode.BadRequest, badResp.StatusCode);
        var problem = await badResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("invalid_order_transition", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task StateTransitionsReturn404WhenOrderNotFound()
    {
        await factory.ResetAsync();
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        var response = await kitchenClient.PostAsJsonAsync(
            "/api/kitchen/orders/BH-NONEXISTENT/confirm",
            new { });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("order_not_found", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task OptimisticConcurrencyConflictReturns409ConflictWhenRowVersionStale()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-CONCURRENCY-001", OrderStatus.Pending);

        var kitchenClient1 = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        var kitchenClient2 = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        // Client 1 gets active orders and captures rowVersion
        var getResp = await kitchenClient1.GetAsync("/api/kitchen/orders/active");
        var orders = await getResp.Content.ReadFromJsonAsync<List<KitchenOrderDto>>(JsonOptions);
        var orderSnapshot = orders!.First(o => o.PublicCode == "BH-CONCURRENCY-001");
        var initialRowVersion = orderSnapshot.RowVersion;

        // Client 2 transitions the order first (updating rowversion)
        var client2Resp = await kitchenClient2.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/confirm",
            new { notes = "Confirmed by Manager" });
        Assert.Equal(HttpStatusCode.OK, client2Resp.StatusCode);

        // Client 1 tries to transition with their stale rowVersion
        var client1Resp = await kitchenClient1.PostAsJsonAsync(
            $"/api/kitchen/orders/{order.PublicCode}/start-preparing",
            new { rowVersion = initialRowVersion, notes = "Chef start" });

        Assert.Equal(HttpStatusCode.Conflict, client1Resp.StatusCode);
        var problem = await client1Resp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("concurrency_conflict", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task ToggleMenuItemAvailabilityUpdatesStatusBroadcastsSignalRAndReflectsInPublicMenu()
    {
        await factory.ResetAsync();
        var itemId = OrderingApiFactory.ActiveItemId;

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        var publicClient = factory.CreateClient();

        factory.Notifier.Clear();

        // 1. Mark Unavailable
        var toggleOffResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/menu-items/{itemId}/availability",
            new { isAvailable = false });
        Assert.Equal(HttpStatusCode.OK, toggleOffResp.StatusCode);

        // Verify SignalR event
        Assert.Single(factory.Notifier.AvailabilityChanges);
        Assert.Equal(itemId, factory.Notifier.AvailabilityChanges[0].MenuItemId);
        Assert.False(factory.Notifier.AvailabilityChanges[0].IsAvailable);

        // Verify public menu reflection
        var menuResp = await publicClient.GetAsync("/api/menu/items");
        var menuItems = await menuResp.Content.ReadFromJsonAsync<List<MenuItemDto>>(JsonOptions);
        var item = menuItems!.First(i => i.Id == itemId);
        Assert.False(item.IsAvailable);

        // 2. Mark Available again using alias route
        var toggleOnResp = await kitchenClient.PostAsJsonAsync(
            $"/api/menu/items/{itemId}/availability",
            new { isAvailable = true });
        Assert.Equal(HttpStatusCode.OK, toggleOnResp.StatusCode);

        // Verify public menu reflection
        var menuResp2 = await publicClient.GetAsync("/api/menu/items");
        var menuItems2 = await menuResp2.Content.ReadFromJsonAsync<List<MenuItemDto>>(JsonOptions);
        var item2 = menuItems2!.First(i => i.Id == itemId);
        Assert.True(item2.IsAvailable);
    }

    [Fact]
    public async Task ToggleMenuItemAvailabilityReturns404WhenItemNotFound()
    {
        await factory.ResetAsync();
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Chef Mustafa");

        var response = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/menu-items/{Guid.NewGuid()}/availability",
            new { isAvailable = false });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AuthorizationEnforcementOnlyAuthorizedRolesCanAccessKitchen()
    {
        await factory.ResetAsync();

        // 1. Unauthenticated client -> 401 Unauthorized
        var unauthenticatedClient = factory.CreateClient();
        var unauthResp = await unauthenticatedClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthResp.StatusCode);

        // 2. Cashier role -> 403 Forbidden
        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");
        var cashierResp = await cashierClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.Forbidden, cashierResp.StatusCode);

        // 3. Driver role -> 403 Forbidden
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver@bab-al-hara.local",
            "Driver",
            "Driver User");
        var driverResp = await driverClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.Forbidden, driverResp.StatusCode);

        // 4. Kitchen role -> 200 OK
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen User");
        var kitchenResp = await kitchenClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.OK, kitchenResp.StatusCode);

        // 5. Manager role -> 200 OK
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager User");
        var managerResp = await managerClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.OK, managerResp.StatusCode);

        // 6. Admin role -> 200 OK
        var adminClient = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "Admin User");
        var adminResp = await adminClient.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.OK, adminResp.StatusCode);
    }

    private async Task<Order> CreateSampleOrderInDbAsync(string publicCode, OrderStatus status)
    {
        await using var dbContext = factory.CreateDbContext();
        var order = new Order(
            Guid.NewGuid(),
            publicCode,
            DateTimeOffset.UtcNow,
            OrderType.Takeaway,
            "Customer Name",
            "01012345678",
            null,
            null,
            null,
            null,
            0m,
            "Fast please");

        order.AddItem(
            Guid.NewGuid(),
            OrderingApiFactory.ActiveItemId,
            "سندوتش كفتة",
            "Kofta sandwich",
            2,
            85m);

        if (status == OrderStatus.Confirmed)
        {
            order.TransitionTo(OrderStatus.Confirmed);
        }
        else if (status == OrderStatus.Preparing)
        {
            order.TransitionTo(OrderStatus.Preparing);
        }
        else if (status == OrderStatus.Ready)
        {
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
        }
        else if (status == OrderStatus.Delivered)
        {
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            order.TransitionTo(OrderStatus.OnTheWay);
            order.TransitionTo(OrderStatus.Delivered);
        }

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();
        return order;
    }
}
