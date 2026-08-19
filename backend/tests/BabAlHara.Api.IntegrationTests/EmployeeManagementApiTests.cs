using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using BabAlHara.Application.Employees;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BabAlHara.Api.IntegrationTests;

[Collection("Sequential")]
public class EmployeeManagementApiTests : IClassFixture<OrderingApiFactory>
{
    private readonly OrderingApiFactory _factory;

    public EmployeeManagementApiTests(OrderingApiFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient Client, string CsrfToken, Guid UserId)> CreateAuthenticatedClientAsync(string email, string portal, string role, string displayName)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        Guid userId;
        using (var scope = _factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<BabAlHara.Infrastructure.Identity.StaffUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Microsoft.AspNetCore.Identity.IdentityRole<Guid>>>();

            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new Microsoft.AspNetCore.Identity.IdentityRole<Guid>(role));

            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new BabAlHara.Infrastructure.Identity.StaffUser { UserName = email, Email = email, DisplayName = displayName, IsActive = true };
                await userManager.CreateAsync(user, OrderingApiFactory.DefaultPassword);
            }
            if (!await userManager.IsInRoleAsync(user, role))
                await userManager.AddToRoleAsync(user, role);

            userId = user.Id;
        }

        var csrfResponse = await client.GetAsync("/api/security/csrf");
        csrfResponse.EnsureSuccessStatusCode();
        var csrfResult = await csrfResponse.Content.ReadFromJsonAsync<AntiforgeryResponse>();
        var csrfToken = csrfResult!.RequestToken;

        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", csrfToken);
        var loginResponse = await client.PostAsJsonAsync($"/api/staff/session/{portal}", new { Email = email, Password = OrderingApiFactory.DefaultPassword });
        loginResponse.EnsureSuccessStatusCode();

        return (client, csrfToken, userId);
    }

    private sealed record AntiforgeryResponse(string RequestToken);

    [Fact]
    public async Task GetAllAsAnonymousReturnsUnauthorized()
    {
        await _factory.ResetAsync();
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/management/employees");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAllAsKitchenReturnsForbidden()
    {
        await _factory.ResetAsync();
        var (client, _, _) = await CreateAuthenticatedClientAsync("kitchen_mgmt@test.com", "kitchen", "Kitchen", "Kitchen");
        var response = await client.GetAsync("/api/management/employees");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAllAsManagerReturnsOk()
    {
        await _factory.ResetAsync();
        var (client, _, _) = await CreateAuthenticatedClientAsync("manager_mgmt@test.com", "management", "Manager", "Manager");
        var response = await client.GetAsync("/api/management/employees");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var employees = await response.Content.ReadFromJsonAsync<List<EmployeeManagementDto>>();
        Assert.NotNull(employees);
    }

    [Fact]
    public async Task CreateEmployeeAsManagerCanCreateCashierCannotCreateAdmin()
    {
        await _factory.ResetAsync();
        var (client, _, _) = await CreateAuthenticatedClientAsync("manager_mgmt2@test.com", "management", "Manager", "Manager");

        var req = new CreateEmployeeRequest("New Cashier", $"newcashier_{Guid.NewGuid():N}@test.com", "Cashier", "Password123!@#");
        var response = await client.PostAsJsonAsync("/api/management/employees", req);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var rawResponseJson = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("PasswordHash", rawResponseJson);
        Assert.DoesNotContain("SecurityStamp", rawResponseJson);

        var adminReq = new CreateEmployeeRequest("New Admin", $"newadmin_{Guid.NewGuid():N}@test.com", "Admin", "Password123!@#");
        var adminResponse = await client.PostAsJsonAsync("/api/management/employees", adminReq);
        Assert.Equal(HttpStatusCode.Forbidden, adminResponse.StatusCode);
    }

    [Fact]
    public async Task DisableEmployeeManagerCanDisableKitchenAdminCanDisableManager()
    {
        await _factory.ResetAsync();
        var (managerClient, _, _) = await CreateAuthenticatedClientAsync("manager_mgmt3@test.com", "management", "Manager", "Manager");
        var (adminClient, _, _) = await CreateAuthenticatedClientAsync("admin_mgmt@test.com", "management", "Admin", "Admin");
        var (_, _, kitchenId) = await CreateAuthenticatedClientAsync("kitchen_mgmt3@test.com", "kitchen", "Kitchen", "Kitchen");
        var (_, _, managerId) = await CreateAuthenticatedClientAsync("manager_target@test.com", "management", "Manager", "Manager Target");

        var getResp = await managerClient.GetAsync($"/api/management/employees/{kitchenId}");
        var kitchen = await getResp.Content.ReadFromJsonAsync<EmployeeManagementDto>();

        var patchReq = new SetEmployeeStatusRequest(false, kitchen!.ConcurrencyToken);
        var patchResp = await managerClient.PatchAsJsonAsync($"/api/management/employees/{kitchen.Id}/status", patchReq);
        Assert.Equal(HttpStatusCode.NoContent, patchResp.StatusCode);

        var getManagerResp = await adminClient.GetAsync($"/api/management/employees/{managerId}");
        var manager = await getManagerResp.Content.ReadFromJsonAsync<EmployeeManagementDto>();

        var adminPatchReq = new SetEmployeeStatusRequest(false, manager!.ConcurrencyToken);
        var adminPatchResp = await adminClient.PatchAsJsonAsync($"/api/management/employees/{manager.Id}/status", adminPatchReq);
        Assert.Equal(HttpStatusCode.NoContent, adminPatchResp.StatusCode);
    }

    [Fact]
    public async Task SelfDisableReturnsForbidden()
    {
        await _factory.ResetAsync();
        var (adminClient, _, adminId) = await CreateAuthenticatedClientAsync("admin_self@test.com", "management", "Admin", "Admin Self");

        var getResp = await adminClient.GetAsync($"/api/management/employees/{adminId}");
        var admin = await getResp.Content.ReadFromJsonAsync<EmployeeManagementDto>();

        var patchReq = new SetEmployeeStatusRequest(false, admin!.ConcurrencyToken);
        var patchResp = await adminClient.PatchAsJsonAsync($"/api/management/employees/{adminId}/status", patchReq);
        Assert.Equal(HttpStatusCode.Forbidden, patchResp.StatusCode);
    }

    [Fact]
    public async Task StaleConcurrencyTokenReturnsConflict()
    {
        await _factory.ResetAsync();
        var (adminClient, _, _) = await CreateAuthenticatedClientAsync("admin_concurrency@test.com", "management", "Admin", "Admin Concurrency");
        var (_, _, kitchenId) = await CreateAuthenticatedClientAsync("kitchen_concurrency@test.com", "kitchen", "Kitchen", "Kitchen Concurrency");

        var patchReq = new SetEmployeeStatusRequest(false, "stale-concurrency-token");
        var patchResp = await adminClient.PatchAsJsonAsync($"/api/management/employees/{kitchenId}/status", patchReq);
        Assert.Equal(HttpStatusCode.Conflict, patchResp.StatusCode);
    }

    [Fact]
    public async Task ResetPasswordByManagerForKitchenSucceeds()
    {
        await _factory.ResetAsync();
        var (managerClient, _, _) = await CreateAuthenticatedClientAsync("manager_pwd@test.com", "management", "Manager", "Manager Pwd");
        var (_, _, kitchenId) = await CreateAuthenticatedClientAsync("kitchen_pwd@test.com", "kitchen", "Kitchen", "Kitchen Pwd");

        var getResp = await managerClient.GetAsync($"/api/management/employees/{kitchenId}");
        var kitchen = await getResp.Content.ReadFromJsonAsync<EmployeeManagementDto>();

        var resetReq = new ResetEmployeePasswordRequest("NewSecretPassword123!@#", kitchen!.ConcurrencyToken);
        var resetResp = await managerClient.PostAsJsonAsync($"/api/management/employees/{kitchenId}/reset-password", resetReq);
        Assert.Equal(HttpStatusCode.NoContent, resetResp.StatusCode);
    }
}
