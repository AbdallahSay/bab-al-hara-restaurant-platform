using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BabAlHara.Api.Platform.Health;

public static class HealthResponseWriter
{
    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(report);

        context.Response.ContentType = "application/json; charset=utf-8";

        var payload = new
        {
            status = report.Status.ToString(),
            durationMilliseconds = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries
                .OrderBy(entry => entry.Key, StringComparer.Ordinal)
                .Select(entry => new
                {
                    name = entry.Key,
                    status = entry.Value.Status.ToString(),
                    durationMilliseconds = entry.Value.Duration.TotalMilliseconds,
                }),
        };

        return context.Response.WriteAsJsonAsync(payload, context.RequestAborted);
    }
}
