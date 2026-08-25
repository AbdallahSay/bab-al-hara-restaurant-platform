using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Application.Driver;
using BabAlHara.Domain.Ordering;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace BabAlHara.Api.IntegrationTests;

public sealed class DriverApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task GetAvailableDriversReturnsDriversAndEnforcesCashierAccess()
    {
        await factory.ResetAsync();

        var driver1 = await factory.EnsureStaffUserAsync("driver1@bab-al-hara.local", "Driver", "Driver Ahmad");
        var driver2 = await factory.EnsureStaffUserAsync("driver2@bab-al-hara.local", "Driver", "Driver Bilal");

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        var response = await cashierClient.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var drivers = await response.Content.ReadFromJsonAsync<List<DriverSummaryDto>>(JsonOptions);
        Assert.NotNull(drivers);
        Assert.Contains(drivers, d => d.Id == driver1.Id && d.Name == "Driver Ahmad");
        Assert.Contains(drivers, d => d.Id == driver2.Id && d.Name == "Driver Bilal");

        // Authorization check: Driver role cannot view cashier drivers endpoint
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver1@bab-al-hara.local",
            "Driver",
            "Driver Ahmad");
        var forbiddenResp = await driverClient.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResp.StatusCode);
    }

    [Fact]
    public async Task AssignDriverSucceedsForReadyDeliveryOrderAndEmitsSignalREvent()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.assign@bab-al-hara.local", "Driver", "Driver Samer");
        var order = await CreateSampleOrderInDbAsync("BH-DELIV-001", OrderType.Delivery, OrderStatus.Ready);

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        factory.DriverNotifier.Clear();

        var assignResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/assign-driver",
            new { driverId = driver.Id });

        Assert.Equal(HttpStatusCode.OK, assignResp.StatusCode);
        var dto = await assignResp.Content.ReadFromJsonAsync<DriverOrderDto>(JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal(driver.Id, dto.DriverId);
        Assert.Equal("Driver Samer", dto.DriverName);
        Assert.NotNull(dto.DriverAssignedAtUtc);
        Assert.Equal(OrderStatus.Ready, dto.Status);

        Assert.Single(factory.DriverNotifier.DriverAssignedEvents);
        var evt = factory.DriverNotifier.DriverAssignedEvents[0];
        Assert.Equal("BH-DELIV-001", evt.PublicCode);
        Assert.Equal(driver.Id, evt.DriverId);
        Assert.Equal("Driver Samer", evt.DriverName);
    }

    [Fact]
    public async Task AssignDriverPersistsInSqlAndCashierGetPreservesDriverOnRefresh()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.persist@bab-al-hara.local", "Driver", "Driver Tarek");
        var order = await CreateSampleOrderInDbAsync("BH-DELIV-REFRESH-001", OrderType.Delivery, OrderStatus.Ready);

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        // 1. Initial Cashier GET before assignment
        var getBeforeResp = await cashierClient.GetAsync("/api/cashier/orders");
        Assert.Equal(HttpStatusCode.OK, getBeforeResp.StatusCode);
        var ordersBefore = await getBeforeResp.Content.ReadFromJsonAsync<List<BabAlHara.Application.Cashier.CashierOrderDto>>(JsonOptions);
        Assert.NotNull(ordersBefore);
        var orderBefore = ordersBefore.First(o => o.PublicCode == "BH-DELIV-REFRESH-001");
        Assert.Null(orderBefore.DriverId);
        Assert.Null(orderBefore.DriverName);

        // 2. Assign driver via API
        var assignResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/assign-driver",
            new { driverId = driver.Id });
        Assert.Equal(HttpStatusCode.OK, assignResp.StatusCode);

        // 3. Verify persistence directly via fresh isolated DbContext scope
        using (var scope = factory.Services.CreateScope())
        {
            var freshDb = scope.ServiceProvider.GetRequiredService<BabAlHara.Infrastructure.Persistence.AppDbContext>();
            var persistedOrder = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
                freshDb.Orders,
                o => o.PublicCode == "BH-DELIV-REFRESH-001");

            Assert.NotNull(persistedOrder);
            Assert.Equal(driver.Id, persistedOrder.DriverId);
            Assert.Equal("Driver Tarek", persistedOrder.DriverName);
            Assert.NotNull(persistedOrder.DriverAssignedAtUtc);
            Assert.Equal(OrderStatus.Ready, persistedOrder.Status);
        }

        // 4. Cashier GET after assignment (authoritative refresh simulation)
        var getAfterResp = await cashierClient.GetAsync("/api/cashier/orders");
        Assert.Equal(HttpStatusCode.OK, getAfterResp.StatusCode);
        var ordersAfter = await getAfterResp.Content.ReadFromJsonAsync<List<BabAlHara.Application.Cashier.CashierOrderDto>>(JsonOptions);
        Assert.NotNull(ordersAfter);
        var orderAfter = ordersAfter.First(o => o.PublicCode == "BH-DELIV-REFRESH-001");

        Assert.Equal(driver.Id, orderAfter.DriverId);
        Assert.Equal("Driver Tarek", orderAfter.DriverName);
        Assert.NotNull(orderAfter.DriverAssignedAtUtc);
        Assert.Equal(OrderStatus.Ready, orderAfter.Status);

        // 5. Driver portal GET /api/driver/orders/assigned cross-check
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.persist@bab-al-hara.local",
            "Driver",
            "Driver Tarek");
        var driverOrdersResp = await driverClient.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.OK, driverOrdersResp.StatusCode);
        var driverOrders = await driverOrdersResp.Content.ReadFromJsonAsync<List<DriverOrderDto>>(JsonOptions);
        Assert.NotNull(driverOrders);
        Assert.Contains(driverOrders, o => o.PublicCode == "BH-DELIV-REFRESH-001");
    }

    [Fact]
    public async Task AssignDriverRejectsTakeawayOrderWith400BadRequest()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.takeaway@bab-al-hara.local", "Driver", "Driver Samer");
        var order = await CreateSampleOrderInDbAsync("BH-TAKEAWAY-001", OrderType.Takeaway, OrderStatus.Ready);

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        var assignResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/assign-driver",
            new { driverId = driver.Id });

        Assert.Equal(HttpStatusCode.BadRequest, assignResp.StatusCode);
        var problem = await assignResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("invalid_order_transition", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task AssignDriverRejectsNonReadyDeliveryOrder()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.prep@bab-al-hara.local", "Driver", "Driver Samer");
        var order = await CreateSampleOrderInDbAsync("BH-PREP-001", OrderType.Delivery, OrderStatus.Preparing);

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        var assignResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/assign-driver",
            new { driverId = driver.Id });

        Assert.Equal(HttpStatusCode.BadRequest, assignResp.StatusCode);
        var problem = await assignResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("invalid_order_transition", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task AssignDriverReturns404WhenDriverNotFound()
    {
        await factory.ResetAsync();
        var order = await CreateSampleOrderInDbAsync("BH-NODRIVER-001", OrderType.Delivery, OrderStatus.Ready);

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        var assignResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/assign-driver",
            new { driverId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.NotFound, assignResp.StatusCode);
        var problem = await assignResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("driver_not_found", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task AssignDriverReturns409OnConcurrencyConflict()
    {
        await factory.ResetAsync();
        var driver1 = await factory.EnsureStaffUserAsync("driver.c1@bab-al-hara.local", "Driver", "Driver 1");
        var driver2 = await factory.EnsureStaffUserAsync("driver.c2@bab-al-hara.local", "Driver", "Driver 2");
        var order = await CreateSampleOrderInDbAsync("BH-CONC-ASSIGN-001", OrderType.Delivery, OrderStatus.Ready);

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");

        // Stale row version
        var staleRowVersion = Convert.ToBase64String([1, 2, 3, 4, 5, 6, 7, 8]);

        var response = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/assign-driver",
            new { driverId = driver1.Id, rowVersion = staleRowVersion });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("concurrency_conflict", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task GetAssignedDriverOrdersReturnsReadyOnTheWayAndRecentDeliveredOrdersForCallerWithDriverIsolation()
    {
        await factory.ResetAsync();
        var driver1 = await factory.EnsureStaffUserAsync("driver.active1@bab-al-hara.local", "Driver", "Driver 1");
        var driver2 = await factory.EnsureStaffUserAsync("driver.active2@bab-al-hara.local", "Driver", "Driver 2");

        var orderReady = await CreateSampleOrderInDbAsync("BH-D-READY-001", OrderType.Delivery, OrderStatus.Ready, driver1.Id, driver1.DisplayName);
        var orderOnTheWay = await CreateSampleOrderInDbAsync("BH-D-ONWAY-001", OrderType.Delivery, OrderStatus.OnTheWay, driver1.Id, driver1.DisplayName);
        var orderDelivered = await CreateSampleOrderInDbAsync("BH-D-DELIV-001", OrderType.Delivery, OrderStatus.Delivered, driver1.Id, driver1.DisplayName);
        var otherDriverOrder = await CreateSampleOrderInDbAsync("BH-D-OTHER-001", OrderType.Delivery, OrderStatus.Ready, driver2.Id, driver2.DisplayName);

        var driver1Client = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.active1@bab-al-hara.local",
            "Driver",
            "Driver 1");

        var response = await driver1Client.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var orders = await response.Content.ReadFromJsonAsync<List<DriverOrderDto>>(JsonOptions);
        Assert.NotNull(orders);
        Assert.Equal(3, orders.Count);
        Assert.Equal("BH-D-ONWAY-001", orders[0].PublicCode);
        Assert.Equal("BH-D-READY-001", orders[1].PublicCode);
        Assert.Equal("BH-D-DELIV-001", orders[2].PublicCode);
        Assert.DoesNotContain(orders, o => o.PublicCode == "BH-D-OTHER-001");
    }

    [Fact]
    public async Task StartDeliveryAndMarkDeliveredLifecycleSucceedsAndSettlesCash()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.life@bab-al-hara.local", "Driver", "Driver Life");
        var order = await CreateSampleOrderInDbAsync("BH-LIFE-001", OrderType.Delivery, OrderStatus.Ready, driver.Id, driver.DisplayName);

        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.life@bab-al-hara.local",
            "Driver",
            "Driver Life");

        factory.DriverNotifier.Clear();

        // 1. Ready -> OnTheWay
        var startResp = await driverClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/start-delivery",
            new { notes = "Picked up from kitchen" });

        Assert.Equal(HttpStatusCode.OK, startResp.StatusCode);
        var onTheWayDto = await startResp.Content.ReadFromJsonAsync<DriverOrderDto>(JsonOptions);
        Assert.NotNull(onTheWayDto);
        Assert.Equal(OrderStatus.OnTheWay, onTheWayDto.Status);
        Assert.Equal(PaymentStatus.Pending, onTheWayDto.PaymentStatus);

        Assert.Single(factory.DriverNotifier.StatusChanges);
        var evt1 = factory.DriverNotifier.StatusChanges[^1];
        Assert.Equal("BH-LIFE-001", evt1.PublicCode);
        Assert.Equal(OrderStatus.Ready, evt1.PreviousStatus);
        Assert.Equal(OrderStatus.OnTheWay, evt1.NewStatus);

        // 2. OnTheWay -> Delivered (Cash order settles to Paid)
        var deliverResp = await driverClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/mark-delivered",
            new { notes = "Handed to customer and collected cash" });

        Assert.Equal(HttpStatusCode.OK, deliverResp.StatusCode);
        var deliveredDto = await deliverResp.Content.ReadFromJsonAsync<DriverOrderDto>(JsonOptions);
        Assert.NotNull(deliveredDto);
        Assert.Equal(OrderStatus.Delivered, deliveredDto.Status);
        Assert.Equal(PaymentStatus.Paid, deliveredDto.PaymentStatus);

        Assert.Equal(2, factory.DriverNotifier.StatusChanges.Count);
        var evt2 = factory.DriverNotifier.StatusChanges[^1];
        Assert.Equal(OrderStatus.OnTheWay, evt2.PreviousStatus);
        Assert.Equal(OrderStatus.Delivered, evt2.NewStatus);
    }

    [Fact]
    public async Task StartDeliveryRejectsNonAssignedDriverWith403Forbidden()
    {
        await factory.ResetAsync();
        var assignedDriver = await factory.EnsureStaffUserAsync("driver.assigned@bab-al-hara.local", "Driver", "Assigned Driver");
        var intruderDriver = await factory.EnsureStaffUserAsync("driver.intruder@bab-al-hara.local", "Driver", "Intruder Driver");

        var order = await CreateSampleOrderInDbAsync("BH-INTRUDER-001", OrderType.Delivery, OrderStatus.Ready, assignedDriver.Id, assignedDriver.DisplayName);

        var intruderClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.intruder@bab-al-hara.local",
            "Driver",
            "Intruder Driver");

        var response = await intruderClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/start-delivery",
            new { });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("forbidden", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task MarkDeliveredRejectsReadyStatusDirectlyForDeliveryOrders()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.direct@bab-al-hara.local", "Driver", "Driver Direct");
        var order = await CreateSampleOrderInDbAsync("BH-DIRECT-001", OrderType.Delivery, OrderStatus.Ready, driver.Id, driver.DisplayName);

        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.direct@bab-al-hara.local",
            "Driver",
            "Driver Direct");

        // Illegal: Ready -> Delivered directly for Delivery order
        var response = await driverClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/mark-delivered",
            new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("invalid_order_transition", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task DeliveryTransitionsReturn409OnConcurrencyConflict()
    {
        await factory.ResetAsync();
        var driver = await factory.EnsureStaffUserAsync("driver.conflict@bab-al-hara.local", "Driver", "Driver Conflict");
        var order = await CreateSampleOrderInDbAsync("BH-CONC-TRANS-001", OrderType.Delivery, OrderStatus.Ready, driver.Id, driver.DisplayName);

        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.conflict@bab-al-hara.local",
            "Driver",
            "Driver Conflict");

        var staleRowVersion = Convert.ToBase64String([9, 8, 7, 6, 5, 4, 3, 2]);

        var response = await driverClient.PostAsJsonAsync(
            $"/api/orders/{order.PublicCode}/start-delivery",
            new { rowVersion = staleRowVersion });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("concurrency_conflict", problem.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task AuthorizationPoliciesEnforceAccessControls()
    {
        await factory.ResetAsync();

        // 1. Unauthenticated -> 401 Unauthorized
        var anonymousClient = factory.CreateClient();
        var unauth1 = await anonymousClient.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.Unauthorized, unauth1.StatusCode);
        var unauth2 = await anonymousClient.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.Unauthorized, unauth2.StatusCode);

        // 2. Kitchen role attempting driver endpoint -> 403 Forbidden
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen.staff@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");
        var kitchenResp = await kitchenClient.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.Forbidden, kitchenResp.StatusCode);

        // 3. Driver role attempting cashier endpoint -> 403 Forbidden
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.policy@bab-al-hara.local",
            "Driver",
            "Driver Policy");
        var driverCashierResp = await driverClient.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.Forbidden, driverCashierResp.StatusCode);

        // 4. Manager role has DriverAccess and CashierAccess -> 200 OK
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager.policy@bab-al-hara.local",
            "Manager",
            "Manager User");
        var managerDriverResp = await managerClient.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.OK, managerDriverResp.StatusCode);
        var managerCashierResp = await managerClient.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.OK, managerCashierResp.StatusCode);

        // 5. Admin role has DriverAccess and CashierAccess -> 200 OK
        var adminClient = await factory.CreateAuthenticatedStaffClientAsync(
            "admin.policy@bab-al-hara.local",
            "Admin",
            "Admin User");
        var adminDriverResp = await adminClient.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.OK, adminDriverResp.StatusCode);
        var adminCashierResp = await adminClient.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.OK, adminCashierResp.StatusCode);
    }

    private async Task<Order> CreateSampleOrderInDbAsync(
        string publicCode,
        OrderType orderType,
        OrderStatus status,
        Guid? driverId = null,
        string? driverName = null)
    {
        await using var dbContext = factory.CreateDbContext();

        var order = new Order(
            Guid.NewGuid(),
            publicCode,
            DateTimeOffset.UtcNow,
            orderType,
            "Customer Test",
            "01012345678",
            orderType == OrderType.Delivery ? OrderingApiFactory.ActiveAreaId : null,
            orderType == OrderType.Delivery ? "مدينة نصر" : null,
            orderType == OrderType.Delivery ? "Nasr City" : null,
            orderType == OrderType.Delivery ? "15 Abbas El Akkad" : null,
            orderType == OrderType.Delivery ? 35m : 0m,
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
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
        }
        else if (status == OrderStatus.Ready)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            if (driverId.HasValue && !string.IsNullOrWhiteSpace(driverName))
            {
                order.AssignDriver(driverId.Value, driverName, "cashier-1", "Cashier", DateTimeOffset.UtcNow);
            }
        }
        else if (status == OrderStatus.OnTheWay)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            order.AssignDriver(driverId ?? Guid.NewGuid(), driverName ?? "Driver 1", "cashier-1", "Cashier", DateTimeOffset.UtcNow);
            order.TransitionTo(OrderStatus.OnTheWay);
        }
        else if (status == OrderStatus.Delivered)
        {
            order.TransitionTo(OrderStatus.Confirmed);
            order.TransitionTo(OrderStatus.Preparing);
            order.TransitionTo(OrderStatus.Ready);
            if (orderType == OrderType.Delivery)
            {
                order.AssignDriver(driverId ?? Guid.NewGuid(), driverName ?? "Driver 1", "cashier-1", "Cashier", DateTimeOffset.UtcNow);
                order.TransitionTo(OrderStatus.OnTheWay);
                order.TransitionTo(OrderStatus.Delivered);
            }
            else
            {
                order.TransitionTo(OrderStatus.Delivered);
            }
        }

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();
        return order;
    }
}
