using System.Globalization;
using BabAlHara.Application.Reporting;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BabAlHara.Infrastructure.Reporting;

public sealed class ReportingService(
    AppDbContext dbContext,
    TimeProvider timeProvider) : IReportingService
{
    private const int MaxQueryRangeDays = 90;
    private static readonly TimeZoneInfo CairoTimeZone = ResolveCairoTimeZone();

    public async Task<ManagementReportResponse> GetReportAsync(
        ReportQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        if (!DateOnly.TryParseExact(query.FromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fromDateOnly))
        {
            throw new ArgumentException("Invalid from date format. Expected yyyy-MM-dd.", nameof(query));
        }

        if (!DateOnly.TryParseExact(query.ToDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var toDateOnly))
        {
            throw new ArgumentException("Invalid to date format. Expected yyyy-MM-dd.", nameof(query));
        }

        if (fromDateOnly > toDateOnly)
        {
            throw new ArgumentException("From date cannot be after to date.", nameof(query));
        }

        if ((toDateOnly.DayNumber - fromDateOnly.DayNumber) > MaxQueryRangeDays)
        {
            throw new ArgumentException($"Date range cannot exceed {MaxQueryRangeDays} days.", nameof(query));
        }

        OrderType? fulfillmentFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Fulfillment) && !string.Equals(query.Fulfillment, "All", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<OrderType>(query.Fulfillment, ignoreCase: true, out var parsedType))
            {
                fulfillmentFilter = parsedType;
            }
        }

        // Convert local Cairo start-of-day and end-of-day to UTC DateTimeOffset boundaries
        var fromLocal = fromDateOnly.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var fromUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(fromLocal, CairoTimeZone), TimeSpan.Zero);

        var toLocalNextDay = toDateOnly.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var toUtc = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(toLocalNextDay, CairoTimeZone), TimeSpan.Zero);

        var baseOrdersQuery = dbContext.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= fromUtc && o.CreatedAt < toUtc);

        if (fulfillmentFilter.HasValue)
        {
            baseOrdersQuery = baseOrdersQuery.Where(o => o.OrderType == fulfillmentFilter.Value);
        }

        // 1. Placed orders timestamps
        var allCreatedTimestamps = await baseOrdersQuery
            .Select(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        var totalOrdersPlaced = allCreatedTimestamps.Count;

        // 2. Delivered orders (authoritative sales revenue source of truth)
        var deliveredOrdersQuery = baseOrdersQuery.Where(o => o.Status == OrderStatus.Delivered);

        var deliveredOrders = await deliveredOrdersQuery
            .Select(o => new
            {
                o.Id,
                o.CreatedAt,
                o.OrderType,
                o.Total,
                o.DeliveryFee
            })
            .ToListAsync(cancellationToken);

        var completedOrdersCount = deliveredOrders.Count;
        var completedSalesRevenue = deliveredOrders.Sum(o => o.Total);
        var averageOrderValue = completedOrdersCount > 0
            ? Math.Round(completedSalesRevenue / completedOrdersCount, 2)
            : 0m;

        var summary = new ReportSummaryDto(
            completedSalesRevenue,
            completedOrdersCount,
            averageOrderValue,
            totalOrdersPlaced);

        // 3. Daily trends across the full requested range
        var totalByDay = allCreatedTimestamps
            .GroupBy(t => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(t, CairoTimeZone).DateTime))
            .ToDictionary(g => g.Key, g => g.Count());

        var deliveredByDay = deliveredOrders
            .GroupBy(o => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(o.CreatedAt, CairoTimeZone).DateTime))
            .ToDictionary(g => g.Key, g => new { Revenue = g.Sum(x => x.Total), Count = g.Count() });

        var dailyTrends = new List<DailySalesTrendDto>();
        for (var current = fromDateOnly; current <= toDateOnly; current = current.AddDays(1))
        {
            var dateStr = current.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var dayRevenue = deliveredByDay.TryGetValue(current, out var dVal) ? dVal.Revenue : 0m;
            var dayCompletedCount = deliveredByDay.TryGetValue(current, out var cVal) ? cVal.Count : 0;
            var dayTotalCount = totalByDay.TryGetValue(current, out var tVal) ? tVal : 0;

            dailyTrends.Add(new DailySalesTrendDto(dateStr, dayRevenue, dayCompletedCount, dayTotalCount));
        }

        // 4. Fulfillment Breakdown (Delivered orders)
        var deliveryOrders = deliveredOrders.Where(o => o.OrderType == OrderType.Delivery).ToList();
        var takeawayOrders = deliveredOrders.Where(o => o.OrderType == OrderType.Takeaway).ToList();

        var deliveryCount = deliveryOrders.Count;
        var deliveryRevenue = deliveryOrders.Sum(o => o.Total);
        var deliveryFees = deliveryOrders.Sum(o => o.DeliveryFee);
        var deliveryPct = completedOrdersCount > 0 ? (int)Math.Round((double)deliveryCount / completedOrdersCount * 100.0) : 0;

        var takeawayCount = takeawayOrders.Count;
        var takeawayRevenue = takeawayOrders.Sum(o => o.Total);
        var takeawayFees = 0m;
        var takeawayPct = completedOrdersCount > 0 ? (int)Math.Round((double)takeawayCount / completedOrdersCount * 100.0) : 0;

        var fulfillmentBreakdown = new FulfillmentBreakdownDto(
            new FulfillmentChannelMetricsDto("Delivery", deliveryCount, deliveryRevenue, deliveryFees, deliveryPct),
            new FulfillmentChannelMetricsDto("Takeaway", takeawayCount, takeawayRevenue, takeawayFees, takeawayPct));

        // 5. Best-Selling Items (Delivered orders only, using historical snapshot names and totals)
        var bestSellersQuery = dbContext.OrderItems
            .AsNoTracking()
            .Where(item => item.Order.Status == OrderStatus.Delivered
                        && item.Order.CreatedAt >= fromUtc
                        && item.Order.CreatedAt < toUtc);

        if (fulfillmentFilter.HasValue)
        {
            bestSellersQuery = bestSellersQuery.Where(item => item.Order.OrderType == fulfillmentFilter.Value);
        }

        var bestSellersRaw = await bestSellersQuery
            .GroupBy(item => new { item.MenuItemId, item.ProductNameAr, item.ProductNameEn })
            .Select(g => new
            {
                g.Key.MenuItemId,
                g.Key.ProductNameAr,
                g.Key.ProductNameEn,
                QuantitySold = g.Sum(x => x.Quantity),
                RevenueContribution = g.Sum(x => x.LineTotal)
            })
            .OrderByDescending(x => x.QuantitySold)
            .ThenByDescending(x => x.RevenueContribution)
            .Take(15)
            .ToListAsync(cancellationToken);

        var bestSellingItems = bestSellersRaw
            .Select((item, index) => new BestSellingItemDto(
                index + 1,
                item.MenuItemId,
                item.ProductNameAr,
                item.ProductNameEn,
                item.QuantitySold,
                item.RevenueContribution))
            .ToList();

        // 6. Factual Operational Timing (from OrderStatusHistories for completed orders)
        var historiesQuery = dbContext.OrderStatusHistories
            .AsNoTracking()
            .Where(h => h.Order != null
                     && h.Order.Status == OrderStatus.Delivered
                     && h.Order.CreatedAt >= fromUtc
                     && h.Order.CreatedAt < toUtc);

        if (fulfillmentFilter.HasValue)
        {
            historiesQuery = historiesQuery.Where(h => h.Order!.OrderType == fulfillmentFilter.Value);
        }

        var histories = await historiesQuery
            .Select(h => new
            {
                h.OrderId,
                h.Order!.CreatedAt,
                h.Order.OrderType,
                h.PreviousStatus,
                h.NewStatus,
                h.ChangedAtUtc
            })
            .ToListAsync(cancellationToken);

        var prepDurations = new List<double>();
        var transitDurations = new List<double>();
        var totalDurations = new List<double>();

        var groupedHistories = histories.GroupBy(h => h.OrderId);
        foreach (var group in groupedHistories)
        {
            var orderEvents = group.OrderBy(h => h.ChangedAtUtc).ToList();
            var createdAt = orderEvents[0].CreatedAt;
            var orderType = orderEvents[0].OrderType;

            var readyEvent = orderEvents.FirstOrDefault(e => e.NewStatus == OrderStatus.Ready);
            if (readyEvent != null)
            {
                var prepMin = (readyEvent.ChangedAtUtc - createdAt).TotalMinutes;
                if (prepMin >= 0) prepDurations.Add(prepMin);
            }

            var deliveredEvent = orderEvents.LastOrDefault(e => e.NewStatus == OrderStatus.Delivered);
            if (deliveredEvent != null)
            {
                var totalMin = (deliveredEvent.ChangedAtUtc - createdAt).TotalMinutes;
                if (totalMin >= 0) totalDurations.Add(totalMin);

                if (orderType == OrderType.Delivery)
                {
                    var onTheWayEvent = orderEvents.FirstOrDefault(e => e.NewStatus == OrderStatus.OnTheWay);
                    if (onTheWayEvent != null)
                    {
                        var transitMin = (deliveredEvent.ChangedAtUtc - onTheWayEvent.ChangedAtUtc).TotalMinutes;
                        if (transitMin >= 0) transitDurations.Add(transitMin);
                    }
                }
            }
        }

        decimal? avgPrep = prepDurations.Count > 0 ? Math.Round((decimal)prepDurations.Average(), 1) : null;
        decimal? avgTransit = transitDurations.Count > 0 ? Math.Round((decimal)transitDurations.Average(), 1) : null;
        decimal? avgTotal = totalDurations.Count > 0 ? Math.Round((decimal)totalDurations.Average(), 1) : null;

        var operationalTiming = new OperationalTimingDto(
            avgPrep,
            avgTransit,
            avgTotal,
            totalDurations.Count > 0);

        // 7. Hourly Distribution (Peak ordering hours 0..23 in Cairo local time)
        var hourlyBuckets = new int[24];
        foreach (var createdAt in allCreatedTimestamps)
        {
            var localTime = TimeZoneInfo.ConvertTime(createdAt, CairoTimeZone);
            hourlyBuckets[localTime.Hour]++;
        }

        var hourlyDistribution = Enumerable.Range(0, 24)
            .Select(hour => new HourlyDistributionDto(hour, hourlyBuckets[hour]))
            .ToList();

        var fulfillmentFilterStr = fulfillmentFilter.HasValue ? fulfillmentFilter.Value.ToString() : "All";
        var generatedAtUtc = timeProvider.GetUtcNow();

        return new ManagementReportResponse(
            query.FromDate,
            query.ToDate,
            fulfillmentFilterStr,
            generatedAtUtc,
            summary,
            dailyTrends,
            fulfillmentBreakdown,
            bestSellingItems,
            operationalTiming,
            hourlyDistribution);
    }

    private static TimeZoneInfo ResolveCairoTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
        }
        catch
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo");
            }
            catch
            {
                return TimeZoneInfo.CreateCustomTimeZone("Egypt Standard Time", TimeSpan.FromHours(2), "Egypt Standard Time", "Egypt Standard Time");
            }
        }
    }
}
