using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BabAlHara.Application.Catalog;
using BabAlHara.Application.Ordering;
using BabAlHara.Domain.Ordering;
using Microsoft.AspNetCore.Mvc;

namespace BabAlHara.Api.IntegrationTests;

public sealed class ManagementCatalogApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task AuthorizationOnlyManagerAndAdminCanAccessManagementCatalogOtherRolesForbiddenUnauthUnauthorized()
    {
        await factory.ResetAsync();

        // 1. Unauthenticated -> 401 Unauthorized
        var unauthClient = factory.CreateClient();
        var unauthResp = await unauthClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthResp.StatusCode);

        // 2. Kitchen role -> 403 Forbidden
        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");
        var kitchenResp = await kitchenClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.Forbidden, kitchenResp.StatusCode);

        // 3. Cashier role -> 403 Forbidden
        var cashierClient = await factory.CreateAuthenticatedStaffClientAsync(
            "cashier@bab-al-hara.local",
            "Cashier",
            "Cashier User");
        var cashierResp = await cashierClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.Forbidden, cashierResp.StatusCode);

        // 4. Driver role -> 403 Forbidden
        var driverClient = await factory.CreateAuthenticatedStaffClientAsync(
            "driver@bab-al-hara.local",
            "Driver",
            "Driver User");
        var driverResp = await driverClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.Forbidden, driverResp.StatusCode);

        // 5. Manager role -> 200 OK
        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");
        var managerResp = await managerClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.OK, managerResp.StatusCode);

        // 6. Admin role -> 200 OK
        var adminClient = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "Admin Boss");
        var adminResp = await adminClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.OK, adminResp.StatusCode);
    }

    [Fact]
    public async Task CategoryLifecycleCreateReadUpdateToggleStatusAndOrdering()
    {
        await factory.ResetAsync();

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        // 1. Create Category
        var createRequest = new CreateCategoryRequest("شوربات", "Soups", 5, IsActive: true);
        var createResp = await managerClient.PostAsJsonAsync("/api/management/categories", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var createdCategory = await createResp.Content.ReadFromJsonAsync<CategoryManagementDto>(JsonOptions);
        Assert.NotNull(createdCategory);
        Assert.NotEqual(Guid.Empty, createdCategory.Id);
        Assert.Equal("شوربات", createdCategory.NameAr);
        Assert.Equal("Soups", createdCategory.NameEn);
        Assert.Equal(5, createdCategory.DisplayOrder);
        Assert.True(createdCategory.IsActive);
        Assert.NotNull(createdCategory.RowVersion);

        // 2. Read list and verify ordering
        var listResp = await managerClient.GetAsync("/api/management/categories");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var categories = await listResp.Content.ReadFromJsonAsync<List<CategoryManagementDto>>(JsonOptions);
        Assert.NotNull(categories);
        Assert.Contains(categories, c => c.Id == createdCategory.Id);

        // 3. Read single by ID
        var singleResp = await managerClient.GetAsync($"/api/management/categories/{createdCategory.Id}");
        Assert.Equal(HttpStatusCode.OK, singleResp.StatusCode);
        var fetchedCategory = await singleResp.Content.ReadFromJsonAsync<CategoryManagementDto>(JsonOptions);
        Assert.NotNull(fetchedCategory);
        Assert.Equal(createdCategory.Id, fetchedCategory.Id);
        Assert.Equal(0, fetchedCategory.ItemCount);

        // 4. Update Category
        var updateRequest = new UpdateCategoryRequest(
            "شوربات ساخنة",
            "Hot Soups",
            15,
            IsActive: true,
            RowVersion: fetchedCategory.RowVersion);

        var updateResp = await managerClient.PutAsJsonAsync($"/api/management/categories/{createdCategory.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var updatedCategory = await updateResp.Content.ReadFromJsonAsync<CategoryManagementDto>(JsonOptions);
        Assert.NotNull(updatedCategory);
        Assert.Equal("شوربات ساخنة", updatedCategory.NameAr);
        Assert.Equal("Hot Soups", updatedCategory.NameEn);
        Assert.Equal(15, updatedCategory.DisplayOrder);

        // 5. Toggle Status to Inactive
        var toggleDeactivateResp = await managerClient.PatchAsJsonAsync(
            $"/api/management/categories/{createdCategory.Id}/status",
            new ToggleActiveRequest(false, updatedCategory.RowVersion));
        Assert.Equal(HttpStatusCode.OK, toggleDeactivateResp.StatusCode);
        var deactivated = await toggleDeactivateResp.Content.ReadFromJsonAsync<CategoryManagementDto>(JsonOptions);
        Assert.NotNull(deactivated);
        Assert.False(deactivated.IsActive);

        // 6. Toggle Status back to Active
        var toggleActivateResp = await managerClient.PatchAsJsonAsync(
            $"/api/management/categories/{createdCategory.Id}/status",
            new ToggleActiveRequest(true, deactivated.RowVersion));
        Assert.Equal(HttpStatusCode.OK, toggleActivateResp.StatusCode);
        var activated = await toggleActivateResp.Content.ReadFromJsonAsync<CategoryManagementDto>(JsonOptions);
        Assert.NotNull(activated);
        Assert.True(activated.IsActive);
    }

    [Fact]
    public async Task CategoryValidationErrorsRejectInvalidInputs()
    {
        await factory.ResetAsync();

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        // Empty NameAr
        var badArResp = await managerClient.PostAsJsonAsync(
            "/api/management/categories",
            new CreateCategoryRequest("", "Desserts", 1));
        Assert.Equal(HttpStatusCode.BadRequest, badArResp.StatusCode);
        var p1 = await badArResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.Equal("validation_error", p1?.Extensions["code"]?.ToString());

        // Empty NameEn
        var badEnResp = await managerClient.PostAsJsonAsync(
            "/api/management/categories",
            new CreateCategoryRequest("حلويات", "   ", 1));
        Assert.Equal(HttpStatusCode.BadRequest, badEnResp.StatusCode);

        // Negative Display Order
        var badOrderResp = await managerClient.PostAsJsonAsync(
            "/api/management/categories",
            new CreateCategoryRequest("حلويات", "Desserts", -1));
        Assert.Equal(HttpStatusCode.BadRequest, badOrderResp.StatusCode);
    }

    [Fact]
    public async Task CategoryConcurrencyConflictReturns409StaleConflict()
    {
        await factory.ResetAsync();

        var managerClient1 = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager 1");

        var adminClient2 = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "Admin 2");

        // 1. Get initial Category
        var getResp = await managerClient1.GetAsync($"/api/management/categories/{OrderingApiFactory.ActiveCategoryId}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var initialCat = await getResp.Content.ReadFromJsonAsync<CategoryManagementDto>(JsonOptions);
        var staleRowVersion = initialCat!.RowVersion;

        // 2. Client 2 updates the category first
        var update2Resp = await adminClient2.PutAsJsonAsync(
            $"/api/management/categories/{OrderingApiFactory.ActiveCategoryId}",
            new UpdateCategoryRequest("سندوتشات مميزة", "Special Sandwiches", 1, true, staleRowVersion));
        Assert.Equal(HttpStatusCode.OK, update2Resp.StatusCode);

        // 3. Client 1 tries to update with stale RowVersion -> 409 Conflict
        var conflictResp = await managerClient1.PutAsJsonAsync(
            $"/api/management/categories/{OrderingApiFactory.ActiveCategoryId}",
            new UpdateCategoryRequest("سندوتشات قديمة", "Old Sandwiches", 1, true, staleRowVersion));
        Assert.Equal(HttpStatusCode.Conflict, conflictResp.StatusCode);
        var problem = await conflictResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.Equal("stale_conflict", problem?.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task MenuItemLifecycleCreateReadUpdateToggleAvailabilityToggleStatus()
    {
        await factory.ResetAsync();

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        factory.Notifier.Clear();

        // 1. Create Menu Item
        var createRequest = new CreateMenuItemRequest(
            CategoryId: OrderingApiFactory.ActiveCategoryId,
            NameAr: "شاورما دجاج",
            NameEn: "Chicken Shawarma",
            DescriptionAr: "شاورما دجاج بتتبيلة سورية مع ثومية ومخلل.",
            DescriptionEn: "Syrian spiced chicken shawarma with garlic sauce and pickles.",
            Price: 95m,
            ImageReference: "/images/menu/shawarma.webp",
            PreparationMinutes: 15,
            DisplayOrder: 5,
            IsActive: true,
            IsAvailable: true);

        var createResp = await managerClient.PostAsJsonAsync("/api/management/menu-items", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var createdItem = await createResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        Assert.NotNull(createdItem);
        Assert.NotEqual(Guid.Empty, createdItem.Id);
        Assert.Equal("شاورما دجاج", createdItem.NameAr);
        Assert.Equal(95m, createdItem.Price);
        Assert.Equal(5, createdItem.DisplayOrder);
        Assert.Equal("السندوتشات", createdItem.CategoryNameAr);
        Assert.NotNull(createdItem.RowVersion);

        // 2. Read list by Category
        var listResp = await managerClient.GetAsync($"/api/management/menu-items?categoryId={OrderingApiFactory.ActiveCategoryId}");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
        var items = await listResp.Content.ReadFromJsonAsync<List<MenuItemManagementDto>>(JsonOptions);
        Assert.NotNull(items);
        Assert.Contains(items, i => i.Id == createdItem.Id);

        // 3. Read single by ID
        var singleResp = await managerClient.GetAsync($"/api/management/menu-items/{createdItem.Id}");
        Assert.Equal(HttpStatusCode.OK, singleResp.StatusCode);
        var fetchedItem = await singleResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        Assert.NotNull(fetchedItem);
        Assert.Equal(createdItem.Id, fetchedItem.Id);

        // 4. Update Menu Item
        var updateRequest = new UpdateMenuItemRequest(
            CategoryId: OrderingApiFactory.ActiveCategoryId,
            NameAr: "شاورما دجاج عربي",
            NameEn: "Arabic Chicken Shawarma Platter",
            DescriptionAr: "وجبة شاورما عربي مقطعة مع بطاطس وثومية.",
            DescriptionEn: "Sliced shawarma platter with fries and garlic sauce.",
            Price: 120m,
            ImageReference: "/images/menu/shawarma-platter.webp",
            PreparationMinutes: 18,
            DisplayOrder: 6,
            IsActive: true,
            IsAvailable: true,
            RowVersion: fetchedItem.RowVersion);

        var updateResp = await managerClient.PutAsJsonAsync($"/api/management/menu-items/{createdItem.Id}", updateRequest);
        Assert.Equal(HttpStatusCode.OK, updateResp.StatusCode);
        var updatedItem = await updateResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        Assert.NotNull(updatedItem);
        Assert.Equal("شاورما دجاج عربي", updatedItem.NameAr);
        Assert.Equal(120m, updatedItem.Price);
        Assert.Equal(6, updatedItem.DisplayOrder);

        // 5. Toggle Availability to Sold Out (false) -> Broadcasts SignalR
        var toggleAvailResp = await managerClient.PatchAsJsonAsync(
            $"/api/management/menu-items/{createdItem.Id}/availability",
            new ToggleMenuItemAvailabilityRequest(false, updatedItem.RowVersion));
        Assert.Equal(HttpStatusCode.OK, toggleAvailResp.StatusCode);
        var unavailableItem = await toggleAvailResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        Assert.NotNull(unavailableItem);
        Assert.False(unavailableItem.IsAvailable);

        Assert.Single(factory.Notifier.AvailabilityChanges);
        Assert.Equal(createdItem.Id, factory.Notifier.AvailabilityChanges[0].MenuItemId);
        Assert.False(factory.Notifier.AvailabilityChanges[0].IsAvailable);

        // 6. Toggle Status to Inactive
        var toggleActiveResp = await managerClient.PatchAsJsonAsync(
            $"/api/management/menu-items/{createdItem.Id}/status",
            new ToggleActiveRequest(false, unavailableItem.RowVersion));
        Assert.Equal(HttpStatusCode.OK, toggleActiveResp.StatusCode);
        var inactiveItem = await toggleActiveResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        Assert.NotNull(inactiveItem);
        Assert.False(inactiveItem.IsActive);
    }

    [Fact]
    public async Task MenuItemValidationErrorsRejectInvalidInputs()
    {
        await factory.ResetAsync();

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        // Non-existent Category
        var badCategoryResp = await managerClient.PostAsJsonAsync(
            "/api/management/menu-items",
            new CreateMenuItemRequest(
                Guid.NewGuid(),
                "عصير",
                "Juice",
                "وصف",
                "Desc",
                30m,
                "/img.webp",
                5,
                1));
        Assert.Equal(HttpStatusCode.BadRequest, badCategoryResp.StatusCode);
        var pCat = await badCategoryResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.Equal("category_not_found", pCat?.Extensions["code"]?.ToString());

        // Negative price
        var badPriceResp = await managerClient.PostAsJsonAsync(
            "/api/management/menu-items",
            new CreateMenuItemRequest(
                OrderingApiFactory.ActiveCategoryId,
                "عصير",
                "Juice",
                "وصف",
                "Desc",
                -10m,
                "/img.webp",
                5,
                1));
        Assert.Equal(HttpStatusCode.BadRequest, badPriceResp.StatusCode);

        // Invalid preparation minutes (> 240)
        var badPrepResp = await managerClient.PostAsJsonAsync(
            "/api/management/menu-items",
            new CreateMenuItemRequest(
                OrderingApiFactory.ActiveCategoryId,
                "عصير",
                "Juice",
                "وصف",
                "Desc",
                30m,
                "/img.webp",
                300,
                1));
        Assert.Equal(HttpStatusCode.BadRequest, badPrepResp.StatusCode);

        // Invalid preparation minutes (< 1)
        var badPrepZeroResp = await managerClient.PostAsJsonAsync(
            "/api/management/menu-items",
            new CreateMenuItemRequest(
                OrderingApiFactory.ActiveCategoryId,
                "عصير",
                "Juice",
                "وصف",
                "Desc",
                30m,
                "/img.webp",
                0,
                1));
        Assert.Equal(HttpStatusCode.BadRequest, badPrepZeroResp.StatusCode);

        // Negative display order
        var badOrderResp = await managerClient.PostAsJsonAsync(
            "/api/management/menu-items",
            new CreateMenuItemRequest(
                OrderingApiFactory.ActiveCategoryId,
                "عصير",
                "Juice",
                "وصف",
                "Desc",
                30m,
                "/img.webp",
                5,
                -1));
        Assert.Equal(HttpStatusCode.BadRequest, badOrderResp.StatusCode);
    }

    [Fact]
    public async Task MenuItemConcurrencyConflictReturns409StaleConflict()
    {
        await factory.ResetAsync();

        var managerClient1 = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager 1");

        var adminClient2 = await factory.CreateAuthenticatedStaffClientAsync(
            "admin@bab-al-hara.local",
            "Admin",
            "Admin 2");

        // 1. Get initial Menu Item
        var getResp = await managerClient1.GetAsync($"/api/management/menu-items/{OrderingApiFactory.ActiveItemId}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var initialItem = await getResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        var staleRowVersion = initialItem!.RowVersion;

        // 2. Client 2 updates the item first
        var update2Resp = await adminClient2.PutAsJsonAsync(
            $"/api/management/menu-items/{OrderingApiFactory.ActiveItemId}",
            new UpdateMenuItemRequest(
                initialItem.CategoryId,
                initialItem.NameAr,
                initialItem.NameEn,
                initialItem.DescriptionAr,
                initialItem.DescriptionEn,
                100m,
                initialItem.ImageReference,
                initialItem.PreparationMinutes,
                initialItem.DisplayOrder,
                true,
                true,
                staleRowVersion));
        Assert.Equal(HttpStatusCode.OK, update2Resp.StatusCode);

        // 3. Client 1 tries to update with stale RowVersion -> 409 Conflict
        var conflictResp = await managerClient1.PutAsJsonAsync(
            $"/api/management/menu-items/{OrderingApiFactory.ActiveItemId}",
            new UpdateMenuItemRequest(
                initialItem.CategoryId,
                initialItem.NameAr,
                initialItem.NameEn,
                initialItem.DescriptionAr,
                initialItem.DescriptionEn,
                110m,
                initialItem.ImageReference,
                initialItem.PreparationMinutes,
                initialItem.DisplayOrder,
                true,
                true,
                staleRowVersion));
        Assert.Equal(HttpStatusCode.Conflict, conflictResp.StatusCode);
        var problem = await conflictResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.Equal("stale_conflict", problem?.Extensions["code"]?.ToString());
    }

    [Fact]
    public async Task MenuItemAvailabilityToggleBroadcastsSignalRAndSyncsWithKitchenAndCustomerMenu()
    {
        await factory.ResetAsync();
        var itemId = OrderingApiFactory.ActiveItemId;

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        var kitchenClient = await factory.CreateAuthenticatedStaffClientAsync(
            "kitchen@bab-al-hara.local",
            "Kitchen",
            "Kitchen Chef");

        var publicClient = factory.CreateClient();

        factory.Notifier.Clear();

        // 1. Management toggles availability to false
        var toggleOffResp = await managerClient.PatchAsJsonAsync(
            $"/api/management/menu-items/{itemId}/availability",
            new ToggleMenuItemAvailabilityRequest(false, null));
        Assert.Equal(HttpStatusCode.OK, toggleOffResp.StatusCode);

        // Verify SignalR event received
        Assert.Single(factory.Notifier.AvailabilityChanges);
        Assert.Equal(itemId, factory.Notifier.AvailabilityChanges[0].MenuItemId);
        Assert.False(factory.Notifier.AvailabilityChanges[0].IsAvailable);

        // Verify public menu reflection
        var menuResp = await publicClient.GetAsync("/api/menu/items");
        var menuItems = await menuResp.Content.ReadFromJsonAsync<List<MenuItemDto>>(JsonOptions);
        var item = menuItems!.First(i => i.Id == itemId);
        Assert.False(item.IsAvailable);

        // 2. Kitchen toggles availability back to true (using the same authoritative field)
        var toggleOnResp = await kitchenClient.PostAsJsonAsync(
            $"/api/kitchen/menu-items/{itemId}/availability",
            new { isAvailable = true });
        Assert.Equal(HttpStatusCode.OK, toggleOnResp.StatusCode);

        // Verify public menu reflection
        var menuResp2 = await publicClient.GetAsync("/api/menu/items");
        var menuItems2 = await menuResp2.Content.ReadFromJsonAsync<List<MenuItemDto>>(JsonOptions);
        var item2 = menuItems2!.First(i => i.Id == itemId);
        Assert.True(item2.IsAvailable);

        // Verify management item reflection
        var mgmtResp = await managerClient.GetAsync($"/api/management/menu-items/{itemId}");
        var mgmtItem = await mgmtResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);
        Assert.True(mgmtItem!.IsAvailable);
    }

    [Fact]
    public async Task OrderingRejectionInactiveOrUnavailableItemsBlockedByServer()
    {
        await factory.ResetAsync();

        var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager Zaid");

        var customerClient = factory.CreateClient();
        var csrfResponse = await customerClient.GetFromJsonAsync<AntiforgeryTokenDto>("/api/security/csrf");
        var csrfToken = csrfResponse?.RequestToken ?? string.Empty;
        customerClient.DefaultRequestHeaders.Add("X-XSRF-TOKEN", csrfToken);

        // 1. Manager deactivates an active item
        var getResp = await managerClient.GetAsync($"/api/management/menu-items/{OrderingApiFactory.ActiveItemId}");
        var activeItem = await getResp.Content.ReadFromJsonAsync<MenuItemManagementDto>(JsonOptions);

        var deactivateResp = await managerClient.PatchAsJsonAsync(
            $"/api/management/menu-items/{OrderingApiFactory.ActiveItemId}/status",
            new ToggleActiveRequest(false, activeItem!.RowVersion));
        Assert.Equal(HttpStatusCode.OK, deactivateResp.StatusCode);

        // 2. Customer tries to place order with this inactive item -> 409 inactive_menu_item
        var orderWithInactiveResp = await customerClient.PostAsJsonAsync(
            "/api/orders",
            new CreateOrderRequest(
                CustomerName: "Customer A",
                CustomerPhone: "01012345678",
                OrderType: OrderType.Takeaway,
                DeliveryAreaId: null,
                Address: null,
                CustomerNote: null,
                Items: [new CreateOrderItemRequest(OrderingApiFactory.ActiveItemId, 1)]));

        Assert.Equal(HttpStatusCode.Conflict, orderWithInactiveResp.StatusCode);
        var inactiveProblem = await orderWithInactiveResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.Equal("inactive_menu_item", inactiveProblem?.Extensions["code"]?.ToString());

        // 3. Customer tries to place order with unavailable item -> 409 unavailable_menu_item
        var orderWithUnavailableResp = await customerClient.PostAsJsonAsync(
            "/api/orders",
            new CreateOrderRequest(
                CustomerName: "Customer B",
                CustomerPhone: "01012345678",
                OrderType: OrderType.Takeaway,
                DeliveryAreaId: null,
                Address: null,
                CustomerNote: null,
                Items: [new CreateOrderItemRequest(OrderingApiFactory.UnavailableItemId, 1)]));

        Assert.Equal(HttpStatusCode.Conflict, orderWithUnavailableResp.StatusCode);
        var unavailProblem = await orderWithUnavailableResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.Equal("unavailable_menu_item", unavailProblem?.Extensions["code"]?.ToString());
    }

    private sealed record AntiforgeryTokenDto(string RequestToken);

    private sealed record CreateOrderItemRequest(Guid MenuItemId, int Quantity);

    private sealed record CreateOrderRequest(
        string CustomerName,
        string CustomerPhone,
        OrderType OrderType,
        Guid? DeliveryAreaId,
        string? Address,
        string? CustomerNote,
        IReadOnlyList<CreateOrderItemRequest> Items);
}
