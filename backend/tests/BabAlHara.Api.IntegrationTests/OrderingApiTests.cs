using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BabAlHara.Domain.Ordering;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.IntegrationTests;

public sealed class OrderingApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>, IAsyncLifetime
{
    private readonly HttpClient client = factory.CreateClient(
        new WebApplicationFactoryClientOptions { AllowAutoRedirect = false, HandleCookies = true });

    public Task InitializeAsync() => factory.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ValidTakeawayOrderIsPersistedWithServerTotalsAndNotified()
    {
        using var response = await PostOrderAsync(TakeawayRequest(quantity: 2));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await ReadCreatedOrderAsync(response);
        Assert.Equal(170m, result.Subtotal);
        Assert.Equal(0m, result.DeliveryFee);
        Assert.Equal(170m, result.Total);
        Assert.Equal("Takeaway", result.OrderType);
        Assert.StartsWith("BH-TEST-", result.PublicCode, StringComparison.Ordinal);

        await using var dbContext = factory.CreateDbContext();
        var persisted = await dbContext.Orders.Include(order => order.Items).SingleAsync();
        Assert.Equal(result.PublicCode, persisted.PublicCode);
        Assert.Single(persisted.Items);
        Assert.Single(factory.Notifier.Orders);
        Assert.Equal(persisted.PublicCode, factory.Notifier.Orders[0].PublicCode);
    }

    [Fact]
    public async Task ValidDeliveryOrderUsesActiveAreaAndPersistsAddressSnapshot()
    {
        using var response = await PostOrderAsync(DeliveryRequest(quantity: 1));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await ReadCreatedOrderAsync(response);
        Assert.Equal(85m, result.Subtotal);
        Assert.Equal(35m, result.DeliveryFee);
        Assert.Equal(120m, result.Total);
        Assert.Equal("Delivery", result.OrderType);

        await using var dbContext = factory.CreateDbContext();
        var persisted = await dbContext.Orders.SingleAsync();
        Assert.Equal(OrderingApiFactory.ActiveAreaId, persisted.DeliveryAreaId);
        Assert.Equal("مدينة نصر", persisted.DeliveryAreaNameAr);
        Assert.Equal("Nasr City", persisted.DeliveryAreaNameEn);
        Assert.Equal("12 Abbas El Akkad, floor 3", persisted.Address);
    }

    [Fact]
    public async Task ManipulatedClientPriceIsIgnored()
    {
        var request = TakeawayRequest(quantity: 2);
        request["price"] = 0.01m;
        ((Dictionary<string, object?>[])request["items"]!)[0]["unitPrice"] = 0.01m;

        using var response = await PostOrderAsync(request);

        var result = await ReadCreatedOrderAsync(response);
        Assert.Equal(170m, result.Subtotal);
        await using var dbContext = factory.CreateDbContext();
        Assert.Equal(85m, (await dbContext.OrderItems.SingleAsync()).UnitPrice);
    }

    [Fact]
    public async Task ManipulatedClientTotalsAndDeliveryFeeAreIgnored()
    {
        var request = DeliveryRequest(quantity: 2);
        request["subtotal"] = 1m;
        request["deliveryFee"] = 1m;
        request["total"] = 2m;

        using var response = await PostOrderAsync(request);

        var result = await ReadCreatedOrderAsync(response);
        Assert.Equal(170m, result.Subtotal);
        Assert.Equal(35m, result.DeliveryFee);
        Assert.Equal(205m, result.Total);
    }

    [Theory]
    [InlineData("51000000-0000-0000-0000-000000000003", "unavailable_menu_item")]
    [InlineData("51000000-0000-0000-0000-000000000004", "inactive_menu_item")]
    [InlineData("51000000-0000-0000-0000-000000000005", "inactive_menu_item")]
    public async Task UnavailableOrInactiveItemsAreRejected(string itemId, string expectedCode)
    {
        var request = TakeawayRequest();
        ((Dictionary<string, object?>[])request["items"]!)[0]["menuItemId"] = Guid.Parse(itemId);

        using var response = await PostOrderAsync(request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(expectedCode, await ReadProblemCodeAsync(response));
        await AssertNoOrderOrNotificationAsync();
    }

    [Fact]
    public async Task UnknownItemIsRejected()
    {
        var request = TakeawayRequest();
        ((Dictionary<string, object?>[])request["items"]!)[0]["menuItemId"] = Guid.NewGuid();

        using var response = await PostOrderAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_menu_item", await ReadProblemCodeAsync(response));
        await AssertNoOrderOrNotificationAsync();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(100)]
    public async Task InvalidQuantityIsRejected(int quantity)
    {
        using var response = await PostOrderAsync(TakeawayRequest(quantity));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_quantity", await ReadProblemCodeAsync(response));
        await AssertNoOrderOrNotificationAsync();
    }

    [Fact]
    public async Task InactiveDeliveryAreaIsRejected()
    {
        var request = DeliveryRequest();
        request["deliveryAreaId"] = OrderingApiFactory.InactiveAreaId;

        using var response = await PostOrderAsync(request);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("inactive_delivery_area", await ReadProblemCodeAsync(response));
        await AssertNoOrderOrNotificationAsync();
    }

    [Fact]
    public async Task MissingDeliveryAreaIsRejected()
    {
        var request = DeliveryRequest();
        request["deliveryAreaId"] = null;

        using var response = await PostOrderAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("missing_delivery_details", await ReadProblemCodeAsync(response));
        await AssertNoOrderOrNotificationAsync();
    }

    [Fact]
    public async Task MultipleLinesCalculateCorrectSubtotalAndTotal()
    {
        var request = DeliveryRequest(quantity: 2);
        request["items"] = new Dictionary<string, object?>[]
        {
            new() { ["menuItemId"] = OrderingApiFactory.ActiveItemId, ["quantity"] = 2 },
            new() { ["menuItemId"] = OrderingApiFactory.SecondActiveItemId, ["quantity"] = 3 },
        };

        using var response = await PostOrderAsync(request);

        var result = await ReadCreatedOrderAsync(response);
        Assert.Equal(314m, result.Subtotal);
        Assert.Equal(35m, result.DeliveryFee);
        Assert.Equal(349m, result.Total);
    }

    [Fact]
    public async Task HistoricalOrderItemSnapshotStoresNamesPriceAndLineTotal()
    {
        using var response = await PostOrderAsync(TakeawayRequest(quantity: 3));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using var dbContext = factory.CreateDbContext();
        var snapshot = await dbContext.OrderItems.SingleAsync();
        Assert.Equal("سندوتش كفتة", snapshot.ProductNameAr);
        Assert.Equal("Kofta sandwich", snapshot.ProductNameEn);
        Assert.Equal(85m, snapshot.UnitPrice);
        Assert.Equal(255m, snapshot.LineTotal);
    }

    [Fact]
    public async Task SeparateOrdersReceiveUniquePublicCodes()
    {
        using var firstResponse = await PostOrderAsync(TakeawayRequest());
        using var secondResponse = await PostOrderAsync(TakeawayRequest());

        var first = await ReadCreatedOrderAsync(firstResponse);
        var second = await ReadCreatedOrderAsync(secondResponse);
        Assert.NotEqual(first.PublicCode, second.PublicCode);

        await using var dbContext = factory.CreateDbContext();
        Assert.Equal(2, await dbContext.Orders.Select(order => order.PublicCode).Distinct().CountAsync());
    }

    [Fact]
    public async Task UniqueCodeViolationRollsBackWholeSecondAggregateAndDoesNotNotify()
    {
        const string duplicateCode = "BH-DUPLICATE-0001";
        factory.UseFixedOrderCode(duplicateCode);
        using var firstResponse = await PostOrderAsync(TakeawayRequest());
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Single(factory.Notifier.Orders);

        using var secondResponse = await PostOrderAsync(TakeawayRequest(quantity: 2));

        Assert.Equal(HttpStatusCode.InternalServerError, secondResponse.StatusCode);
        await using var dbContext = factory.CreateDbContext();
        Assert.Equal(1, await dbContext.Orders.CountAsync());
        Assert.Equal(1, await dbContext.OrderItems.CountAsync());
        Assert.Single(factory.Notifier.Orders);
    }

    [Fact]
    public async Task FailedValidationNeverEmitsRealtimeNotification()
    {
        using var response = await PostOrderAsync(TakeawayRequest(quantity: 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(factory.Notifier.Orders);
    }

    [Fact]
    public async Task SuccessfulRealtimePayloadIsPublishedOnlyAfterSqlPersistence()
    {
        using var response = await PostOrderAsync(DeliveryRequest());
        var result = await ReadCreatedOrderAsync(response);

        await using var dbContext = factory.CreateDbContext();
        Assert.True(await dbContext.Orders.AnyAsync(order => order.PublicCode == result.PublicCode));
        var notified = Assert.Single(factory.Notifier.Orders);
        Assert.Equal(result.PublicCode, notified.PublicCode);
        Assert.Equal("12 Abbas El Akkad, floor 3", notified.Address);
        Assert.Single(notified.Items);
    }

    [Fact]
    public async Task CatalogReturnsOnlyActiveItemsButPreservesAvailabilityFlag()
    {
        using var response = await client.GetAsync("/api/menu/items");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var ids = document.RootElement.EnumerateArray()
            .Select(element => element.GetProperty("id").GetGuid())
            .ToArray();
        Assert.Contains(OrderingApiFactory.ActiveItemId, ids);
        Assert.Contains(OrderingApiFactory.UnavailableItemId, ids);
        Assert.DoesNotContain(OrderingApiFactory.InactiveItemId, ids);
        Assert.DoesNotContain(OrderingApiFactory.InactiveCategoryItemId, ids);
    }

    [Fact]
    public async Task KitchenQueueRequiresAnAuthenticatedKitchenSession()
    {
        using var response = await client.GetAsync("/api/kitchen/orders/active");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<HttpResponseMessage> PostOrderAsync(Dictionary<string, object?> request)
    {
        using var tokenResponse = await client.GetAsync("/api/security/csrf");
        tokenResponse.EnsureSuccessStatusCode();
        using var tokenDocument = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
        var token = tokenDocument.RootElement.GetProperty("requestToken").GetString();
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(request),
        };
        message.Headers.Add("X-XSRF-TOKEN", token);
        return await client.SendAsync(message);
    }

    private static Dictionary<string, object?> TakeawayRequest(int quantity = 1) =>
        new()
        {
            ["customerName"] = "Ahmed Hassan",
            ["customerPhone"] = "01012345678",
            ["orderType"] = "Takeaway",
            ["deliveryAreaId"] = null,
            ["address"] = null,
            ["customerNote"] = "No onion",
            ["items"] = new Dictionary<string, object?>[]
            {
                new() { ["menuItemId"] = OrderingApiFactory.ActiveItemId, ["quantity"] = quantity },
            },
        };

    private static Dictionary<string, object?> DeliveryRequest(int quantity = 1) =>
        new()
        {
            ["customerName"] = "Mariam Adel",
            ["customerPhone"] = "+201112345678",
            ["orderType"] = "Delivery",
            ["deliveryAreaId"] = OrderingApiFactory.ActiveAreaId,
            ["address"] = "12 Abbas El Akkad, floor 3",
            ["customerNote"] = "Call on arrival",
            ["items"] = new Dictionary<string, object?>[]
            {
                new() { ["menuItemId"] = OrderingApiFactory.ActiveItemId, ["quantity"] = quantity },
            },
        };

    private static async Task<CreatedOrderResponse> ReadCreatedOrderAsync(HttpResponseMessage response)
    {
        var result = await response.Content.ReadFromJsonAsync<CreatedOrderResponse>();
        return Assert.IsType<CreatedOrderResponse>(result);
    }

    private static async Task<string?> ReadProblemCodeAsync(HttpResponseMessage response)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.GetProperty("code").GetString();
    }

    private async Task AssertNoOrderOrNotificationAsync()
    {
        await using var dbContext = factory.CreateDbContext();
        Assert.Empty(factory.Notifier.Orders);
        Assert.Equal(0, await dbContext.Orders.CountAsync());
        Assert.Equal(0, await dbContext.OrderItems.CountAsync());
    }

    private sealed record CreatedOrderResponse(
        string PublicCode,
        string OrderType,
        decimal Subtotal,
        decimal DeliveryFee,
        decimal Total);
}
