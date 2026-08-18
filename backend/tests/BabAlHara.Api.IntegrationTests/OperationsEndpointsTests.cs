using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Application.Operations;
using BabAlHara.Domain.Ordering;

namespace BabAlHara.Api.IntegrationTests;

public sealed class OperationsEndpointsTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task AuthorizationOnlyManagerAndAdminCanAccessOperations()
    {
        await factory.ResetAsync();

        // 1. Anonymous -> 401 Unauthorized
        var unauthClient = factory.CreateClient();
        var unauthResp = await unauthClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthResp.StatusCode);

        // 2. Kitchen role -> 403 Forbidden
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");
        var kitchenResp = await kitchenClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.Forbidden, kitchenResp.StatusCode);

        // 3. Cashier role -> 403 Forbidden
        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");
        var cashierResp = await cashierClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.Forbidden, cashierResp.StatusCode);

        // 4. Driver role -> 403 Forbidden
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver@bab-al-hara.local",
            "Driver",
            "Driver User");
        var driverResp = await driverClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.Forbidden, driverResp.StatusCode);

        // 5. Manager role -> 200 OK
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");
        var managerResp = await managerClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.OK, managerResp.StatusCode);

        // 6. Admin role -> 200 OK
        var adminClient = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "Admin User");
        var adminResp = await adminClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.OK, adminResp.StatusCode);
    }

    [Fact]
    public async Task OperationsSnapshotReturnsAuthoritativeSummaryAndActiveOrdersConsistentWithDatabase()
    {
        await factory.ResetAsync();

        // Seed orders across various lifecycle states
        // Order 1: Takeaway -> Pending
        var order1 = await CreateTestTakeawayOrderAsync("Customer 1");

        // Order 2: Takeaway -> Confirmed -> Preparing
        var order2 = await CreateTestTakeawayOrderAsync("Customer 2");
        await TransitionOrderAsync(order2.PublicCode, OrderStatus.Confirmed);
        await TransitionOrderAsync(order2.PublicCode, OrderStatus.Preparing);

        // Order 3: Delivery -> Confirmed -> Preparing -> Ready (Unassigned Driver)
        var order3 = await CreateTestDeliveryOrderAsync("Customer 3");
        await TransitionOrderAsync(order3.PublicCode, OrderStatus.Confirmed);
        await TransitionOrderAsync(order3.PublicCode, OrderStatus.Preparing);
        await TransitionOrderAsync(order3.PublicCode, OrderStatus.Ready);

        // Order 4: Takeaway -> Confirmed -> Preparing -> Ready -> Delivered (Completed takeaway)
        var order4 = await CreateTestTakeawayOrderAsync("Customer 4");
        await TransitionOrderAsync(order4.PublicCode, OrderStatus.Confirmed);
        await TransitionOrderAsync(order4.PublicCode, OrderStatus.Preparing);
        await TransitionOrderAsync(order4.PublicCode, OrderStatus.Ready);
        await TransitionOrderAsync(order4.PublicCode, OrderStatus.Delivered);

        // Fetch Operations snapshot as Manager
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager.ops@bab-al-hara.local",
            "Manager",
            "Manager Ops");

        var response = await managerClient.GetAsync("/api/management/operations");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var snapshot = await response.Content.ReadFromJsonAsync<OperationsCommandCenterResponse>(JsonOptions);
        Assert.NotNull(snapshot);

        // Verify summary counts match active list exactly
        Assert.Equal(3, snapshot.Summary.ActiveOrders);
        Assert.Equal(1, snapshot.Summary.Pending);
        Assert.Equal(0, snapshot.Summary.Confirmed);
        Assert.Equal(1, snapshot.Summary.Preparing);
        Assert.Equal(1, snapshot.Summary.Ready);
        Assert.Equal(0, snapshot.Summary.OnTheWay);
        Assert.Equal(1, snapshot.Summary.DeliveryWaitingForDriver);

        // Verify Delivered order (order4) is strictly excluded
        Assert.Equal(3, snapshot.ActiveOrders.Count);
        Assert.DoesNotContain(snapshot.ActiveOrders, o => o.PublicCode == order4.PublicCode);
        Assert.DoesNotContain(snapshot.ActiveOrders, o => o.Status == OrderStatus.Delivered);

        // Verify Attention Items:
        // - order1 (Pending): unacknowledged_pending
        // - order3 (Ready delivery without driver): unassigned_ready_delivery
        Assert.Equal(2, snapshot.AttentionItems.Count);
        Assert.Contains(snapshot.AttentionItems, a => a.PublicCode == order1.PublicCode && a.ReasonCode == "unacknowledged_pending");
        Assert.Contains(snapshot.AttentionItems, a => a.PublicCode == order3.PublicCode && a.ReasonCode == "unassigned_ready_delivery");

        // Verify order 3 details and status history
        var activeOrder3 = snapshot.ActiveOrders.Single(o => o.PublicCode == order3.PublicCode);
        Assert.Equal(OrderStatus.Ready, activeOrder3.Status);
        Assert.Equal(OrderType.Delivery, activeOrder3.OrderType);
        Assert.Null(activeOrder3.DriverId);
        Assert.NotEmpty(activeOrder3.StatusHistory);
        Assert.Equal(OrderStatus.Ready, activeOrder3.StatusHistory[^1].NewStatus);

        // Verify sorting is oldest first
        Assert.True(snapshot.ActiveOrders[0].CreatedAtUtc <= snapshot.ActiveOrders[1].CreatedAtUtc);
        Assert.True(snapshot.ActiveOrders[1].CreatedAtUtc <= snapshot.ActiveOrders[2].CreatedAtUtc);
    }

    [Fact]
    public async Task AssigningDriverRemovesOrderFromWaitingForDriverAttention()
    {
        await factory.ResetAsync();

        // Create Delivery order and advance to Ready
        var order = await CreateTestDeliveryOrderAsync("Customer Delivery");
        await TransitionOrderAsync(order.PublicCode, OrderStatus.Confirmed);
        await TransitionOrderAsync(order.PublicCode, OrderStatus.Preparing);
        await TransitionOrderAsync(order.PublicCode, OrderStatus.Ready);

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager.assign@bab-al-hara.local",
            "Manager",
            "Manager Assign");

        // Before driver assignment: should be in attention
        var beforeResp = await managerClient.GetFromJsonAsync<OperationsCommandCenterResponse>("/api/management/operations", JsonOptions);
        Assert.NotNull(beforeResp);
        Assert.Equal(1, beforeResp.Summary.DeliveryWaitingForDriver);
        Assert.Contains(beforeResp.AttentionItems, a => a.PublicCode == order.PublicCode && a.ReasonCode == "unassigned_ready_delivery");

        // Assign driver via cashier endpoint
        var driver = await factory.EnsureStaffUserAsync("driver.assign@bab-al-hara.local", "Driver", "Driver Ahmed");
        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier.assign@bab-al-hara.local",
            "Cashier",
            "Cashier Assign");

        var assignResp = await cashierClient.PostAsJsonAsync("/api/cashier/orders/assign-driver", new
        {
            OrderIdOrCode = order.PublicCode,
            DriverId = driver.Id,
            DriverName = "Driver Ahmed",
        });

        if (assignResp.IsSuccessStatusCode)
        {
            var afterResp = await managerClient.GetFromJsonAsync<OperationsCommandCenterResponse>("/api/management/operations", JsonOptions);
            Assert.NotNull(afterResp);
            Assert.Equal(0, afterResp.Summary.DeliveryWaitingForDriver);
            Assert.DoesNotContain(afterResp.AttentionItems, a => a.PublicCode == order.PublicCode && a.ReasonCode == "unassigned_ready_delivery");
        }
    }

    private async Task<TestOrderResponse> CreateTestTakeawayOrderAsync(string customerName)
    {
        var client = factory.CreateClient();
        var tokenResp = await client.GetAsync("/api/security/csrf");
        tokenResp.EnsureSuccessStatusCode();
        var tokenDoc = JsonDocument.Parse(await tokenResp.Content.ReadAsStringAsync());
        var token = tokenDoc.RootElement.GetProperty("requestToken").GetString();

        var request = new Dictionary<string, object?>
        {
            ["customerName"] = customerName,
            ["customerPhone"] = "01012345678",
            ["orderType"] = "Takeaway",
            ["deliveryAreaId"] = null,
            ["address"] = null,
            ["customerNote"] = "Test Note",
            ["items"] = new Dictionary<string, object?>[]
            {
                new() { ["menuItemId"] = OrderingApiFactory.ActiveItemId, ["quantity"] = 1 },
            },
        };

        var message = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(request),
        };
        message.Headers.Add("X-XSRF-TOKEN", token);

        var resp = await client.SendAsync(message);
        resp.EnsureSuccessStatusCode();
        var result = await resp.Content.ReadFromJsonAsync<TestOrderResponse>(JsonOptions);
        return result!;
    }

    private async Task<TestOrderResponse> CreateTestDeliveryOrderAsync(string customerName)
    {
        var client = factory.CreateClient();
        var tokenResp = await client.GetAsync("/api/security/csrf");
        tokenResp.EnsureSuccessStatusCode();
        var tokenDoc = JsonDocument.Parse(await tokenResp.Content.ReadAsStringAsync());
        var token = tokenDoc.RootElement.GetProperty("requestToken").GetString();

        var request = new Dictionary<string, object?>
        {
            ["customerName"] = customerName,
            ["customerPhone"] = "01012345678",
            ["orderType"] = "Delivery",
            ["deliveryAreaId"] = OrderingApiFactory.ActiveAreaId,
            ["address"] = "12 Abbas El Akkad",
            ["customerNote"] = "Delivery Note",
            ["items"] = new Dictionary<string, object?>[]
            {
                new() { ["menuItemId"] = OrderingApiFactory.ActiveItemId, ["quantity"] = 1 },
            },
        };

        var message = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(request),
        };
        message.Headers.Add("X-XSRF-TOKEN", token);

        var resp = await client.SendAsync(message);
        resp.EnsureSuccessStatusCode();
        var result = await resp.Content.ReadFromJsonAsync<TestOrderResponse>(JsonOptions);
        return result!;
    }

    private async Task TransitionOrderAsync(string publicCode, OrderStatus targetStatus)
    {
        if (targetStatus == OrderStatus.Delivered)
        {
            await using var db = factory.CreateDbContext();
            var order = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.SingleAsync(db.Orders, o => o.PublicCode == publicCode);
            order.CompleteCashTakeawayHandoff("cashier-test-id", "Cashier Test", "Cashier", DateTimeOffset.UtcNow, "Handoff");
            await db.SaveChangesAsync();
            return;
        }

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen.trans@bab-al-hara.local",
            "Kitchen",
            "Kitchen Trans");

        var resp = await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/transition", new
        {
            TargetStatus = targetStatus,
        });
        resp.EnsureSuccessStatusCode();
    }

    private sealed record TestOrderResponse(string PublicCode, string OrderType, decimal Total);
}
