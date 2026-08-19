using System.Net;
using System.Net.Http.Json;
using BabAlHara.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BabAlHara.Api.IntegrationTests;

public sealed class SessionRevocationTests : IClassFixture<OrderingApiFactory>
{
    private readonly OrderingApiFactory _factory;

    public SessionRevocationTests(OrderingApiFactory factory)
    {
        _factory = factory;
        // Force immediate validation in tests
        StaffPrincipalValidator.ValidationInterval = TimeSpan.Zero;
    }

    [Fact]
    public async Task DisableInvalidatesSession()
    {
        await _factory.ResetAsync();

        var email = "kitchen.revoked@bab-al-hara.local";
        var client = await _factory.CreateAuthenticatedStaffClientAsync(email, "Kitchen", "Kitchen Revoked", "kitchen");

        var response1 = await client.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);

        // Disable employee
        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<StaffUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);

        user.IsActive = false;
        await userManager.UpdateAsync(user);
        await userManager.UpdateSecurityStampAsync(user);

        var response2 = await client.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.Unauthorized, response2.StatusCode);
    }

    [Fact]
    public async Task RoleChangeInvalidatesDriverSession()
    {
        await _factory.ResetAsync();

        var email = "driver.rolechange@bab-al-hara.local";
        var client = await _factory.CreateAuthenticatedStaffClientAsync(email, "Driver", "Driver RoleChange", "driver");

        var response1 = await client.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<StaffUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);

        await userManager.RemoveFromRoleAsync(user, "Driver");
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        if (!await roleManager.RoleExistsAsync("Cashier"))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid> { Name = "Cashier" });
        }
        await userManager.AddToRoleAsync(user, "Cashier");
        await userManager.UpdateSecurityStampAsync(user);

        var response2 = await client.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.Unauthorized, response2.StatusCode);
    }

    [Fact]
    public async Task PasswordResetInvalidatesSession()
    {
        await _factory.ResetAsync();

        var email = "cashier.pwdreset@bab-al-hara.local";
        var client = await _factory.CreateAuthenticatedStaffClientAsync(email, "Cashier", "Cashier Reset", "cashier");

        var response1 = await client.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<StaffUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        await userManager.ResetPasswordAsync(user, token, "NewP@ssw0rd123!");

        var response2 = await client.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.Unauthorized, response2.StatusCode);
    }

    [Fact]
    public async Task RegressionOtherEmployeesUnaffected()
    {
        await _factory.ResetAsync();

        var emailA = "kitchen.a@bab-al-hara.local";
        var clientA = await _factory.CreateAuthenticatedStaffClientAsync(emailA, "Kitchen", "Kitchen A", "kitchen");

        var emailB = "kitchen.b@bab-al-hara.local";
        var clientB = await _factory.CreateAuthenticatedStaffClientAsync(emailB, "Kitchen", "Kitchen B", "kitchen");

        // Disable Kitchen A
        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<StaffUser>>();
        var userA = await userManager.FindByEmailAsync(emailA);
        Assert.NotNull(userA);
        userA.IsActive = false;
        await userManager.UpdateAsync(userA);
        await userManager.UpdateSecurityStampAsync(userA);

        var responseA = await clientA.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.Unauthorized, responseA.StatusCode);

        var responseB = await clientB.GetAsync("/api/kitchen/orders/active");
        Assert.Equal(HttpStatusCode.OK, responseB.StatusCode);
    }

    [Fact]
    public async Task DisabledUserCannotSignIn()
    {
        await _factory.ResetAsync();

        var email = "disabled.signin@bab-al-hara.local";
        await _factory.EnsureStaffUserAsync(email, "Kitchen", "Disabled User");

        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<StaffUser>>();
        var user = await userManager.FindByEmailAsync(email);
        Assert.NotNull(user);
        user.IsActive = false;
        await userManager.UpdateAsync(user);

        var client = _factory.CreateClient();
        var csrfResponse = await client.GetFromJsonAsync<AntiforgeryTokenDto>("/api/security/csrf");
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", csrfResponse!.RequestToken);

        var response = await client.PostAsJsonAsync("/api/staff/session/kitchen", new
        {
            email = email,
            password = OrderingApiFactory.DefaultPassword
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private sealed record AntiforgeryTokenDto(string RequestToken);
}
