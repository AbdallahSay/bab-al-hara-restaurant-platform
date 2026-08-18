using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Application.Ordering;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Ordering;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.IntegrationTests;

public sealed class OrderReorderApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private static async Task<(string PublicCode, string CookieHeader, string RawToken)> CreateGuestDeliveryOrderAsync(HttpClient client)
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
                    new { menuItemId = OrderingApiFactory.ActiveItemId, quantity = 2 },
                    new { menuItemId = OrderingApiFactory.SecondActiveItemId, quantity = 1 }
                }
            })
        };
        request.Headers.Add("X-XSRF-TOKEN", token);

        var response = await client.PostAsync("/api/orders", request.Content);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        var created = JsonSerializer.Deserialize<CreatedOrderDto>(rawJson, JsonOptions);
        Assert.NotNull(created);
        Assert.NotEmpty(created.PublicCode);

        var setCookieHeaders = response.Headers.GetValues("Set-Cookie").ToList();
        var trackingSetCookie = setCookieHeaders.First(c => c.Contains($"Tracking-{created.PublicCode}"));
        var cookiePair = trackingSetCookie.Split(';')[0];
        var rawToken = cookiePair.Split('=')[1];

        return (created.PublicCode, cookiePair, rawToken);
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
                customerNote = "Extra napkins",
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
        var created = JsonSerializer.Deserialize<CreatedOrderDto>(rawJson, JsonOptions);
        Assert.NotNull(created);

        var setCookieHeaders = response.Headers.GetValues("Set-Cookie").ToList();
        var trackingSetCookie = setCookieHeaders.First(c => c.Contains($"Tracking-{created.PublicCode}"));
        var cookiePair = trackingSetCookie.Split(';')[0];
        var rawToken = cookiePair.Split('=')[1];

        return (created.PublicCode, cookiePair, rawToken);
    }

    [Fact]
    public async Task GetReorderPreviewValidTrackingCookieReturns200WithCatalogItemsAndCurrentPrices()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);
        Assert.Equal(publicCode, preview.PublicCode);
        Assert.Equal("Delivery", preview.OrderType);
        Assert.Equal(2, preview.EligibleItems.Count);
        Assert.Empty(preview.UnavailableItems);

        var item1 = preview.EligibleItems.First(i => i.MenuItemId == OrderingApiFactory.ActiveItemId);
        Assert.Equal("سندوتش كفتة", item1.NameAr);
        Assert.Equal("Kofta sandwich", item1.NameEn);
        Assert.Equal("/images/menu/kofta-sandwich.webp", item1.ImageReference);
        Assert.Equal(2, item1.Quantity);
        Assert.Equal(85m, item1.CurrentPrice);

        var item2 = preview.EligibleItems.First(i => i.MenuItemId == OrderingApiFactory.SecondActiveItemId);
        Assert.Equal("حمص", item2.NameAr);
        Assert.Equal("Hummus", item2.NameEn);
        Assert.Equal(1, item2.Quantity);
        Assert.Equal(48m, item2.CurrentPrice);

        Assert.Equal(OrderingApiFactory.ActiveAreaId, preview.SuggestedDeliveryAreaId);
        Assert.Equal("مدينة نصر", preview.SuggestedDeliveryAreaNameAr);
        Assert.Equal("Nasr City", preview.SuggestedDeliveryAreaNameEn);
        Assert.Equal("123 Nile Street, Maadi", preview.SuggestedAddress);
        Assert.Equal("Ring bell please", preview.SuggestedCustomerNote);
    }

    [Fact]
    public async Task GetReorderPreviewMissingCookieReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();
        var response = await unauthClient.PostAsync($"/api/orders/track/{publicCode}/reorder-preview", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetReorderPreviewInvalidOrMalformedCookieReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, _, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();

        using var invalidReq = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        invalidReq.Headers.Add("Cookie", $"BabAlHara-Tracking-{publicCode}=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        var invalidResp = await unauthClient.SendAsync(invalidReq);
        Assert.Equal(HttpStatusCode.Unauthorized, invalidResp.StatusCode);

        using var malformedReq = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        malformedReq.Headers.Add("Cookie", $"BabAlHara-Tracking-{publicCode}=invalid!base64url$$$");
        var malformedResp = await unauthClient.SendAsync(malformedReq);
        Assert.Equal(HttpStatusCode.Unauthorized, malformedResp.StatusCode);
    }

    [Fact]
    public async Task GetReorderPreviewExpiredTrackingCookieReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        await using (var dbContext = factory.CreateDbContext())
        {
            var order = await dbContext.Orders.FirstAsync(o => o.PublicCode == publicCode);
            order.SetTrackingCredentials(order.TrackingTokenHash, DateTimeOffset.UtcNow.AddMinutes(-5));
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetReorderPreviewCookieForDifferentOrderReturns401()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var (order1Code, _, _) = await CreateGuestDeliveryOrderAsync(client);
        var (_, order2Cookie, _) = await CreateGuestDeliveryOrderAsync(client);

        var unauthClient = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{order1Code}/reorder-preview");
        request.Headers.Add("Cookie", order2Cookie);

        var response = await unauthClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetReorderPreviewSoldOutItemMarkedAsUnavailableSoldOut()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        await using (var dbContext = factory.CreateDbContext())
        {
            var item = await dbContext.MenuItems.FirstAsync(m => m.Id == OrderingApiFactory.ActiveItemId);
            item.SetAvailability(false);
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);

        Assert.Single(preview.EligibleItems);
        Assert.Equal(OrderingApiFactory.SecondActiveItemId, preview.EligibleItems[0].MenuItemId);

        Assert.Single(preview.UnavailableItems);
        var unavailable = preview.UnavailableItems[0];
        Assert.Equal(OrderingApiFactory.ActiveItemId, unavailable.MenuItemId);
        Assert.Equal("سندوتش كفتة", unavailable.HistoricalNameAr);
        Assert.Equal("Kofta sandwich", unavailable.HistoricalNameEn);
        Assert.Equal("SoldOut", unavailable.Reason);
    }

    [Fact]
    public async Task GetReorderPreviewInactiveItemAndInactiveCategoryMarkedAsUnavailableInactive()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();

        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        await using (var dbContext = factory.CreateDbContext())
        {
            var order = await dbContext.Orders.Include(o => o.Items).FirstAsync(o => o.PublicCode == publicCode);
            order.AddItem(Guid.NewGuid(), OrderingApiFactory.InactiveItemId, "شاورما قديمة", "Old Shawarma", 1, 60m);
            order.AddItem(Guid.NewGuid(), OrderingApiFactory.InactiveCategoryItemId, "حلوى قديمة", "Old Sweet", 2, 70m);
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);

        Assert.Equal(2, preview.EligibleItems.Count);
        Assert.Equal(2, preview.UnavailableItems.Count);

        var unavailInactive = preview.UnavailableItems.First(u => u.MenuItemId == OrderingApiFactory.InactiveItemId);
        Assert.Equal("Inactive", unavailInactive.Reason);
        Assert.Equal("شاورما قديمة", unavailInactive.HistoricalNameAr);

        var unavailCatInactive = preview.UnavailableItems.First(u => u.MenuItemId == OrderingApiFactory.InactiveCategoryItemId);
        Assert.Equal("Inactive", unavailCatInactive.Reason);
        Assert.Equal("حلوى قديمة", unavailCatInactive.HistoricalNameAr);
    }

    [Fact]
    public async Task GetReorderPreviewDeletedOrMissingMenuItemMarkedAsUnavailableNotFound()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        var missingId = Guid.NewGuid();
        await using (var dbContext = factory.CreateDbContext())
        {
            await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE [app].[OrderItems] NOCHECK CONSTRAINT [FK_OrderItems_MenuItems_MenuItemId];");
            var order = await dbContext.Orders.FirstAsync(o => o.PublicCode == publicCode);
            order.AddItem(Guid.NewGuid(), missingId, "طبق محذوف", "Deleted Dish", 3, 100m);
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);

        var notFoundItem = preview.UnavailableItems.FirstOrDefault(u => u.MenuItemId == missingId);
        Assert.NotNull(notFoundItem);
        Assert.Equal("NotFound", notFoundItem.Reason);
        Assert.Equal("طبق محذوف", notFoundItem.HistoricalNameAr);
        Assert.Equal("Deleted Dish", notFoundItem.HistoricalNameEn);
    }

    [Fact]
    public async Task GetReorderPreviewChangedPriceReturnsCurrentCatalogPriceNotHistoricalPrice()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        await using (var dbContext = factory.CreateDbContext())
        {
            var item = await dbContext.MenuItems.FirstAsync(m => m.Id == OrderingApiFactory.ActiveItemId);
            item.Update(
                item.CategoryId,
                item.NameAr,
                item.NameEn,
                item.DescriptionAr,
                item.DescriptionEn,
                price: 110m,
                item.ImageReference,
                item.PreparationMinutes,
                item.DisplayOrder,
                item.IsActive,
                item.IsAvailable);
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);

        var activeItem = preview.EligibleItems.First(i => i.MenuItemId == OrderingApiFactory.ActiveItemId);
        Assert.Equal(110m, activeItem.CurrentPrice);
    }

    [Fact]
    public async Task GetReorderPreviewNoSensitiveTokensOrSecretsReturned()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rawJson);
        var root = doc.RootElement;

        Assert.False(root.TryGetProperty("id", out _));
        Assert.False(root.TryGetProperty("Id", out _));
        Assert.False(root.TryGetProperty("trackingToken", out _));
        Assert.False(root.TryGetProperty("trackingTokenHash", out _));
        Assert.False(root.TryGetProperty("trackingTokenExpiresAtUtc", out _));
        Assert.False(root.TryGetProperty("rowVersion", out _));
        Assert.False(root.TryGetProperty("RowVersion", out _));
        Assert.False(root.TryGetProperty("customerPhone", out _));
    }

    [Fact]
    public async Task GetReorderPreviewTakeawayOrderSuggestedDeliveryFieldsAreNull()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestTakeawayOrderAsync(client);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);
        Assert.Equal("Takeaway", preview.OrderType);
        Assert.Null(preview.SuggestedDeliveryAreaId);
        Assert.Null(preview.SuggestedDeliveryAreaNameAr);
        Assert.Null(preview.SuggestedDeliveryAreaNameEn);
        Assert.Null(preview.SuggestedAddress);
        Assert.Equal("Extra napkins", preview.SuggestedCustomerNote);
    }

    [Fact]
    public async Task GetReorderPreviewInactiveDeliveryAreaSuggestedDeliveryAreaIdIsNullAndHistoricalNamesRetained()
    {
        await factory.ResetAsync();
        var client = factory.CreateClient();
        var (publicCode, cookieHeader, _) = await CreateGuestDeliveryOrderAsync(client);

        await using (var dbContext = factory.CreateDbContext())
        {
            var order = await dbContext.Orders.FirstAsync(o => o.PublicCode == publicCode);
            var property = typeof(Order).GetProperty(nameof(Order.DeliveryAreaId));
            property!.SetValue(order, OrderingApiFactory.InactiveAreaId);
            await dbContext.SaveChangesAsync();
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/orders/track/{publicCode}/reorder-preview");
        request.Headers.Add("Cookie", cookieHeader);

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var preview = await response.Content.ReadFromJsonAsync<ReorderPreviewDto>(JsonOptions);
        Assert.NotNull(preview);
        Assert.Null(preview.SuggestedDeliveryAreaId);
        Assert.Equal("مدينة نصر", preview.SuggestedDeliveryAreaNameAr);
    }
}
