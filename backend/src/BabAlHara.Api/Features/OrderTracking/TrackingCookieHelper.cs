namespace BabAlHara.Api.Features.OrderTracking;

public static class TrackingCookieHelper
{
    public const string CookiePrefixProd = "__Host-BabAlHara-Tracking-";
    public const string CookiePrefixDev = "BabAlHara-Tracking-";
    public static readonly TimeSpan TrackingLifetime = TimeSpan.FromDays(7);

    public static string GetCookieName(string publicCode, bool isDevelopment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(publicCode);
        var prefix = isDevelopment ? CookiePrefixDev : CookiePrefixProd;
        return $"{prefix}{publicCode.Trim()}";
    }

    public static void AppendTrackingCookie(
        HttpResponse response,
        string publicCode,
        string rawToken,
        DateTimeOffset expiresAtUtc,
        bool isDevelopment,
        bool isHttps)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentException.ThrowIfNullOrWhiteSpace(publicCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(rawToken);

        var cookieName = GetCookieName(publicCode, isDevelopment);
        var options = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = !isDevelopment || isHttps,
            Path = "/",
            Expires = expiresAtUtc,
            MaxAge = expiresAtUtc > DateTimeOffset.UtcNow ? expiresAtUtc - DateTimeOffset.UtcNow : TimeSpan.Zero,
            IsEssential = true
        };

        response.Cookies.Append(cookieName, rawToken, options);
    }

    public static string? GetTrackingTokenFromCookie(
        HttpRequest request,
        string publicCode,
        bool isDevelopment)
    {
        if (request is null || string.IsNullOrWhiteSpace(publicCode))
        {
            return null;
        }

        var cookieName = GetCookieName(publicCode, isDevelopment);
        if (request.Cookies.TryGetValue(cookieName, out var token) && !string.IsNullOrWhiteSpace(token))
        {
            return token.Trim();
        }

        // Support alternate prefix fallback across dev/test environments
        var alternatePrefix = isDevelopment ? CookiePrefixProd : CookiePrefixDev;
        var altCookieName = $"{alternatePrefix}{publicCode.Trim()}";
        if (request.Cookies.TryGetValue(altCookieName, out var altToken) && !string.IsNullOrWhiteSpace(altToken))
        {
            return altToken.Trim();
        }

        return null;
    }
}
