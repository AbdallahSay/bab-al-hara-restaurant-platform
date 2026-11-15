using System.Net.Http.Json;
using System.Text.Json;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Ordering;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Delivery;
using BabAlHara.Infrastructure.Identity;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace BabAlHara.Api.IntegrationTests;

public sealed class OrderingApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public static readonly Guid ActiveCategoryId = new("50000000-0000-0000-0000-000000000001");
    public static readonly Guid InactiveCategoryId = new("50000000-0000-0000-0000-000000000002");
    public static readonly Guid ActiveItemId = new("51000000-0000-0000-0000-000000000001");
    public static readonly Guid SecondActiveItemId = new("51000000-0000-0000-0000-000000000002");
    public static readonly Guid UnavailableItemId = new("51000000-0000-0000-0000-000000000003");
    public static readonly Guid InactiveItemId = new("51000000-0000-0000-0000-000000000004");
    public static readonly Guid InactiveCategoryItemId = new("51000000-0000-0000-0000-000000000005");
    public static readonly Guid ActiveAreaId = new("52000000-0000-0000-0000-000000000001");
    public static readonly Guid InactiveAreaId = new("52000000-0000-0000-0000-000000000002");

    public const string DefaultPassword = "Password123!@#";

    private readonly string connectionString = CreateConnectionString();
    private readonly SwitchingOrderCodeGenerator orderCodeGenerator = new();

    public RecordingKitchenRealtimeNotifier Notifier { get; } = new();
    public RecordingDriverRealtimeNotifier DriverNotifier { get; } = new();
    public RecordingCustomerOrderTrackingNotifier TrackingNotifier { get; } = new();

    public async Task InitializeAsync()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.MigrateAsync();
        await ResetAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await using var dbContext = CreateDbContext();
        await dbContext.Database.EnsureDeletedAsync();
        await DisposeAsync();
    }

    public async Task ResetAsync()
    {
        Notifier.Clear();
        DriverNotifier.Clear();
        TrackingNotifier.Clear();
        orderCodeGenerator.UseDefault();

        await using var dbContext = CreateDbContext();
        await dbContext.OrderStatusHistories.ExecuteDeleteAsync();
        await dbContext.OrderItems.ExecuteDeleteAsync();
        await dbContext.Orders.ExecuteDeleteAsync();
        await dbContext.MenuItems.ExecuteDeleteAsync();
        await dbContext.Categories.ExecuteDeleteAsync();
        await dbContext.DeliveryAreas.ExecuteDeleteAsync();
        await dbContext.RestaurantControls.ExecuteDeleteAsync();

        dbContext.RestaurantControls.Add(new BabAlHara.Domain.Ordering.RestaurantControl(
            BabAlHara.Domain.Ordering.RestaurantControl.SingletonId,
            acceptingOrders: true,
            pauseMessageAr: null,
            pauseMessageEn: null,
            updatedAtUtc: DateTimeOffset.UtcNow,
            updatedByStaffDisplayName: "System"));

        dbContext.Categories.AddRange(
            new Category(ActiveCategoryId, "السندوتشات", "Sandwiches", 1),
            new Category(InactiveCategoryId, "قديم", "Inactive", 2, isActive: false));
        dbContext.MenuItems.AddRange(
            new MenuItem(
                ActiveItemId,
                ActiveCategoryId,
                "سندوتش كفتة",
                "Kofta sandwich",
                "كفتة مشوية",
                "Grilled kofta",
                85m,
                "/images/menu/kofta-sandwich.webp",
                14),
            new MenuItem(
                SecondActiveItemId,
                ActiveCategoryId,
                "حمص",
                "Hummus",
                "حمص بالطحينة",
                "Creamy hummus",
                48m,
                "/images/menu/hummus.webp",
                6),
            new MenuItem(
                UnavailableItemId,
                ActiveCategoryId,
                "غير متاح",
                "Unavailable",
                "غير متاح",
                "Unavailable",
                50m,
                "/images/menu/hummus.webp",
                6,
                isAvailable: false),
            new MenuItem(
                InactiveItemId,
                ActiveCategoryId,
                "غير نشط",
                "Inactive",
                "غير نشط",
                "Inactive",
                60m,
                "/images/menu/hummus.webp",
                6,
                isActive: false),
            new MenuItem(
                InactiveCategoryItemId,
                InactiveCategoryId,
                "قسم غير نشط",
                "Inactive category",
                "قسم غير نشط",
                "Inactive category",
                70m,
                "/images/menu/hummus.webp",
                6));
        dbContext.DeliveryAreas.AddRange(
            new DeliveryArea(ActiveAreaId, "مدينة نصر", "Nasr City", 35m, 45),
            new DeliveryArea(InactiveAreaId, "منطقة قديمة", "Inactive area", 30m, 45, isActive: false));
        await dbContext.SaveChangesAsync();
    }

    public async Task<StaffUser> EnsureStaffUserAsync(string email, string role, string displayName)
    {
        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<StaffUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role });
        }

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new StaffUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                DisplayName = displayName,
            };
            var createResult = await userManager.CreateAsync(user, DefaultPassword);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException($"Failed to create user {email}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }
        }

        if (!await userManager.IsInRoleAsync(user, role))
        {
            await userManager.AddToRoleAsync(user, role);
        }

        return user;
    }

    public async Task<HttpClient> CreateAuthenticatedStaffClientAsync(string email, string role, string displayName, string? portal = null)
    {
        await EnsureStaffUserAsync(email, role, displayName);

        var client = CreateClient();
        var csrfResponse = await client.GetFromJsonAsync<AntiforgeryTokenDto>("/api/security/csrf");
        var csrfToken = csrfResponse?.RequestToken ?? string.Empty;

        var targetPortal = portal ?? role.ToLowerInvariant() switch
        {
            "kitchen" => "kitchen",
            "cashier" => "cashier",
            "driver" => "driver",
            "manager" => "management",
            "admin" => "management",
            _ => "kitchen"
        };

        var signInMessage = new HttpRequestMessage(HttpMethod.Post, $"/api/staff/session/{targetPortal}")
        {
            Content = JsonContent.Create(new { email, password = DefaultPassword }),
        };
        signInMessage.Headers.Add("X-XSRF-TOKEN", csrfToken);

        var response = await client.SendAsync(signInMessage);
        response.EnsureSuccessStatusCode();

        // Add CSRF token for subsequent requests
        client.DefaultRequestHeaders.Add("X-XSRF-TOKEN", csrfToken);
        return client;
    }

    public void UseFixedOrderCode(string publicCode)
    {
        orderCodeGenerator.UseFixed(publicCode);
    }

    public AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connectionString)
            .Options;
        return new AppDbContext(options);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(Environments.Development);
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?> { ["ConnectionStrings:Database"] = connectionString });
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?> { ["RateLimiting:GuestOrderPermitLimit"] = "1000" });
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?> { ["RateLimiting:StaffSignInPermitLimit"] = "1000" });
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?> { ["RateLimiting:TrackingReadPermitLimit"] = "1000" });
        });
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<IKitchenRealtimeNotifier>();
            services.RemoveAll<INewOrderNotifier>();
            services.RemoveAll<IDriverRealtimeNotifier>();
            services.RemoveAll<ICustomerOrderTrackingNotifier>();
            services.RemoveAll<IOrderCodeGenerator>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
            services.AddSingleton<IKitchenRealtimeNotifier>(Notifier);
            services.AddSingleton<INewOrderNotifier>(Notifier);
            services.AddSingleton<IDriverRealtimeNotifier>(DriverNotifier);
            services.AddSingleton<ICustomerOrderTrackingNotifier>(TrackingNotifier);
            services.AddSingleton<IOrderCodeGenerator>(orderCodeGenerator);
        });
    }

    private static string CreateConnectionString()
    {
        var configured = Environment.GetEnvironmentVariable("BAB_AL_HARA_TEST_SQLSERVER");
        SqlConnectionStringBuilder builder;
        if (!string.IsNullOrWhiteSpace(configured))
        {
            builder = new SqlConnectionStringBuilder(configured);
        }
        else
        {
            var defaultDataSource = CanConnectToDataSource(@".\MSSQLSERVER01")
                ? @".\MSSQLSERVER01"
                : @"(localdb)\MSSQLLocalDB";

            builder = new SqlConnectionStringBuilder
            {
                DataSource = defaultDataSource,
                IntegratedSecurity = true,
                Encrypt = false,
                TrustServerCertificate = true,
            };
        }

        builder.InitialCatalog = $"bab_al_hara_ordering_tests_{Guid.NewGuid():N}";
        builder.ConnectTimeout = 10;
        return builder.ConnectionString;
    }

    private static bool CanConnectToDataSource(string dataSource)
    {
        try
        {
            var testBuilder = new SqlConnectionStringBuilder
            {
                DataSource = dataSource,
                IntegratedSecurity = true,
                Encrypt = false,
                TrustServerCertificate = true,
                ConnectTimeout = 1,
            };
            using var conn = new Microsoft.Data.SqlClient.SqlConnection(testBuilder.ConnectionString);
            conn.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public sealed class RecordingKitchenRealtimeNotifier : IKitchenRealtimeNotifier, INewOrderNotifier
    {
        private readonly List<KitchenOrderDto> orders = [];
        private readonly List<OrderStatusChangedEvent> statusChanges = [];
        private readonly List<MenuItemAvailabilityChangedEvent> availabilityChanges = [];

        public IReadOnlyList<KitchenOrderDto> Orders => orders;
        public IReadOnlyList<OrderStatusChangedEvent> StatusChanges => statusChanges;
        public IReadOnlyList<MenuItemAvailabilityChangedEvent> AvailabilityChanges => availabilityChanges;

        public Task NotifyAsync(KitchenOrderDto order, CancellationToken cancellationToken) =>
            NotifyOrderCreatedAsync(order, cancellationToken);

        public Task NotifyOrderCreatedAsync(KitchenOrderDto order, CancellationToken cancellationToken)
        {
            orders.Add(order);
            return Task.CompletedTask;
        }

        public Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken)
        {
            statusChanges.Add(evt);
            return Task.CompletedTask;
        }

        public Task NotifyMenuItemAvailabilityChangedAsync(MenuItemAvailabilityChangedEvent evt, CancellationToken cancellationToken)
        {
            availabilityChanges.Add(evt);
            return Task.CompletedTask;
        }

        public void Clear()
        {
            orders.Clear();
            statusChanges.Clear();
            availabilityChanges.Clear();
        }
    }

    public sealed class RecordingDriverRealtimeNotifier : IDriverRealtimeNotifier
    {
        private readonly List<DriverAssignedEvent> driverAssignedEvents = [];
        private readonly List<OrderStatusChangedEvent> statusChanges = [];

        public IReadOnlyList<DriverAssignedEvent> DriverAssignedEvents => driverAssignedEvents;
        public IReadOnlyList<OrderStatusChangedEvent> StatusChanges => statusChanges;

        public Task NotifyDriverAssignedAsync(DriverAssignedEvent evt, CancellationToken cancellationToken)
        {
            driverAssignedEvents.Add(evt);
            return Task.CompletedTask;
        }

        public Task NotifyOrderStatusChangedAsync(OrderStatusChangedEvent evt, CancellationToken cancellationToken)
        {
            statusChanges.Add(evt);
            return Task.CompletedTask;
        }

        public void Clear()
        {
            driverAssignedEvents.Clear();
            statusChanges.Clear();
        }
    }

    public sealed class RecordingCustomerOrderTrackingNotifier : ICustomerOrderTrackingNotifier
    {
        private readonly List<string> notifiedCodes = [];

        public IReadOnlyList<string> NotifiedCodes => notifiedCodes;

        public Task NotifyOrderUpdatedAsync(string publicCode, CancellationToken cancellationToken)
        {
            notifiedCodes.Add(publicCode);
            return Task.CompletedTask;
        }

        public void Clear() => notifiedCodes.Clear();
    }

    private sealed class SwitchingOrderCodeGenerator : IOrderCodeGenerator
    {
        private int sequence;
        private string? fixedCode;

        public string Create(DateTimeOffset timestamp) =>
            fixedCode ?? $"BH-TEST-{Interlocked.Increment(ref sequence):D6}";

        public void UseDefault()
        {
            fixedCode = null;
            sequence = 0;
        }

        public void UseFixed(string publicCode) => fixedCode = publicCode;
    }

    private sealed record AntiforgeryTokenDto(string RequestToken);
}
