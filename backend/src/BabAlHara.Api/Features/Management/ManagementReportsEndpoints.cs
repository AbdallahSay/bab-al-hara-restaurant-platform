using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Reporting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BabAlHara.Api.Features.Management;

public static class ManagementReportsEndpoints
{
    public static IEndpointRouteBuilder MapManagementReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/management/reports")
            .RequireAuthorization(AuthorizationPolicies.Management);

        group.MapGet("", async (
            string from,
            string to,
            string? fulfillment,
            IReportingService service,
            HttpContext context) =>
        {
            if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to))
            {
                return Results.BadRequest(new { message = "Parameters 'from' and 'to' (yyyy-MM-dd) are required." });
            }

            try
            {
                var query = new ReportQuery(from.Trim(), to.Trim(), fulfillment?.Trim());
                var report = await service.GetReportAsync(query, context.RequestAborted);
                return Results.Ok(report);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        return app;
    }
}
