using System.Security.Claims;
using BabAlHara.Infrastructure.Identity;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace BabAlHara.Api.Platform.Security;

public static class SecurityEndpoints
{
    public static IEndpointRouteBuilder MapSecurityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints
            .MapGet(
                "/api/security/csrf",
                (HttpContext context, IAntiforgery antiforgery) =>
                {
                    var tokens = antiforgery.GetAndStoreTokens(context);
                    return Results.Ok(new AntiforgeryResponse(tokens.RequestToken!));
                })
            .WithName("GetAntiforgeryToken")
            .WithTags("Security")
            .Produces<AntiforgeryResponse>();

        var staff = endpoints.MapGroup("/api/staff/session").WithTags("Staff session");

        //
        // Role-Scoped Portal Session Endpoints
        //
        staff
            .MapGet(
                "/{portal}",
                async (string portal, HttpContext context) =>
                {
                    if (!TryResolvePortal(portal, out var scheme, out _))
                    {
                        return Results.NotFound();
                    }

                    var authResult = await context.AuthenticateAsync(scheme);
                    if (!authResult.Succeeded || authResult.Principal is null)
                    {
                        return Results.Ok(new StaffSessionResponse(false, null, null));
                    }

                    var displayName = authResult.Principal.FindFirstValue("DisplayName")
                        ?? authResult.Principal.FindFirstValue(ClaimTypes.Name)
                        ?? authResult.Principal.Identity?.Name;
                    var role = authResult.Principal.FindFirstValue(ClaimTypes.Role);

                    return Results.Ok(new StaffSessionResponse(true, displayName, role));
                })
            .WithName("GetPortalStaffSession")
            .Produces<StaffSessionResponse>()
            .Produces(StatusCodes.Status404NotFound);

        staff
            .MapPost(
                "/{portal}",
                async (
                    string portal,
                    StaffSignInRequest request,
                    HttpContext context,
                    UserManager<StaffUser> userManager,
                    SignInManager<StaffUser> signInManager) =>
                {
                    if (!TryResolvePortal(portal, out var scheme, out var allowedRoles))
                    {
                        return Results.NotFound();
                    }

                    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    var user = await userManager.FindByEmailAsync(request.Email.Trim());
                    if (user is null || !user.IsActive)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    if (!user.IsActive)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
                    if (!passwordValid)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    var userRoles = await userManager.GetRolesAsync(user);
                    var hasAllowedRole = allowedRoles.Any(r => userRoles.Contains(r, StringComparer.OrdinalIgnoreCase));
                    if (!hasAllowedRole)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    var principal = await signInManager.CreateUserPrincipalAsync(user);
                    if (principal.Identity is ClaimsIdentity claimsIdentity)
                    {
                        if (!principal.HasClaim(c => c.Type == "DisplayName") && !string.IsNullOrWhiteSpace(user.DisplayName))
                        {
                            claimsIdentity.AddClaim(new Claim("DisplayName", user.DisplayName));
                        }

                        var roleClaims = claimsIdentity.FindAll(ClaimTypes.Role).ToList();
                        foreach (var rc in roleClaims)
                        {
                            claimsIdentity.RemoveClaim(rc);
                        }

                        var portalRoles = userRoles.Where(r => allowedRoles.Contains(r, StringComparer.OrdinalIgnoreCase)).ToList();
                        foreach (var r in portalRoles)
                        {
                            claimsIdentity.AddClaim(new Claim(ClaimTypes.Role, r));
                        }
                    }

                    var authProperties = new AuthenticationProperties
                    {
                        IsPersistent = false,
                        AllowRefresh = true,
                        ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8),
                    };

                    await context.SignInAsync(scheme, principal, authProperties);

                    var matchedRole = userRoles.FirstOrDefault(r => allowedRoles.Contains(r, StringComparer.OrdinalIgnoreCase));
                    return Results.Ok(new StaffSessionResponse(true, user.DisplayName, matchedRole));
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireRateLimiting("staff-sign-in")
            .WithName("CreatePortalStaffSession")
            .Produces<StaffSessionResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound);

        staff
            .MapDelete(
                "/{portal}",
                async (string portal, HttpContext context) =>
                {
                    if (!TryResolvePortal(portal, out var scheme, out _))
                    {
                        return Results.NotFound();
                    }

                    await context.SignOutAsync(scheme);
                    return Results.NoContent();
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("DeletePortalStaffSession")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        //
        // Generic Session Endpoints (Backwards-Compatibility)
        //
        staff
            .MapGet(
                "",
                async (HttpContext context) =>
                {
                    if (context.User.Identity?.IsAuthenticated == true)
                    {
                        return Results.Ok(new StaffSessionResponse(
                            true,
                            context.User.FindFirstValue("DisplayName") ?? context.User.Identity.Name,
                            context.User.FindFirstValue(ClaimTypes.Role)));
                    }

                    foreach (var scheme in new[] { StaffAuthSchemes.Kitchen, StaffAuthSchemes.Cashier, StaffAuthSchemes.Driver, StaffAuthSchemes.Management })
                    {
                        var result = await context.AuthenticateAsync(scheme);
                        if (result.Succeeded && result.Principal is not null)
                        {
                            return Results.Ok(new StaffSessionResponse(
                                true,
                                result.Principal.FindFirstValue("DisplayName") ?? result.Principal.FindFirstValue(ClaimTypes.Name) ?? result.Principal.Identity?.Name,
                                result.Principal.FindFirstValue(ClaimTypes.Role)));
                        }
                    }

                    return Results.Ok(new StaffSessionResponse(false, null, null));
                })
            .WithName("GetStaffSession")
            .Produces<StaffSessionResponse>();

        staff
            .MapPost(
                "",
                async (
                    StaffSignInRequest request,
                    UserManager<StaffUser> userManager,
                    SignInManager<StaffUser> signInManager) =>
                {
                    var user = string.IsNullOrWhiteSpace(request.Email)
                        ? null
                        : await userManager.FindByEmailAsync(request.Email.Trim());
                    if (user is null || !user.IsActive)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    if (!user.IsActive)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    var isStaff =
                        await userManager.IsInRoleAsync(user, DevelopmentDataSeeder.KitchenRole) ||
                        await userManager.IsInRoleAsync(user, DevelopmentDataSeeder.ManagerRole) ||
                        await userManager.IsInRoleAsync(user, DevelopmentDataSeeder.AdminRole) ||
                        await userManager.IsInRoleAsync(user, DevelopmentDataSeeder.CashierRole) ||
                        await userManager.IsInRoleAsync(user, DevelopmentDataSeeder.DriverRole);

                    if (!isStaff)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                    }

                    var result = await signInManager.PasswordSignInAsync(
                        user,
                        request.Password ?? string.Empty,
                        isPersistent: false,
                        lockoutOnFailure: true);
                    return result.Succeeded
                        ? Results.Ok(new StaffSessionResponse(true, user.DisplayName))
                        : Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Sign-in failed.",
                            detail: "The email or password is incorrect.");
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireRateLimiting("staff-sign-in")
            .WithName("CreateStaffSession")
            .Produces<StaffSessionResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        staff
            .MapDelete(
                "",
                async (HttpContext context, SignInManager<StaffUser> signInManager) =>
                {
                    await signInManager.SignOutAsync();
                    await context.SignOutAsync(StaffAuthSchemes.Kitchen);
                    await context.SignOutAsync(StaffAuthSchemes.Cashier);
                    await context.SignOutAsync(StaffAuthSchemes.Driver);
                    await context.SignOutAsync(StaffAuthSchemes.Management);
                    return Results.NoContent();
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("DeleteStaffSession")
            .Produces(StatusCodes.Status204NoContent);

        return endpoints;
    }

    private static bool TryResolvePortal(
        string portal,
        out string scheme,
        out string[] allowedRoles)
    {
        switch (portal.Trim().ToLowerInvariant())
        {
            case "kitchen":
                scheme = StaffAuthSchemes.Kitchen;
                allowedRoles = [DevelopmentDataSeeder.KitchenRole, DevelopmentDataSeeder.ManagerRole, DevelopmentDataSeeder.AdminRole];
                return true;
            case "cashier":
                scheme = StaffAuthSchemes.Cashier;
                allowedRoles = [DevelopmentDataSeeder.CashierRole, DevelopmentDataSeeder.ManagerRole, DevelopmentDataSeeder.AdminRole];
                return true;
            case "driver":
                scheme = StaffAuthSchemes.Driver;
                allowedRoles = [DevelopmentDataSeeder.DriverRole, DevelopmentDataSeeder.ManagerRole, DevelopmentDataSeeder.AdminRole];
                return true;
            case "management":
                scheme = StaffAuthSchemes.Management;
                allowedRoles = [DevelopmentDataSeeder.ManagerRole, DevelopmentDataSeeder.AdminRole];
                return true;
            default:
                scheme = string.Empty;
                allowedRoles = [];
                return false;
        }
    }

    private sealed record AntiforgeryResponse(string RequestToken);

    private sealed record StaffSignInRequest(string? Email, string? Password);

    private sealed record StaffSessionResponse(bool IsAuthenticated, string? DisplayName, string? Role = null);
}

