using BabAlHara.Infrastructure.Identity;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
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
        staff
            .MapGet(
                "",
                (HttpContext context) => Results.Ok(new StaffSessionResponse(
                    context.User.Identity?.IsAuthenticated == true,
                    context.User.Identity?.Name)))
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
                    if (user is null)
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
                async (SignInManager<StaffUser> signInManager) =>
                {
                    await signInManager.SignOutAsync();
                    return Results.NoContent();
                })
            .RequireAuthorization()
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("DeleteStaffSession")
            .Produces(StatusCodes.Status204NoContent);

        return endpoints;
    }

    private sealed record AntiforgeryResponse(string RequestToken);

    private sealed record StaffSignInRequest(string? Email, string? Password);

    private sealed record StaffSessionResponse(bool IsAuthenticated, string? DisplayName);
}
