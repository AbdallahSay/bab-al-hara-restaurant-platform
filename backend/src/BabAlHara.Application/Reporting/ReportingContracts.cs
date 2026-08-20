namespace BabAlHara.Application.Reporting;

public sealed record ReportSummaryDto(
    decimal CompletedSalesRevenue,
    int CompletedOrdersCount,
    decimal AverageOrderValue,
    int TotalOrdersPlaced);

public sealed record DailySalesTrendDto(
    string Date,
    decimal Revenue,
    int CompletedOrdersCount,
    int TotalOrdersCount);

public sealed record FulfillmentChannelMetricsDto(
    string OrderType,
    int Count,
    decimal Revenue,
    decimal DeliveryFees,
    decimal PercentageOfTotal);

public sealed record FulfillmentBreakdownDto(
    FulfillmentChannelMetricsDto Delivery,
    FulfillmentChannelMetricsDto Takeaway);

public sealed record BestSellingItemDto(
    int Rank,
    Guid MenuItemId,
    string NameAr,
    string NameEn,
    int QuantitySold,
    decimal RevenueContribution);

public sealed record OperationalTimingDto(
    decimal? AveragePrepTimeMinutes,
    decimal? AverageDeliveryTransitTimeMinutes,
    decimal? AverageTotalFulfillmentTimeMinutes,
    bool HasSufficientData);

public sealed record HourlyDistributionDto(
    int Hour,
    int Count);

public sealed record ManagementReportResponse(
    string FromDate,
    string ToDate,
    string FulfillmentFilter,
    DateTimeOffset GeneratedAtUtc,
    ReportSummaryDto Summary,
    IReadOnlyList<DailySalesTrendDto> DailyTrends,
    FulfillmentBreakdownDto FulfillmentBreakdown,
    IReadOnlyList<BestSellingItemDto> BestSellingItems,
    OperationalTimingDto OperationalTiming,
    IReadOnlyList<HourlyDistributionDto> HourlyDistribution);

public sealed record ReportQuery(
    string FromDate,
    string ToDate,
    string? Fulfillment = null);

public interface IReportingService
{
    Task<ManagementReportResponse> GetReportAsync(
        ReportQuery query,
        CancellationToken cancellationToken = default);
}
