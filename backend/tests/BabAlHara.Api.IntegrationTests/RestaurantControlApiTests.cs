using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Application.Ordering;
using BabAlHara.Application.RestaurantControl;
using BabAlHara.Domain.Ordering;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.IntegrationTests;

public sealed class RestaurantControlApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>, IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly HttpClient anonymousClient = factory.CreateClient(
        new WebApplicationFactoryClientOptions { AllowAutoRedirect = false, HandleCookies = true });

    public Task InitializeAsync() => factory.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task DefaultRestaurantControlIsAcceptingOrders()
    {
        var response = await anonymousClient.GetAsync("/api/restaurant/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var status = await response.Content.ReadFromJsonAsync<RestaurantPublicStatusResponse>(JsonOptions);
        Assert.NotNull(status);
        Assert.True(status.AcceptingOrders);
        Assert.Null(status.MessageAr);
        Assert.Null(status.MessageEn);
    }

    [Fact]
    public async Task ManagerCanPauseAndReopenRestaurant()
    {
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Ashraf");

        // 1. Get initial status
        var getResponse = await managerClient.GetAsync("/api/management/restaurant/status");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var initialControl = await getResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(initialControl);
        Assert.True(initialControl.AcceptingOrders);

        // 2. Pause restaurant
        var pauseRequest = new UpdateRestaurantControlRequest(
            AcceptingOrders: false,
            PauseMessageAr: "المطعم في استراحة قصيرة",
            PauseMessageEn: "The restaurant is on a short break",
            RowVersion: initialControl.RowVersion);

        var pauseResponse = await managerClient.PutAsJsonAsync("/api/management/restaurant/status", pauseRequest);
        Assert.Equal(HttpStatusCode.OK, pauseResponse.StatusCode);

        var pausedControl = await pauseResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(pausedControl);
        Assert.False(pausedControl.AcceptingOrders);
        Assert.Equal("المطعم في استراحة قصيرة", pausedControl.PauseMessageAr);
        Assert.Equal("The restaurant is on a short break", pausedControl.PauseMessageEn);
        Assert.Equal("Manager Ashraf", pausedControl.UpdatedByStaffDisplayName);

        // 3. Verify public status shows paused
        var publicResponse = await anonymousClient.GetAsync("/api/restaurant/status");
        Assert.Equal(HttpStatusCode.OK, publicResponse.StatusCode);
        var publicStatus = await publicResponse.Content.ReadFromJsonAsync<RestaurantPublicStatusResponse>(JsonOptions);
        Assert.NotNull(publicStatus);
        Assert.False(publicStatus.AcceptingOrders);
        Assert.Equal("المطعم في استراحة قصيرة", publicStatus.MessageAr);
        Assert.Equal("The restaurant is on a short break", publicStatus.MessageEn);

        // 4. Reopen restaurant
        var reopenRequest = new UpdateRestaurantControlRequest(
            AcceptingOrders: true,
            PauseMessageAr: null,
            PauseMessageEn: null,
            RowVersion: pausedControl.RowVersion);

        var reopenResponse = await managerClient.PutAsJsonAsync("/api/management/restaurant/status", reopenRequest);
        Assert.Equal(HttpStatusCode.OK, reopenResponse.StatusCode);

        var reopenedControl = await reopenResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(reopenedControl);
        Assert.True(reopenedControl.AcceptingOrders);
        Assert.Null(reopenedControl.PauseMessageAr);
        Assert.Null(reopenedControl.PauseMessageEn);

        // 5. Verify public status shows accepting orders
        var publicResponseAfterReopen = await anonymousClient.GetAsync("/api/restaurant/status");
        var publicStatusAfterReopen = await publicResponseAfterReopen.Content.ReadFromJsonAsync<RestaurantPublicStatusResponse>(JsonOptions);
        Assert.NotNull(publicStatusAfterReopen);
        Assert.True(publicStatusAfterReopen.AcceptingOrders);
        Assert.Null(publicStatusAfterReopen.MessageAr);
        Assert.Null(publicStatusAfterReopen.MessageEn);
    }

    [Fact]
    public async Task AdminCanPauseAndReopenRestaurant()
    {
        var adminClient = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "System Admin");

        var getResponse = await adminClient.GetAsync("/api/management/restaurant/status");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var control = await getResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(control);

        var pauseRequest = new UpdateRestaurantControlRequest(
            AcceptingOrders: false,
            PauseMessageAr: "صيانة طارئة",
            PauseMessageEn: "Emergency maintenance",
            RowVersion: control.RowVersion);

        var pauseResponse = await adminClient.PutAsJsonAsync("/api/management/restaurant/status", pauseRequest);
        Assert.Equal(HttpStatusCode.OK, pauseResponse.StatusCode);

        var paused = await pauseResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(paused);
        Assert.False(paused.AcceptingOrders);
        Assert.Equal("System Admin", paused.UpdatedByStaffDisplayName);
    }

    [Fact]
    public async Task ForbiddenRolesAndUnauthenticatedCannotMutateStatus()
    {
        var updateRequest = new UpdateRestaurantControlRequest(
            AcceptingOrders: false,
            PauseMessageAr: "مغلق",
            PauseMessageEn: "Closed",
            RowVersion: string.Empty);

        // 1. Unauthenticated
        var unauthenticatedResponse = await anonymousClient.PutAsJsonAsync("/api/management/restaurant/status", updateRequest);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticatedResponse.StatusCode);

        // 2. Kitchen role
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen-staff@bab-al-hara.local",
            "Kitchen",
            "Chef Ali");
        var kitchenResponse = await kitchenClient.PutAsJsonAsync("/api/management/restaurant/status", updateRequest);
        Assert.Equal(HttpStatusCode.Forbidden, kitchenResponse.StatusCode);

        // 3. Cashier role
        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier-staff@bab-al-hara.local",
            "Cashier",
            "Cashier Mona");
        var cashierResponse = await cashierClient.PutAsJsonAsync("/api/management/restaurant/status", updateRequest);
        Assert.Equal(HttpStatusCode.Forbidden, cashierResponse.StatusCode);

        // 4. Driver role
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver-staff@bab-al-hara.local",
            "Driver",
            "Driver Tarek");
        var driverResponse = await driverClient.PutAsJsonAsync("/api/management/restaurant/status", updateRequest);
        Assert.Equal(HttpStatusCode.Forbidden, driverResponse.StatusCode);
    }

    [Fact]
    public async Task PublicStatusExposesCustomerSafeFieldsOnly()
    {
        var response = await anonymousClient.GetAsync("/api/restaurant/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var rawJson = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(rawJson);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("acceptingOrders", out _));
        Assert.True(root.TryGetProperty("messageAr", out _));
        Assert.True(root.TryGetProperty("messageEn", out _));

        Assert.False(root.TryGetProperty("id", out _));
        Assert.False(root.TryGetProperty("rowVersion", out _));
        Assert.False(root.TryGetProperty("updatedByStaffDisplayName", out _));
        Assert.False(root.TryGetProperty("updatedAtUtc", out _));
    }

    [Fact]
    public async Task OrderSucceedsWhenAcceptingOrdersIsTrue()
    {
        var orderResponse = await PostOrderAsync(TakeawayRequest());
        Assert.Equal(HttpStatusCode.Created, orderResponse.StatusCode);

        await using var dbContext = factory.CreateDbContext();
        var persistedCount = await dbContext.Orders.CountAsync();
        Assert.Equal(1, persistedCount);
    }

    [Fact]
    public async Task OrderIsRejectedWhenAcceptingOrdersIsFalseAndNoOrderPersisted()
    {
        // 1. Manager pauses restaurant
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Ashraf");

        var getResponse = await managerClient.GetAsync("/api/management/restaurant/status");
        var control = await getResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(control);

        var pauseResponse = await managerClient.PutAsJsonAsync(
            "/api/management/restaurant/status",
            new UpdateRestaurantControlRequest(false, "مغلق للصلاة", "Closed for prayer", control.RowVersion));
        Assert.Equal(HttpStatusCode.OK, pauseResponse.StatusCode);

        // 2. Customer attempts to place an order
        var orderResponse = await PostOrderAsync(TakeawayRequest());
        Assert.Equal(HttpStatusCode.Conflict, orderResponse.StatusCode);

        var problem = await orderResponse.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("restaurant_not_accepting_orders", problem.Extensions["code"]?.ToString());

        // 3. Verify no order is persisted in DB
        await using var dbContext = factory.CreateDbContext();
        var persistedCount = await dbContext.Orders.CountAsync();
        Assert.Equal(0, persistedCount);
    }

    [Fact]
    public async Task ReopeningRestoresOrderAcceptanceImmediately()
    {
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Ashraf");

        var getResponse = await managerClient.GetAsync("/api/management/restaurant/status");
        var control = await getResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(control);

        // Pause
        var pauseResponse = await managerClient.PutAsJsonAsync(
            "/api/management/restaurant/status",
            new UpdateRestaurantControlRequest(false, "مغلق مؤقتا", "Temporarily closed", control.RowVersion));
        Assert.Equal(HttpStatusCode.OK, pauseResponse.StatusCode);
        var pausedDto = await pauseResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(pausedDto);

        // Attempt order while paused -> fails
        var failedOrderResponse = await PostOrderAsync(TakeawayRequest());
        Assert.Equal(HttpStatusCode.Conflict, failedOrderResponse.StatusCode);

        // Reopen
        var reopenResponse = await managerClient.PutAsJsonAsync(
            "/api/management/restaurant/status",
            new UpdateRestaurantControlRequest(true, null, null, pausedDto.RowVersion));
        Assert.Equal(HttpStatusCode.OK, reopenResponse.StatusCode);

        // Attempt order after reopening -> succeeds
        var successOrderResponse = await PostOrderAsync(TakeawayRequest());
        Assert.Equal(HttpStatusCode.Created, successOrderResponse.StatusCode);

        await using var dbContext = factory.CreateDbContext();
        var persistedCount = await dbContext.Orders.CountAsync();
        Assert.Equal(1, persistedCount);
    }

    [Fact]
    public async Task OptimisticConcurrencyConflictOnStaleRowVersion()
    {
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Ashraf");

        var adminClient = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "System Admin");

        // 1. Manager reads initial RowVersion A
        var getResponse = await managerClient.GetAsync("/api/management/restaurant/status");
        var controlA = await getResponse.Content.ReadFromJsonAsync<RestaurantControlDto>(JsonOptions);
        Assert.NotNull(controlA);

        // 2. Admin modifies status, updating RowVersion to B
        var adminUpdateResponse = await adminClient.PutAsJsonAsync(
            "/api/management/restaurant/status",
            new UpdateRestaurantControlRequest(false, "صيانة", "Maintenance", controlA.RowVersion));
        Assert.Equal(HttpStatusCode.OK, adminUpdateResponse.StatusCode);

        // 3. Manager tries to update using stale RowVersion A
        var managerStaleUpdateResponse = await managerClient.PutAsJsonAsync(
            "/api/management/restaurant/status",
            new UpdateRestaurantControlRequest(true, null, null, controlA.RowVersion));

        Assert.Equal(HttpStatusCode.Conflict, managerStaleUpdateResponse.StatusCode);
        var problem = await managerStaleUpdateResponse.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Equal("Concurrency Conflict", problem.Title);
    }

    private async Task<HttpResponseMessage> PostOrderAsync(object payload)
    {
        var csrfResponse = await anonymousClient.GetFromJsonAsync<AntiforgeryTokenDto>("/api/security/csrf");
        var csrfToken = csrfResponse?.RequestToken ?? string.Empty;

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(payload),
        };
        request.Headers.Add("X-XSRF-TOKEN", csrfToken);
        return await anonymousClient.SendAsync(request);
    }

    private static object TakeawayRequest() =>
        new
        {
            customerName = "أحمد محمود",
            customerPhone = "01012345678",
            orderType = "Takeaway",
            items = new[]
            {
                new { menuItemId = OrderingApiFactory.ActiveItemId, quantity = 1 }
            }
        };

    private sealed record AntiforgeryTokenDto(string RequestToken);
}
