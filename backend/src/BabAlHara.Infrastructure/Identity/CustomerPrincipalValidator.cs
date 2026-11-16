using System.Security.Claims;
using BabAlHara.Domain.Customers;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BabAlHara.Infrastructure.Identity;

public static class CustomerPrincipalValidator
{
    public static TimeSpan ValidationInterval { get; set; } = TimeSpan.FromMinutes(30);

    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        var principal = context.Principal;
        if (principal is null)
        {
            context.RejectPrincipal();
            return;
        }

        var issuedUtc = context.Properties.IssuedUtc;
        var currentUtc = DateTimeOffset.UtcNow;
        if (issuedUtc.HasValue && currentUtc - issuedUtc.Value < ValidationInterval)
        {
            return;
        }

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            context.RejectPrincipal();
            return;
        }

        var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var user = await dbContext.CustomerUsers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == userGuid);
        if (user is null || !user.IsActive)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(context.Scheme.Name);
            return;
        }

        var claimStamp = principal.FindFirstValue("SecurityStamp");
        if (claimStamp is null || claimStamp != user.SecurityStamp)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(context.Scheme.Name);
            return;
        }

        context.Properties.IssuedUtc = currentUtc;
        context.ShouldRenew = true;
    }
}
