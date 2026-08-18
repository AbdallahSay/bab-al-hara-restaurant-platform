using BabAlHara.Application.Cashier;
using BabAlHara.Application.Catalog;
using BabAlHara.Application.Delivery;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Ordering;
using BabAlHara.Application.Operations;
using BabAlHara.Application.RestaurantControl;
using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure.Cashier;
using BabAlHara.Infrastructure.Catalog;
using BabAlHara.Infrastructure.Delivery;
using BabAlHara.Infrastructure.Driver;
using BabAlHara.Infrastructure.Identity;
using BabAlHara.Infrastructure.Kitchen;
using BabAlHara.Infrastructure.Operations;
using BabAlHara.Infrastructure.Ordering;
using BabAlHara.Infrastructure.Persistence;
using BabAlHara.Infrastructure.RestaurantControl;
using BabAlHara.Infrastructure.Tracking;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BabAlHara.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString(AppDbContext.ConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{AppDbContext.ConnectionStringName}' is required.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                connectionString,
                sqlServer =>
                {
                    sqlServer.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    sqlServer.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                }));

        services
            .AddIdentityCore<StaffUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 12;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();
        services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();

        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IOrderCodeGenerator, PublicOrderCodeGenerator>();
        services.AddScoped<IMenuQueryService, MenuQueryService>();
        services.AddScoped<IManagementCatalogService, ManagementCatalogService>();
        services.AddScoped<IDeliveryAreaQueryService, DeliveryAreaQueryService>();
        services.AddScoped<IOrderApplicationService, OrderApplicationService>();
        services.AddScoped<IKitchenOrderQueryService, KitchenOrderQueryService>();
        services.AddScoped<IKitchenOrderCommandService, KitchenOrderCommandService>();
        services.AddScoped<ICashierOrderService, CashierApplicationService>();
        services.AddScoped<IDriverOrderService, DriverApplicationService>();
        services.AddScoped<ICustomerOrderTrackingService, CustomerOrderTrackingService>();
        services.AddScoped<IRestaurantControlService, RestaurantControlService>();
        services.AddScoped<IOperationsQueryService, OperationsQueryService>();
        services.AddScoped<DevelopmentDataSeeder>();

        return services;
    }
}
