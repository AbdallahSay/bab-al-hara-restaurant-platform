using System.Net;
using System.Net.Http.Json;
using BabAlHara.Application.Reporting;
using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Delivery;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BabAlHara.Api.IntegrationTests;

[Collection("Sequential")]
public sealed class ManagementReportsApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly TimeZoneInfo CairoTz = ResolveCairoTimeZone();

    [Fact]
    public async Task GetReportsAnonymousReturnsUnauthorized()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/management/reports?from=2026-08-01&to=2026-08-20");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("kitchen@bab-al-hara.local", "Kitchen", "Kitchen User", "kitchen")]
    [InlineData("cashier@bab-al-hara.local", "Cashier", "Cashier User", "cashier")]
    [InlineData("driver@bab-al-hara.local", "Driver", "Driver User", "driver")]
    public async Task GetReportsNonManagementStaffReturnsForbidden(
        string email,
        string role,
        string displayName,
        string portal)
    {
        await factory.ResetAsync();
        var client = await factory.CreateAuthenticatedStaffClientAsync(email, role, displayName, portal);

        var response = await client.GetAsync("/api/management/reports?from=2026-08-01&to=2026-08-20");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("manager@bab-al-hara.local", "Manager", "Manager User")]
    [InlineData("admin@bab-al-hara.local", "Admin", "Admin User")]
    public async Task GetReportsManagementStaffReturnsOk(
        string email,
        string role,
        string displayName)
    {
        await factory.ResetAsync();
        var client = await factory.CreateAuthenticatedStaffClientAsync(email, role, displayName, "management");

        var response = await client.GetAsync("/api/management/reports?from=2026-08-01&to=2026-08-20");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var report = await response.Content.ReadFromJsonAsync<ManagementReportResponse>();
        Assert.NotNull(report);
        Assert.Equal("2026-08-01", report.FromDate);
        Assert.Equal("2026-08-20", report.ToDate);
        Assert.Equal("All", report.FulfillmentFilter);
    }

    [Fact]
    public async Task GetReportsInvalidDateRangeReturnsBadRequest()
    {
        await factory.ResetAsync();
        var client = await factory.CreateAuthenticatedStaffClientAsync("mgr.invalid@bab-al-hara.local", "Manager", "Mgr", "management");

        // from > to
        var response1 = await client.GetAsync("/api/management/reports?from=2026-08-20&to=2026-08-01");
        Assert.Equal(HttpStatusCode.BadRequest, response1.StatusCode);

        // invalid format
        var response2 = await client.GetAsync("/api/management/reports?from=invalid&to=2026-08-01");
        Assert.Equal(HttpStatusCode.BadRequest, response2.StatusCode);

        // range > 90 days
        var response3 = await client.GetAsync("/api/management/reports?from=2026-01-01&to=2026-06-01");
        Assert.Equal(HttpStatusCode.BadRequest, response3.StatusCode);
    }

    [Fact]
    public async Task GetReportsDeliveredOrdersRevenueExcludesActiveOrdersAndComputesAccurateMetrics()
    {
        await factory.ResetAsync();
        await using var db = factory.CreateDbContext();

        var baseTime = new DateTimeOffset(2026, 8, 15, 12, 0, 0, TimeSpan.FromHours(3)); // 12:00 Cairo time (UTC+3)

        // 1. Delivered Delivery order (Total: 200 + 35 fee = 235)
        var deliveredOrder1 = new Order(
            Guid.NewGuid(),
            "ORD-RPT-001",
            baseTime,
            OrderType.Delivery,
            "Customer 1",
            "01011111111",
            OrderingApiFactory.ActiveAreaId,
            "مدينة نصر",
            "Nasr City",
            "10 Street",
            35m,
            null);
        deliveredOrder1.AddItem(Guid.NewGuid(), OrderingApiFactory.ActiveItemId, "مشاوي", "Mixed Grill", 2, 100m);

        // Transitions: Pending -> Confirmed -> Preparing -> Ready -> OnTheWay -> Delivered
        deliveredOrder1.TransitionStatus(OrderStatus.Confirmed, "k1", "Kitchen", "Kitchen", baseTime.AddMinutes(2));
        deliveredOrder1.TransitionStatus(OrderStatus.Preparing, "k1", "Kitchen", "Kitchen", baseTime.AddMinutes(5));
        deliveredOrder1.TransitionStatus(OrderStatus.Ready, "k1", "Kitchen", "Kitchen", baseTime.AddMinutes(20));
        deliveredOrder1.AssignDriver(Guid.NewGuid(), "Captain Driver", "c1", "Cashier", baseTime.AddMinutes(22));
        deliveredOrder1.TransitionStatus(OrderStatus.OnTheWay, "d1", "Driver", "Driver", baseTime.AddMinutes(25));
        deliveredOrder1.TransitionStatus(OrderStatus.Delivered, "d1", "Driver", "Driver", baseTime.AddMinutes(45));

        // 2. Delivered Takeaway order (Total: 150, fee: 0)
        var deliveredOrder2 = new Order(
            Guid.NewGuid(),
            "ORD-RPT-002",
            baseTime.AddHours(2),
            OrderType.Takeaway,
            "Customer 2",
            "01022222222",
            null,
            null,
            null,
            null,
            0m,
            null);
        deliveredOrder2.AddItem(Guid.NewGuid(), OrderingApiFactory.SecondActiveItemId, "شاورما", "Shawarma", 3, 50m);
        deliveredOrder2.TransitionStatus(OrderStatus.Confirmed, "k1", "Kitchen", "Kitchen", baseTime.AddHours(2).AddMinutes(1));
        deliveredOrder2.TransitionStatus(OrderStatus.Preparing, "k1", "Kitchen", "Kitchen", baseTime.AddHours(2).AddMinutes(3));
        deliveredOrder2.TransitionStatus(OrderStatus.Ready, "k1", "Kitchen", "Kitchen", baseTime.AddHours(2).AddMinutes(12));
        deliveredOrder2.TransitionStatus(OrderStatus.Delivered, "c1", "Cashier", "Cashier", baseTime.AddHours(2).AddMinutes(15));

        // 3. Active order (Preparing, Total: 500) - Should NOT count towards sales revenue
        var activeOrder = new Order(
            Guid.NewGuid(),
            "ORD-RPT-003",
            baseTime.AddHours(3),
            OrderType.Delivery,
            "Customer 3",
            "01033333333",
            OrderingApiFactory.ActiveAreaId,
            "مدينة نصر",
            "Nasr City",
            "20 Street",
            35m,
            null);
        activeOrder.AddItem(Guid.NewGuid(), OrderingApiFactory.ActiveItemId, "مشاوي", "Mixed Grill", 5, 100m);
        activeOrder.TransitionStatus(OrderStatus.Confirmed, "k1", "Kitchen", "Kitchen", baseTime.AddHours(3).AddMinutes(2));
        activeOrder.TransitionStatus(OrderStatus.Preparing, "k1", "Kitchen", "Kitchen", baseTime.AddHours(3).AddMinutes(5));

        db.Orders.AddRange(deliveredOrder1, deliveredOrder2, activeOrder);
        await db.SaveChangesAsync();

        var client = await factory.CreateAuthenticatedStaffClientAsync("mgr.metrics@bab-al-hara.local", "Manager", "Mgr", "management");
        var response = await client.GetAsync("/api/management/reports?from=2026-08-15&to=2026-08-15");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var report = await response.Content.ReadFromJsonAsync<ManagementReportResponse>();
        Assert.NotNull(report);

        // Summary assertions
        // Completed Revenue = 235 (Order 1) + 150 (Order 2) = 385.00
        Assert.Equal(385.00m, report.Summary.CompletedSalesRevenue);
        Assert.Equal(2, report.Summary.CompletedOrdersCount);
        Assert.Equal(192.50m, report.Summary.AverageOrderValue);
        Assert.Equal(3, report.Summary.TotalOrdersPlaced); // Includes the 1 active order

        // Fulfillment breakdown assertions
        Assert.Equal(1, report.FulfillmentBreakdown.Delivery.Count);
        Assert.Equal(235.00m, report.FulfillmentBreakdown.Delivery.Revenue);
        Assert.Equal(35.00m, report.FulfillmentBreakdown.Delivery.DeliveryFees);
        Assert.Equal(50, report.FulfillmentBreakdown.Delivery.PercentageOfTotal);

        Assert.Equal(1, report.FulfillmentBreakdown.Takeaway.Count);
        Assert.Equal(150.00m, report.FulfillmentBreakdown.Takeaway.Revenue);
        Assert.Equal(0m, report.FulfillmentBreakdown.Takeaway.DeliveryFees);
        Assert.Equal(50, report.FulfillmentBreakdown.Takeaway.PercentageOfTotal);

        // Best Sellers assertions (only delivered orders items included)
        Assert.Equal(2, report.BestSellingItems.Count);
        var topItem = report.BestSellingItems[0];
        Assert.Equal("شاورما", topItem.NameAr);
        Assert.Equal(3, topItem.QuantitySold);
        Assert.Equal(150.00m, topItem.RevenueContribution);

        var secondItem = report.BestSellingItems[1];
        Assert.Equal("مشاوي", secondItem.NameAr);
        Assert.Equal(2, secondItem.QuantitySold); // Active order's 5 items not included
        Assert.Equal(200.00m, secondItem.RevenueContribution);

        // Operational timing assertions
        // Order 1 prep: 20 min, transit: 20 min (45-25), total: 45 min
        // Order 2 prep: 12 min, transit: null, total: 15 min
        // Avg Prep: (20 + 12) / 2 = 16.0 min
        // Avg Transit: 20.0 min
        // Avg Total: (45 + 15) / 2 = 30.0 min
        Assert.True(report.OperationalTiming.HasSufficientData);
        Assert.Equal(16.0m, report.OperationalTiming.AveragePrepTimeMinutes);
        Assert.Equal(20.0m, report.OperationalTiming.AverageDeliveryTransitTimeMinutes);
        Assert.Equal(30.0m, report.OperationalTiming.AverageTotalFulfillmentTimeMinutes);

        // Daily trend consistency invariant: trend sum == summary total
        var trendSumRevenue = report.DailyTrends.Sum(t => t.Revenue);
        var trendSumCompletedCount = report.DailyTrends.Sum(t => t.CompletedOrdersCount);
        var trendSumTotalCount = report.DailyTrends.Sum(t => t.TotalOrdersCount);
        Assert.Equal(report.Summary.CompletedSalesRevenue, trendSumRevenue);
        Assert.Equal(report.Summary.CompletedOrdersCount, trendSumCompletedCount);
        Assert.Equal(report.Summary.TotalOrdersPlaced, trendSumTotalCount);
    }

    [Fact]
    public async Task GetReportsCairoMidnightBoundaryCategorizesOrdersCorrectly()
    {
        await factory.ResetAsync();
        await using var db = factory.CreateDbContext();

        // 23:55 on Aug 15 Cairo time (UTC: Aug 15 20:55)
        var lateAug15Utc = new DateTimeOffset(2026, 8, 15, 20, 55, 0, TimeSpan.Zero);
        // 00:05 on Aug 16 Cairo time (UTC: Aug 15 21:05)
        var earlyAug16Utc = new DateTimeOffset(2026, 8, 15, 21, 5, 0, TimeSpan.Zero);

        var orderDay1 = new Order(
            Guid.NewGuid(), "ORD-MID-01", lateAug15Utc, OrderType.Takeaway, "C1", "01011111111", null, null, null, null, 0m, null);
        orderDay1.AddItem(Guid.NewGuid(), OrderingApiFactory.ActiveItemId, "كباب", "Kebab", 1, 100m);
        orderDay1.TransitionStatus(OrderStatus.Confirmed, null, null, null, lateAug15Utc.AddMinutes(1));
        orderDay1.TransitionStatus(OrderStatus.Preparing, null, null, null, lateAug15Utc.AddMinutes(2));
        orderDay1.TransitionStatus(OrderStatus.Ready, null, null, null, lateAug15Utc.AddMinutes(3));
        orderDay1.TransitionStatus(OrderStatus.Delivered, null, null, null, lateAug15Utc.AddMinutes(4));

        var orderDay2 = new Order(
            Guid.NewGuid(), "ORD-MID-02", earlyAug16Utc, OrderType.Takeaway, "C2", "01022222222", null, null, null, null, 0m, null);
        orderDay2.AddItem(Guid.NewGuid(), OrderingApiFactory.ActiveItemId, "كباب", "Kebab", 1, 100m);
        orderDay2.TransitionStatus(OrderStatus.Confirmed, null, null, null, earlyAug16Utc.AddMinutes(1));
        orderDay2.TransitionStatus(OrderStatus.Preparing, null, null, null, earlyAug16Utc.AddMinutes(2));
        orderDay2.TransitionStatus(OrderStatus.Ready, null, null, null, earlyAug16Utc.AddMinutes(3));
        orderDay2.TransitionStatus(OrderStatus.Delivered, null, null, null, earlyAug16Utc.AddMinutes(4));

        db.Orders.AddRange(orderDay1, orderDay2);
        await db.SaveChangesAsync();

        var client = await factory.CreateAuthenticatedStaffClientAsync("mgr.mid@bab-al-hara.local", "Manager", "Mgr", "management");

        // Query Aug 15 only -> should only include orderDay1
        var response15 = await client.GetAsync("/api/management/reports?from=2026-08-15&to=2026-08-15");
        var report15 = await response15.Content.ReadFromJsonAsync<ManagementReportResponse>();
        Assert.NotNull(report15);
        Assert.Equal(1, report15.Summary.CompletedOrdersCount);
        Assert.Equal(100.00m, report15.Summary.CompletedSalesRevenue);

        // Query Aug 16 only -> should only include orderDay2
        var response16 = await client.GetAsync("/api/management/reports?from=2026-08-16&to=2026-08-16");
        var report16 = await response16.Content.ReadFromJsonAsync<ManagementReportResponse>();
        Assert.NotNull(report16);
        Assert.Equal(1, report16.Summary.CompletedOrdersCount);
        Assert.Equal(100.00m, report16.Summary.CompletedSalesRevenue);
    }

    [Fact]
    public async Task GetReportsFulfillmentFilterFiltersDeliveryOrTakeawayOnly()
    {
        await factory.ResetAsync();
        await using var db = factory.CreateDbContext();

        var time = new DateTimeOffset(2026, 8, 18, 14, 0, 0, TimeSpan.FromHours(3));

        var deliveryOrder = new Order(
            Guid.NewGuid(), "ORD-FL-01", time, OrderType.Delivery, "Deliv", "01011111111",
            OrderingApiFactory.ActiveAreaId, "مدينة نصر", "Nasr City", "Addr", 35m, null);
        deliveryOrder.AddItem(Guid.NewGuid(), OrderingApiFactory.ActiveItemId, "كفتة", "Kofta", 1, 100m);
        deliveryOrder.TransitionStatus(OrderStatus.Confirmed, null, null, null, time.AddMinutes(1));
        deliveryOrder.TransitionStatus(OrderStatus.Preparing, null, null, null, time.AddMinutes(2));
        deliveryOrder.TransitionStatus(OrderStatus.Ready, null, null, null, time.AddMinutes(10));
        deliveryOrder.AssignDriver(Guid.NewGuid(), "Captain", null, null, time.AddMinutes(11));
        deliveryOrder.TransitionStatus(OrderStatus.OnTheWay, null, null, null, time.AddMinutes(12));
        deliveryOrder.TransitionStatus(OrderStatus.Delivered, null, null, null, time.AddMinutes(25));

        var takeawayOrder = new Order(
            Guid.NewGuid(), "ORD-FL-02", time, OrderType.Takeaway, "Take", "01022222222",
            null, null, null, null, 0m, null);
        takeawayOrder.AddItem(Guid.NewGuid(), OrderingApiFactory.ActiveItemId, "كفتة", "Kofta", 1, 100m);
        takeawayOrder.TransitionStatus(OrderStatus.Confirmed, null, null, null, time.AddMinutes(1));
        takeawayOrder.TransitionStatus(OrderStatus.Preparing, null, null, null, time.AddMinutes(2));
        takeawayOrder.TransitionStatus(OrderStatus.Ready, null, null, null, time.AddMinutes(8));
        takeawayOrder.TransitionStatus(OrderStatus.Delivered, null, null, null, time.AddMinutes(10));

        db.Orders.AddRange(deliveryOrder, takeawayOrder);
        await db.SaveChangesAsync();

        var client = await factory.CreateAuthenticatedStaffClientAsync("mgr.fl@bab-al-hara.local", "Manager", "Mgr", "management");

        // Delivery only
        var delivResp = await client.GetAsync("/api/management/reports?from=2026-08-18&to=2026-08-18&fulfillment=Delivery");
        var delivReport = await delivResp.Content.ReadFromJsonAsync<ManagementReportResponse>();
        Assert.NotNull(delivReport);
        Assert.Equal(1, delivReport.Summary.CompletedOrdersCount);
        Assert.Equal(135.00m, delivReport.Summary.CompletedSalesRevenue);
        Assert.Equal("Delivery", delivReport.FulfillmentFilter);

        // Takeaway only
        var takeResp = await client.GetAsync("/api/management/reports?from=2026-08-18&to=2026-08-18&fulfillment=Takeaway");
        var takeReport = await takeResp.Content.ReadFromJsonAsync<ManagementReportResponse>();
        Assert.NotNull(takeReport);
        Assert.Equal(1, takeReport.Summary.CompletedOrdersCount);
        Assert.Equal(100.00m, takeReport.Summary.CompletedSalesRevenue);
        Assert.Equal("Takeaway", takeReport.FulfillmentFilter);
    }

    private static TimeZoneInfo ResolveCairoTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time"); }
        catch
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo"); }
            catch { return TimeZoneInfo.CreateCustomTimeZone("Egypt Standard Time", TimeSpan.FromHours(2), "Egypt Standard Time", "Egypt Standard Time"); }
        }
    }
}
