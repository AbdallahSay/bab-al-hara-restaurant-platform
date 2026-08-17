using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Api.Features.OrderTracking;
using BabAlHara.Application.Cashier;
using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Ordering;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Ordering;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.IntegrationTests;

public sealed class OrderTrackingApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private static async Task<(string PublicCode, string CookieHeader, string RawToken, HttpResponseMessage Response)> CreateGuestDeliveryOrderAsync(HttpClient client)
    {
        var csrfResponse = await client.GetAsync("/api/security/csrf");
        var csrfJson = await csrfResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = csrfJson.GetProperty("requestToken").GetString()!;

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new
            {
                customerName = "Ahmed Ali",
                customerPhone = "01012345678",
                orderType = "Delivery",
                deliveryAreaId = OrderingApiFactory.ActiveAreaId,
                address = "123 Nile Street, Maadi",
                customerNote = "Ring bell please",
                items = new[]
                {
                    new { menuItemId = OrderingApiFactory.ActiveItemId, quantity = 2 }
                }
            })
        };
        request.Headers.Add("X-XSRF-TOKEN", token);

        var response = await client.PostAsync("/api/orders", request.Content);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);
        Assert.False(doc.RootElement.TryGetProperty("trackingToken", out _));
        Assert.False(doc.RootElement.TryGetProperty("rawToken", out _));
        Assert.False(doc.RootElement.TryGetProperty("trackingSecret", out _));

        var created = JsonSerializer.Deserialize<CreatedOrderDto>(rawJson, JsonOptions);
        Assert.NotNull(created);
        Assert.NotEmpty(created.PublicCode);

        // Find tracking cookie
        var setCookieHeaders = response.Headers.GetValues("Set-Cookie").ToList();
        var trackingSetCookie = setCookieHeaders.FirstOrDefault(c => c.Contains($"Tracking-{created.PublicCode}"));
        Assert.NotNull(trackingSetCookie);
        Assert.Contains("httponly", trackingSetCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("path=/", trackingSetCookie, StringComparison.OrdinalIgnoreCase);

        // Extract cookie name=value for request Cookie header
        var cookiePair = trackingSetCookie.Split(';')[0];
        var rawToken = cookiePair.Split('=')[1];

        return (created.PublicCode, cookiePair, rawToken, response);
    }

    private static async Task<(string PublicCode, string CookieHeader, string RawToken)> CreateGuestTakeawayOrderAsync(HttpClient client)
    {
        var csrfResponse = await client.GetAsync("/api/security/csrf");
        var csrfJson = await csrfResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = csrfJson.GetProperty("requestToken").GetString()!;

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new
            {
                customerName = "Sara Tarek",
                customerPhone = "01123456789",
                orderType = "Takeaway",
                deliveryAreaId = (Guid?)null,
                address = (string?)null,
                customerNote = (string?)null,
                items = new[]
                {
                    new { menuItemId = OrderingApiFactory.ActiveItemId, quantity = 1 }
                }
            })
        };
        request.Headers.Add("X-XSRF-TOKEN", token);

        var response = await client.PostAsync("/api/orders", request.Content);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);
        Assert.False(doc.RootElement.TryGetProperty("trackingToken", out _));

        var created = JsonSerializer.Deserialize<CreatedOrderDto>(rawJson, JsonOptions);
        Assert.NotNull(created);

        var setCookieHeaders = response.Headers.GetValues("Set-Cookie").ToList();
        var trackingSetCookie = setCookieHeaders.First(c => c.Contains($"Tracking-{created.PublicCode}"));
        var cookiePair = trackingSetCookie.Split(';')[0];
        var rawToken = cookiePair.Split('=')[1];

        return (created.PublicCode, cookiePair, rawToken);
    }

    [Fact]
    public async Task OrderCreationSetsHttpOnlyTrackingCookieAndOmitsRawTokenFromResponse()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var (publicCode, cookieHeader, rawToken, response) = await CreateGuestDeliveryOrderAsync(client);

        Assert.NotEmpty(publicCode);
        Assert.NotEmpty(cookieHeader);
        Assert.NotEmpty(rawToken);

        var setCookie = response.Headers.GetValues("Set-Cookie").First(c => c.Contains(publicCode));
        Assert.Contains("httponly", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("max-age=", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetTrackingValidCookieReturnsCorrectOrderData()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var (publicCode, cookieHeader, _, _) = await CreateGuestDeliveryOrderAsync(client);

        using var trackingRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingRequest.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(trackingRequest);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tracking = await response.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(tracking);
        Assert.Equal(publicCode, tracking.PublicCode);
        Assert.Equal("Pending", tracking.Status);
        Assert.Equal("Delivery", tracking.OrderType);
        Assert.Equal("Cash", tracking.PaymentMethod);
        Assert.Equal("Pending", tracking.PaymentStatus);
        Assert.NotEmpty(tracking.Items);
        Assert.True(tracking.Total > 0);
        Assert.Equal("123 Nile Street, Maadi", tracking.Address);
    }

    [Fact]
    public async Task GetTrackingNoCookieReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();
        var response = await unauthClient.GetAsync($"/api/orders/track/{publicCode}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTrackingInvalidCookieValueReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        request.Headers.Add("Cookie", $"BabAlHara-Tracking-{publicCode}=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

        var response = await unauthClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTrackingMalformedCookieValueReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        request.Headers.Add("Cookie", $"BabAlHara-Tracking-{publicCode}=not-a-base64url-!!!@@@###");

        var response = await unauthClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTrackingCookieForDifferentOrderReturns401()
    {
        await factory.ResetAsync();
        var client1 = factory.CreateClient();
        var client2 = factory.CreateClient();

        var (order1Code, _, _, _) = await CreateGuestDeliveryOrderAsync(client1);
        var (order2Code, order2Cookie, _, _) = await CreateGuestDeliveryOrderAsync(client2);

        // Send order2 cookie on a clean client when requesting order1 tracking
        var unauthClient = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{order1Code}");
        request.Headers.Add("Cookie", order2Cookie);

        var response = await unauthClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MultipleOrdersOnSameClientCoexistWithoutOverwriting()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var (order1Code, order1Cookie, _, _) = await CreateGuestDeliveryOrderAsync(client);
        var (order2Code, order2Cookie, _, _) = await CreateGuestDeliveryOrderAsync(client);

        // Combined cookie header as sent by a browser that has placed both orders
        var combinedCookies = $"{order1Cookie}; {order2Cookie}";

        using var req1 = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{order1Code}");
        req1.Headers.Add("Cookie", combinedCookies);
        var resp1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.OK, resp1.StatusCode);
        var track1 = await resp1.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.Equal(order1Code, track1!.PublicCode);

        using var req2 = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{order2Code}");
        req2.Headers.Add("Cookie", combinedCookies);
        var resp2 = await client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.OK, resp2.StatusCode);
        var track2 = await resp2.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.Equal(order2Code, track2!.PublicCode);
    }

    [Fact]
    public async Task ExpiredTrackingTokenReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _, _) = await CreateGuestDeliveryOrderAsync(client);

        // Manually expire the token in database
        await using (var dbContext = factory.CreateDbContext())
        {
            var order = await dbContext.Orders.FirstAsync(o => o.PublicCode == publicCode);
            order.SetTrackingCredentials(order.TrackingTokenHash, DateTimeOffset.UtcNow.AddMinutes(-5));
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTrackingExcludesInternalFields()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _, _) = await CreateGuestDeliveryOrderAsync(client);

        using var trackingRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingRequest.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(trackingRequest);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(rawJson);
        var root = document.RootElement;

        Assert.False(root.TryGetProperty("id", out _));
        Assert.False(root.TryGetProperty("Id", out _));
        Assert.False(root.TryGetProperty("customerPhone", out _));
        Assert.False(root.TryGetProperty("customerName", out _));
        Assert.False(root.TryGetProperty("driverId", out _));
        Assert.False(root.TryGetProperty("driverName", out _));
        Assert.False(root.TryGetProperty("driverAssignedAtUtc", out _));
        Assert.False(root.TryGetProperty("rowVersion", out _));
        Assert.False(root.TryGetProperty("RowVersion", out _));
        Assert.False(root.TryGetProperty("trackingTokenHash", out _));
        Assert.False(root.TryGetProperty("TrackingTokenHash", out _));
        Assert.False(root.TryGetProperty("trackingTokenExpiresAtUtc", out _));
    }

    [Fact]
    public async Task GetTrackingPublicCodeAloneIsInsufficient()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();
        var response = await unauthClient.GetAsync($"/api/orders/track/{publicCode}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTrackingKitchenTransitionsUpdateTrackingAndTimeline()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        var confirmResp = await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/confirm", new { });
        Assert.Equal(HttpStatusCode.OK, confirmResp.StatusCode);

        using var trackingReq1 = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingReq1.Headers.Add("Cookie", cookieHeader);
        var trackResp1 = await client.SendAsync(trackingReq1);
        var track1 = await trackResp1.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(track1);
        Assert.Equal("Confirmed", track1.Status);
        Assert.Single(track1.StatusTimeline);
        Assert.Equal("Confirmed", track1.StatusTimeline[0].Status);

        var prepareResp = await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/start-preparing", new { });
        Assert.Equal(HttpStatusCode.OK, prepareResp.StatusCode);

        var readyResp = await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/mark-ready", new { });
        Assert.Equal(HttpStatusCode.OK, readyResp.StatusCode);

        using var trackingReq2 = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingReq2.Headers.Add("Cookie", cookieHeader);
        var trackResp2 = await client.SendAsync(trackingReq2);
        var track2 = await trackResp2.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(track2);
        Assert.Equal("Ready", track2.Status);
        Assert.Equal(3, track2.StatusTimeline.Count);
        Assert.Equal("Confirmed", track2.StatusTimeline[0].Status);
        Assert.Equal("Preparing", track2.StatusTimeline[1].Status);
        Assert.Equal("Ready", track2.StatusTimeline[2].Status);
    }

    [Fact]
    public async Task GetTrackingDriverDeliveryLifecycleUpdatesTrackingToDelivered()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/confirm", new { });
        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/start-preparing", new { });
        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/mark-ready", new { });

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier Staff");

        var driver = await factory.EnsureStaffUserAsync("driver1@bab-al-hara.local", "Driver", "Driver One");
        var assignResp = await cashierClient.PostAsJsonAsync($"/api/orders/{publicCode}/assign-driver", new { driverId = driver.Id });
        Assert.Equal(HttpStatusCode.OK, assignResp.StatusCode);

        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver1@bab-al-hara.local",
            "Driver",
            "Driver One");

        var startResp = await driverClient.PostAsJsonAsync($"/api/orders/{publicCode}/start-delivery", new { });
        Assert.Equal(HttpStatusCode.OK, startResp.StatusCode);

        using var trackingReq1 = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingReq1.Headers.Add("Cookie", cookieHeader);
        var trackResp1 = await client.SendAsync(trackingReq1);
        var track1 = await trackResp1.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(track1);
        Assert.Equal("OnTheWay", track1.Status);
        Assert.Contains(track1.StatusTimeline, t => t.Status == "OnTheWay");

        var deliveredResp = await driverClient.PostAsJsonAsync($"/api/orders/{publicCode}/mark-delivered", new { });
        Assert.Equal(HttpStatusCode.OK, deliveredResp.StatusCode);

        using var trackingReq2 = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingReq2.Headers.Add("Cookie", cookieHeader);
        var trackResp2 = await client.SendAsync(trackingReq2);
        var track2 = await trackResp2.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(track2);
        Assert.Equal("Delivered", track2.Status);
        Assert.Equal("Paid", track2.PaymentStatus);
        Assert.Contains(track2.StatusTimeline, t => t.Status == "Delivered");

        Assert.Contains(factory.TrackingNotifier.NotifiedCodes, code => code == publicCode);
    }

    [Fact]
    public async Task GetTrackingTakeawayLifecycleDeliveredWithoutOnTheWay()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestTakeawayOrderAsync(client);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/confirm", new { });
        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/start-preparing", new { });
        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/mark-ready", new { });

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier Staff");

        var readyOrdersResp = await cashierClient.GetAsync("/api/cashier/orders");
        var readyOrders = await readyOrdersResp.Content.ReadFromJsonAsync<List<CashierOrderDto>>(JsonOptions);
        var readyOrder = readyOrders!.First(o => o.PublicCode == publicCode);

        var handoffResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{readyOrder.Id}/cash-payment/confirm",
            new { rowVersion = Convert.ToBase64String(readyOrder.RowVersion) });
        Assert.Equal(HttpStatusCode.OK, handoffResp.StatusCode);

        using var trackingReq = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        trackingReq.Headers.Add("Cookie", cookieHeader);
        var trackResp = await client.SendAsync(trackingReq);
        var track = await trackResp.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(track);
        Assert.Equal("Delivered", track.Status);
        Assert.Equal("Takeaway", track.OrderType);
        Assert.Equal("Paid", track.PaymentStatus);
        Assert.DoesNotContain(track.StatusTimeline, t => t.Status == "OnTheWay");
    }

    [Fact]
    public async Task GetTrackingAfterDeliveredStillReturns200()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestTakeawayOrderAsync(client);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/confirm", new { });
        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/start-preparing", new { });
        await kitchenClient.PostAsJsonAsync($"/api/kitchen/orders/{publicCode}/mark-ready", new { });

        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier Staff");

        var readyOrdersResp = await cashierClient.GetAsync("/api/cashier/orders");
        var readyOrders = await readyOrdersResp.Content.ReadFromJsonAsync<List<CashierOrderDto>>(JsonOptions);
        var readyOrder = readyOrders!.First(o => o.PublicCode == publicCode);

        var handoffResp = await cashierClient.PostAsJsonAsync(
            $"/api/orders/{readyOrder.Id}/cash-payment/confirm",
            new { rowVersion = Convert.ToBase64String(readyOrder.RowVersion) });
        Assert.Equal(HttpStatusCode.OK, handoffResp.StatusCode);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/track/{publicCode}");
        request.Headers.Add("Cookie", cookieHeader);
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tracking = await response.Content.ReadFromJsonAsync<CustomerOrderTrackingDto>(JsonOptions);
        Assert.NotNull(tracking);
        Assert.Equal("Delivered", tracking.Status);
    }

    [Fact]
    public async Task GetTrackingTokenNotExposedInStaffDtos()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        var response = await kitchenClient.GetAsync("/api/kitchen/orders/active");
        var rawJson = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain("trackingToken", rawJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("trackingTokenHash", rawJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TrackingCookieHelperReturnsCorrectPrefixes()
    {
        var devCookie = TrackingCookieHelper.GetCookieName("BH-1234", isDevelopment: true);
        var prodCookie = TrackingCookieHelper.GetCookieName("BH-1234", isDevelopment: false);

        Assert.Equal("BabAlHara-Tracking-BH-1234", devCookie);
        Assert.Equal("__Host-BabAlHara-Tracking-BH-1234", prodCookie);
    }
}
