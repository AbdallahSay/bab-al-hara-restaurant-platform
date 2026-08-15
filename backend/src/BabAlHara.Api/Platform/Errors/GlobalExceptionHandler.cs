using Microsoft.AspNetCore.Diagnostics;

namespace BabAlHara.Api.Platform.Errors;

public sealed partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        LogUnhandledException(
            logger,
            httpContext.Request.Method,
            httpContext.Request.Path,
            exception);

        await Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "An unexpected server error occurred.",
                type: "https://httpstatuses.com/500",
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = httpContext.TraceIdentifier,
                })
            .ExecuteAsync(httpContext);

        return true;
    }

    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Error,
        Message = "Unhandled exception while processing {Method} {Path}.")]
    private static partial void LogUnhandledException(
        ILogger logger,
        string method,
        PathString path,
        Exception exception);
}
