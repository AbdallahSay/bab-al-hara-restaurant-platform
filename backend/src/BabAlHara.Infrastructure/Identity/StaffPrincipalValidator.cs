using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace BabAlHara.Infrastructure.Identity;

public static class StaffPrincipalValidator
{
    // Revalidate every 30 minutes (same as Identity default). In tests, this might be overridden by config.
    public static TimeSpan ValidationInterval { get; set; } = TimeSpan.FromMinutes(30);

    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        var userManager = context.HttpContext.RequestServices
            .GetRequiredService<UserManager<StaffUser>>();

        var principal = context.Principal;
        if (principal is null)
        {
            context.RejectPrincipal();
            return;
        }

        // Check if revalidation interval has elapsed
        var issuedUtc = context.Properties.IssuedUtc;
        var currentUtc = DateTimeOffset.UtcNow;
        if (issuedUtc.HasValue && currentUtc - issuedUtc.Value < ValidationInterval)
        {
            // Within interval — skip DB check this request
            return;
        }

        // Load user from DB
        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            context.RejectPrincipal();
            return;
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            context.RejectPrincipal();
            return;
        }

        // Check IsActive (requires Agent 1's migration to be merged first)
        if (!user.IsActive)
        {
            context.RejectPrincipal();
            return;
        }

        // Verify SecurityStamp
        var claimStamp = principal.FindFirstValue("AspNet.Identity.SecurityStamp");
        if (claimStamp is null || claimStamp != user.SecurityStamp)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(context.Scheme.Name);
            return;
        }

        // Refresh the issued time so 30-min window resets
        context.Properties.IssuedUtc = currentUtc;
        context.ShouldRenew = true;
    }
}
