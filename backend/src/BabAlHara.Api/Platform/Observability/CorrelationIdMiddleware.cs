using System.Diagnostics;

namespace BabAlHara.Api.Platform.Observability;

public sealed class CorrelationIdMiddleware(
    RequestDelegate next,
    ILogger<CorrelationIdMiddleware> logger)
{
    public const string HeaderName = "X-Correlation-ID";
    private const int MaximumLength = 64;

    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var correlationId = ReadValidCorrelationId(context) ?? CreateCorrelationId();
        context.TraceIdentifier = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using var scope = logger.BeginScope(
            new Dictionary<string, object> { ["CorrelationId"] = correlationId });
        await next(context);
    }

    private static string? ReadValidCorrelationId(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue(HeaderName, out var values))
        {
            return null;
        }

        var candidate = values.ToString();
        return candidate.Length is > 0 and <= MaximumLength && candidate.All(IsAllowedCharacter)
            ? candidate
            : null;
    }

    private static bool IsAllowedCharacter(char character) =>
        char.IsAsciiLetterOrDigit(character) || character is '-' or '_' or '.';

    private static string CreateCorrelationId()
    {
        var traceId = Activity.Current?.TraceId.ToString();
        return string.IsNullOrWhiteSpace(traceId) ? Guid.NewGuid().ToString("N") : traceId;
    }
}
