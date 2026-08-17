using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Delivery;
using BabAlHara.Domain.Ordering;
using Xunit;

namespace BabAlHara.Api.IntegrationTests;

public sealed class StaffSessionIsolationTests(OrderingApiFactory factory)
    : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task DirectApiMatrixEnforcesRoleIsolationAcrossPortals()
    {
        await factory.ResetAsync();

        // 1. Anonymous -> 401 Unauthorized
        var anonymousClient = factory.CreateClient();
        var anonKitchen = await anonymousClient.GetAsync("/api/kitchen/orders/active");
        var anonCashier = await anonymousClient.GetAsync("/api/cashier/drivers");
        var anonDriver = await anonymousClient.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.Unauthorized, anonKitchen.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonCashier.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonDriver.StatusCode);

        // 2. Kitchen user with ONLY Kitchen cookie
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "chef.matrix@bab-al-hara.local",
            "Kitchen",
            "Chef Matrix",
            "kitchen");

        var kitchenOnKitchen = await kitchenClient.GetAsync("/api/kitchen/orders/active");
        var kitchenOnCashier = await kitchenClient.GetAsync("/api/cashier/drivers");
        var kitchenOnDriver = await kitchenClient.GetAsync("/api/driver/orders/assigned");

        Assert.Equal(HttpStatusCode.OK, kitchenOnKitchen.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, kitchenOnCashier.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, kitchenOnDriver.StatusCode);

        // 3. Cashier user with ONLY Cashier cookie
        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier.matrix@bab-al-hara.local",
            "Cashier",
            "Cashier Matrix",
            "cashier");

        var cashierOnKitchen = await cashierClient.GetAsync("/api/kitchen/orders/active");
        var cashierOnCashier = await cashierClient.GetAsync("/api/cashier/drivers");
        var cashierOnDriver = await cashierClient.GetAsync("/api/driver/orders/assigned");

        Assert.Equal(HttpStatusCode.Forbidden, cashierOnKitchen.StatusCode);
        Assert.Equal(HttpStatusCode.OK, cashierOnCashier.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, cashierOnDriver.StatusCode);

        // 4. Driver user with ONLY Driver cookie
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver.matrix@bab-al-hara.local",
            "Driver",
            "Driver Matrix",
            "driver");

        var driverOnKitchen = await driverClient.GetAsync("/api/kitchen/orders/active");
        var driverOnCashier = await driverClient.GetAsync("/api/cashier/drivers");
        var driverOnDriver = await driverClient.GetAsync("/api/driver/orders/assigned");

        Assert.Equal(HttpStatusCode.Forbidden, driverOnKitchen.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, driverOnCashier.StatusCode);
        Assert.Equal(HttpStatusCode.OK, driverOnDriver.StatusCode);
    }

    [Fact]
    public async Task MultiCookieCoexistenceAndLogoutIsolation()
    {
        await factory.ResetAsync();

        var multiRoleEmail = "multirole.staff@bab-al-hara.local";
        var staffUser = await factory.EnsureStaffUserAsync(multiRoleEmail, "Kitchen", "Multi Staff");
        await factory.EnsureStaffUserAsync(multiRoleEmail, "Cashier", "Multi Staff");
        await factory.EnsureStaffUserAsync(multiRoleEmail, "Driver", "Multi Staff");

        var client = factory.CreateClient();
        var csrfResponse = await client.GetFromJsonAsync<AntiforgeryTokenDto>("/api/security/csrf");
        var csrfToken = csrfResponse!.RequestToken;
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", csrfToken);

        // 1. Sign in to Kitchen
        var kitchenSignIn = await client.PostAsJsonAsync("/api/staff/session/kitchen", new
        {
            email = multiRoleEmail,
            password = OrderingApiFactory.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.OK, kitchenSignIn.StatusCode);

        // 2. Sign in to Cashier
        var cashierSignIn = await client.PostAsJsonAsync("/api/staff/session/cashier", new
        {
            email = multiRoleEmail,
            password = OrderingApiFactory.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.OK, cashierSignIn.StatusCode);

        // 3. Sign in to Driver
        var driverSignIn = await client.PostAsJsonAsync("/api/staff/session/driver", new
        {
            email = multiRoleEmail,
            password = OrderingApiFactory.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.OK, driverSignIn.StatusCode);

        // Verify all 3 sessions are authenticated via GET /api/staff/session/{portal}
        var kitchenSessionResp = await client.GetFromJsonAsync<StaffSessionResponse>("/api/staff/session/kitchen", JsonOptions);
        var cashierSessionResp = await client.GetFromJsonAsync<StaffSessionResponse>("/api/staff/session/cashier", JsonOptions);
        var driverSessionResp = await client.GetFromJsonAsync<StaffSessionResponse>("/api/staff/session/driver", JsonOptions);

        Assert.NotNull(kitchenSessionResp);
        Assert.True(kitchenSessionResp.IsAuthenticated);
        Assert.Equal("Multi Staff", kitchenSessionResp.DisplayName);

        Assert.NotNull(cashierSessionResp);
        Assert.True(cashierSessionResp.IsAuthenticated);
        Assert.Equal("Multi Staff", cashierSessionResp.DisplayName);

        Assert.NotNull(driverSessionResp);
        Assert.True(driverSessionResp.IsAuthenticated);
        Assert.Equal("Multi Staff", driverSessionResp.DisplayName);

        // Verify all 3 APIs succeed
        var kitchenApiResp = await client.GetAsync("/api/kitchen/orders/active");
        var cashierApiResp = await client.GetAsync("/api/cashier/drivers");
        var driverApiResp = await client.GetAsync("/api/driver/orders/assigned");

        Assert.Equal(HttpStatusCode.OK, kitchenApiResp.StatusCode);
        Assert.Equal(HttpStatusCode.OK, cashierApiResp.StatusCode);
        Assert.Equal(HttpStatusCode.OK, driverApiResp.StatusCode);

        // 4. Logout Driver portal ONLY
        var logoutDriverResp = await client.DeleteAsync("/api/staff/session/driver");
        Assert.Equal(HttpStatusCode.NoContent, logoutDriverResp.StatusCode);

        // Verify driver session is now unauthenticated
        var driverSessionAfter = await client.GetFromJsonAsync<StaffSessionResponse>("/api/staff/session/driver", JsonOptions);
        Assert.NotNull(driverSessionAfter);
        Assert.False(driverSessionAfter.IsAuthenticated);

        // Kitchen and Cashier sessions REMAIN authenticated!
        var kitchenSessionAfter = await client.GetFromJsonAsync<StaffSessionResponse>("/api/staff/session/kitchen", JsonOptions);
        var cashierSessionAfter = await client.GetFromJsonAsync<StaffSessionResponse>("/api/staff/session/cashier", JsonOptions);
        Assert.NotNull(kitchenSessionAfter);
        Assert.True(kitchenSessionAfter.IsAuthenticated);
        Assert.NotNull(cashierSessionAfter);
        Assert.True(cashierSessionAfter.IsAuthenticated);

        // Kitchen and Cashier APIs still succeed
        var kitchenApiAfter = await client.GetAsync("/api/kitchen/orders/active");
        var cashierApiAfter = await client.GetAsync("/api/cashier/drivers");
        Assert.Equal(HttpStatusCode.OK, kitchenApiAfter.StatusCode);
        Assert.Equal(HttpStatusCode.OK, cashierApiAfter.StatusCode);

        // Driver API is now forbidden (remaining cookies are Kitchen and Cashier, which lack Driver role)
        var driverApiAfter = await client.GetAsync("/api/driver/orders/assigned");
        Assert.Equal(HttpStatusCode.Forbidden, driverApiAfter.StatusCode);
    }

    [Fact]
    public async Task CannotSignInToPortalWithoutRequiredRole()
    {
        await factory.ResetAsync();

        var driverOnlyEmail = "driver.exclusive@bab-al-hara.local";
        await factory.EnsureStaffUserAsync(driverOnlyEmail, "Driver", "Exclusive Driver");

        var client = factory.CreateClient();
        var csrfResponse = await client.GetFromJsonAsync<AntiforgeryTokenDto>("/api/security/csrf");
        var csrfToken = csrfResponse!.RequestToken;
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", csrfToken);

        // Attempt to sign in to kitchen portal with a driver-only user -> 401 Unauthorized
        var kitchenAttempt = await client.PostAsJsonAsync("/api/staff/session/kitchen", new
        {
            email = driverOnlyEmail,
            password = OrderingApiFactory.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.Unauthorized, kitchenAttempt.StatusCode);

        // Attempt to sign in to cashier portal with a driver-only user -> 401 Unauthorized
        var cashierAttempt = await client.PostAsJsonAsync("/api/staff/session/cashier", new
        {
            email = driverOnlyEmail,
            password = OrderingApiFactory.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.Unauthorized, cashierAttempt.StatusCode);

        // Sign in to driver portal -> 200 OK
        var driverAttempt = await client.PostAsJsonAsync("/api/staff/session/driver", new
        {
            email = driverOnlyEmail,
            password = OrderingApiFactory.DefaultPassword,
        });
        Assert.Equal(HttpStatusCode.OK, driverAttempt.StatusCode);
    }

    private sealed record AntiforgeryTokenDto(string RequestToken);
    private sealed record StaffSessionResponse(bool IsAuthenticated, string? DisplayName, string? Role);
}
