using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BabAlHara.Api.Features.Customer;
using BabAlHara.Domain.Customers;
using BabAlHara.Domain.Ordering;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.IntegrationTests;

[Collection("Sequential")]
public sealed class CustomerAuthApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>, IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Task InitializeAsync() => factory.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private static async Task<string> GetCsrfTokenAsync(HttpClient client)
    {
        using var tokenResponse = await client.GetAsync("/api/security/csrf");
        tokenResponse.EnsureSuccessStatusCode();
        using var tokenDocument = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
        return tokenDocument.RootElement.GetProperty("requestToken").GetString()!;
    }

    [Fact]
    public async Task SessionReturnsUnauthenticatedWhenNoCookiePresent()
    {
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/customer/auth/session");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<CustomerSessionResponse>(JsonOptions);
        Assert.NotNull(session);
        Assert.False(session.IsAuthenticated);
        Assert.Null(session.FullName);
    }

    [Fact]
    public async Task RegisterWithValidEmailCreatesAccountAndSetsCookie()
    {
        using var client = factory.CreateClient();
        var csrf = await GetCsrfTokenAsync(client);

        var request = new RegisterCustomerRequest("أحمد محمد", "ahmed@example.com", "Password123!");
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(request),
        };
        message.Headers.Add("X-XSRF-TOKEN", csrf);

        var response = await client.SendAsync(message);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var session = await response.Content.ReadFromJsonAsync<CustomerSessionResponse>(JsonOptions);
        Assert.NotNull(session);
        Assert.True(session.IsAuthenticated);
        Assert.Equal("أحمد محمد", session.FullName);
        Assert.Equal("ahmed@example.com", session.Email);

        // Subsequent session call with client cookies should be authenticated
        var sessionResponse = await client.GetAsync("/api/customer/auth/session");
        var activeSession = await sessionResponse.Content.ReadFromJsonAsync<CustomerSessionResponse>(JsonOptions);
        Assert.NotNull(activeSession);
        Assert.True(activeSession.IsAuthenticated);
        Assert.Equal("أحمد محمد", activeSession.FullName);
    }

    [Fact]
    public async Task RegisterWithDuplicateEmailReturns409Conflict()
    {
        using var client = factory.CreateClient();
        var csrf = await GetCsrfTokenAsync(client);

        var request = new RegisterCustomerRequest("أحمد محمد", "duplicate@example.com", "Password123!");
        using var msg1 = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(request),
        };
        msg1.Headers.Add("X-XSRF-TOKEN", csrf);
        var res1 = await client.SendAsync(msg1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Second registration with same email
        using var client2 = factory.CreateClient();
        var csrf2 = await GetCsrfTokenAsync(client2);
        using var msg2 = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(request),
        };
        msg2.Headers.Add("X-XSRF-TOKEN", csrf2);
        var res2 = await client2.SendAsync(msg2);

        Assert.Equal(HttpStatusCode.Conflict, res2.StatusCode);
    }

    [Fact]
    public async Task SignInWithValidCredentialsAuthenticatesSession()
    {
        using var client = factory.CreateClient();
        var csrf = await GetCsrfTokenAsync(client);

        // 1. Register
        var reg = new RegisterCustomerRequest("سارة أحمد", "sara@example.com", "SecurePass123!");
        using var regMsg = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(reg),
        };
        regMsg.Headers.Add("X-XSRF-TOKEN", csrf);
        await client.SendAsync(regMsg);

        // 2. Sign in from a fresh client
        using var client2 = factory.CreateClient();
        var csrf2 = await GetCsrfTokenAsync(client2);

        var signIn = new CustomerSignInRequest("sara@example.com", "SecurePass123!", RememberMe: true);
        using var signInMsg = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/sign-in")
        {
            Content = JsonContent.Create(signIn),
        };
        signInMsg.Headers.Add("X-XSRF-TOKEN", csrf2);
        var signInRes = await client2.SendAsync(signInMsg);

        Assert.Equal(HttpStatusCode.OK, signInRes.StatusCode);
        var session = await signInRes.Content.ReadFromJsonAsync<CustomerSessionResponse>(JsonOptions);
        Assert.NotNull(session);
        Assert.True(session.IsAuthenticated);
        Assert.Equal("سارة أحمد", session.FullName);

        // 3. Sign out
        using var signOutMsg = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/sign-out");
        signOutMsg.Headers.Add("X-XSRF-TOKEN", csrf2);
        var signOutRes = await client2.SendAsync(signOutMsg);
        Assert.Equal(HttpStatusCode.NoContent, signOutRes.StatusCode);

        // Verify session is now unauthenticated
        var check = await client2.GetAsync("/api/customer/auth/session");
        var afterSignOut = await check.Content.ReadFromJsonAsync<CustomerSessionResponse>(JsonOptions);
        Assert.NotNull(afterSignOut);
        Assert.False(afterSignOut.IsAuthenticated);
    }

    [Fact]
    public async Task SignInWithInvalidPasswordReturns401Unauthorized()
    {
        using var client = factory.CreateClient();
        var csrf = await GetCsrfTokenAsync(client);

        var reg = new RegisterCustomerRequest("محمود علي", "mahmoud@example.com", "CorrectPass123!");
        using var regMsg = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(reg),
        };
        regMsg.Headers.Add("X-XSRF-TOKEN", csrf);
        await client.SendAsync(regMsg);

        using var client2 = factory.CreateClient();
        var csrf2 = await GetCsrfTokenAsync(client2);

        var signIn = new CustomerSignInRequest("mahmoud@example.com", "WrongPassword!");
        using var signInMsg = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/sign-in")
        {
            Content = JsonContent.Create(signIn),
        };
        signInMsg.Headers.Add("X-XSRF-TOKEN", csrf2);
        var res = await client2.SendAsync(signInMsg);

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task CustomerOrderCannotBeAccessedByAnotherCustomer()
    {
        // 1. Customer A registers and places an order
        using var clientA = factory.CreateClient();
        var csrfA = await GetCsrfTokenAsync(clientA);

        var regA = new RegisterCustomerRequest("العميل أ", "customerA@example.com", "Password123!");
        using var regMsgA = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(regA),
        };
        regMsgA.Headers.Add("X-XSRF-TOKEN", csrfA);
        await clientA.SendAsync(regMsgA);

        var orderRequest = new
        {
            customerName = "العميل أ",
            customerPhone = "01012345678",
            orderType = "Takeaway",
            items = new[] { new { menuItemId = OrderingApiFactory.ActiveItemId, quantity = 2 } },
        };
        using var orderMsg = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(orderRequest),
        };
        orderMsg.Headers.Add("X-XSRF-TOKEN", csrfA);
        var orderRes = await clientA.SendAsync(orderMsg);
        Assert.Equal(HttpStatusCode.Created, orderRes.StatusCode);

        var json = await orderRes.Content.ReadFromJsonAsync<JsonElement>();
        var publicCode = json.GetProperty("publicCode").GetString();
        Assert.NotNull(publicCode);

        // Customer A can track their own order
        var trackA = await clientA.GetAsync($"/api/orders/track/{publicCode}");
        Assert.Equal(HttpStatusCode.OK, trackA.StatusCode);

        // Customer A can see order in customer orders list
        var myOrdersA = await clientA.GetAsync("/api/customer/orders");
        Assert.Equal(HttpStatusCode.OK, myOrdersA.StatusCode);
        var ordersListA = await myOrdersA.Content.ReadFromJsonAsync<List<CustomerOrderSummaryDto>>(JsonOptions);
        Assert.NotNull(ordersListA);
        Assert.Single(ordersListA);
        Assert.Equal(publicCode, ordersListA[0].PublicCode);

        // 2. Customer B registers
        using var clientB = factory.CreateClient();
        var csrfB = await GetCsrfTokenAsync(clientB);

        var regB = new RegisterCustomerRequest("العميل ب", "customerB@example.com", "Password123!");
        using var regMsgB = new HttpRequestMessage(HttpMethod.Post, "/api/customer/auth/register")
        {
            Content = JsonContent.Create(regB),
        };
        regMsgB.Headers.Add("X-XSRF-TOKEN", csrfB);
        await clientB.SendAsync(regMsgB);

        // Customer B cannot access Customer A's order tracking
        var trackB = await clientB.GetAsync($"/api/orders/track/{publicCode}");
        Assert.Equal(HttpStatusCode.Unauthorized, trackB.StatusCode);

        // Customer B cannot access reorder-preview for Customer A's order
        using var reorderMsgB = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        reorderMsgB.Headers.Add("X-XSRF-TOKEN", csrfB);
        var reorderB = await clientB.SendAsync(reorderMsgB);
        Assert.Equal(HttpStatusCode.Unauthorized, reorderB.StatusCode);

        // Customer B does not see Customer A's order in their orders list
        var myOrdersB = await clientB.GetAsync("/api/customer/orders");
        Assert.Equal(HttpStatusCode.OK, myOrdersB.StatusCode);
        var ordersListB = await myOrdersB.Content.ReadFromJsonAsync<List<CustomerOrderSummaryDto>>(JsonOptions);
        Assert.NotNull(ordersListB);
        Assert.Empty(ordersListB);
    }
}
