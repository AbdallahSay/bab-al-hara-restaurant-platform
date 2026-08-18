using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BabAlHara.Api.Features.Cashier;
using BabAlHara.Api.Features.Catalog;
using BabAlHara.Api.Features.Driver;
using BabAlHara.Api.Features.Kitchen;
using BabAlHara.Api.Features.Operations;
using BabAlHara.Api.Features.OrderTracking;
using BabAlHara.Api.Features.Ordering;
using BabAlHara.Api.Features.RestaurantControl;
using BabAlHara.Api.Platform.Errors;
using BabAlHara.Api.Platform.Health;
using BabAlHara.Api.Platform.Observability;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Cashier;
using BabAlHara.Application.Driver;
using BabAlHara.Application.Kitchen;
using BabAlHara.Application.Operations;
using BabAlHara.Application.Tracking;
using BabAlHara.Infrastructure;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

//
// Logging
//

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

//
// Problem Details / Global Errors
//

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] =
            context.HttpContext.TraceIdentifier;
    };
});

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

//
// OpenAPI
//

builder.Services.AddOpenApi();

//
// Infrastructure / EF Core / Identity / SQL Server
//

builder.Services.AddInfrastructure(builder.Configuration);

//
// JSON
//

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter());
});

//
// Antiforgery
//

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
});

//
// SignalR
//

builder.Services
    .AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

builder.Services.AddSingleton<SignalRKitchenRealtimeNotifier>();
builder.Services.AddSingleton<IKitchenRealtimeNotifier>(sp =>
    sp.GetRequiredService<SignalRKitchenRealtimeNotifier>());
builder.Services.AddSingleton<INewOrderNotifier>(sp =>
    sp.GetRequiredService<SignalRKitchenRealtimeNotifier>());
builder.Services.AddSingleton<ICashierOrderCompletedNotifier, SignalRCashierNotifier>();

builder.Services.AddSingleton<SignalRDriverRealtimeNotifier>();
builder.Services.AddSingleton<IDriverRealtimeNotifier>(sp =>
    sp.GetRequiredService<SignalRDriverRealtimeNotifier>());

builder.Services.AddSingleton<SignalROperationsRealtimeNotifier>();
builder.Services.AddSingleton<IOperationsRealtimeNotifier>(sp =>
    sp.GetRequiredService<SignalROperationsRealtimeNotifier>());

builder.Services.AddScoped<ICustomerOrderTrackingNotifier, SignalRCustomerOrderTrackingNotifier>();

//
// Authorization
//

builder.Services
    .AddAuthorizationBuilder()
    .AddPolicy(
        AuthorizationPolicies.Kitchen,
        policy =>
            policy
                .AddAuthenticationSchemes(StaffAuthSchemes.All)
                .RequireAuthenticatedUser()
                .RequireRole(
                    DevelopmentDataSeeder.KitchenRole,
                    DevelopmentDataSeeder.ManagerRole,
                    DevelopmentDataSeeder.AdminRole))
    .AddPolicy(
        AuthorizationPolicies.Cashier,
        policy =>
            policy
                .AddAuthenticationSchemes(StaffAuthSchemes.All)
                .RequireAuthenticatedUser()
                .RequireRole(
                    DevelopmentDataSeeder.CashierRole,
                    DevelopmentDataSeeder.ManagerRole,
                    DevelopmentDataSeeder.AdminRole))
    .AddPolicy(
        AuthorizationPolicies.Driver,
        policy =>
            policy
                .AddAuthenticationSchemes(StaffAuthSchemes.All)
                .RequireAuthenticatedUser()
                .RequireRole(
                    DevelopmentDataSeeder.DriverRole,
                    DevelopmentDataSeeder.ManagerRole,
                    DevelopmentDataSeeder.AdminRole))
    .AddPolicy(
        AuthorizationPolicies.Management,
        policy =>
            policy
                .AddAuthenticationSchemes(StaffAuthSchemes.All)
                .RequireAuthenticatedUser()
                .RequireRole(
                    DevelopmentDataSeeder.ManagerRole,
                    DevelopmentDataSeeder.AdminRole));

//
// Staff Authentication Cookie Schemes
//

void ConfigureStaffCookieOptions(
    CookieAuthenticationOptions options,
    string devName,
    string prodName)
{
    options.Cookie.Name = builder.Environment.IsDevelopment()
        ? devName
        : prodName;

    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.Path = "/";
    options.Cookie.Domain = null;

    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;

    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.Events = new CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            context.Response.StatusCode =
                StatusCodes.Status401Unauthorized;

            return Task.CompletedTask;
        },

        OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode =
                StatusCodes.Status403Forbidden;

            return Task.CompletedTask;
        },
    };
}

builder.Services
    .AddAuthentication()
    .AddCookie(
        StaffAuthSchemes.Kitchen,
        options => ConfigureStaffCookieOptions(
            options,
            "BabAlHara.Kitchen.Auth",
            "__Host-BabAlHara-Kitchen"))
    .AddCookie(
        StaffAuthSchemes.Cashier,
        options => ConfigureStaffCookieOptions(
            options,
            "BabAlHara.Cashier.Auth",
            "__Host-BabAlHara-Cashier"))
    .AddCookie(
        StaffAuthSchemes.Driver,
        options => ConfigureStaffCookieOptions(
            options,
            "BabAlHara.Driver.Auth",
            "__Host-BabAlHara-Driver"))
    .AddCookie(
        StaffAuthSchemes.Management,
        options => ConfigureStaffCookieOptions(
            options,
            "BabAlHara.Management.Auth",
            "__Host-BabAlHara-Management"));

builder.Services.ConfigureApplicationCookie(options =>
{
    ConfigureStaffCookieOptions(
        options,
        "BabAlHara.Staff",
        "__Host-BabAlHara-Staff");
});

//
// Rate Limiting
//

builder.Services.AddRateLimiter(options =>
{
    var guestOrderPermitLimit =
        builder.Configuration.GetValue(
            "RateLimiting:GuestOrderPermitLimit",
            12);

    var staffSignInPermitLimit =
        builder.Configuration.GetValue(
            "RateLimiting:StaffSignInPermitLimit",
            5);

    options.RejectionStatusCode =
        StatusCodes.Status429TooManyRequests;

    options.AddPolicy(
        "guest-order",
        context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = guestOrderPermitLimit,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true,
                }));

    options.AddPolicy(
        "staff-sign-in",
        context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = staffSignInPermitLimit,
                    Window = TimeSpan.FromMinutes(5),
                    QueueLimit = 0,
                    AutoReplenishment = true,
                }));

    var trackingReadPermitLimit =
        builder.Configuration.GetValue(
            "RateLimiting:TrackingReadPermitLimit",
            20);

    options.AddPolicy(
        "tracking-read",
        context =>
            RateLimitPartition.GetSlidingWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = trackingReadPermitLimit,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 4,
                    QueueLimit = 0,
                    AutoReplenishment = true,
                }));
});

//
// Health Checks
//

builder.Services
    .AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(
        name: "sql-server",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["ready"],
        customTestQuery: async (
            dbContext,
            cancellationToken) =>
        {
            using var timeout =
                CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken);

            timeout.CancelAfter(TimeSpan.FromSeconds(5));

            return await dbContext.Database.CanConnectAsync(
                timeout.Token);
        });

//
// Build Application
//

var app = builder.Build();

//
// Development Seed Command
//

if (args.Contains("--seed-data", StringComparer.Ordinal))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "--seed-data can only be used in Development.");
    }

    var kitchenPassword =
        app.Configuration["DevelopmentSeed:KitchenPassword"];

    if (string.IsNullOrWhiteSpace(kitchenPassword))
    {
        throw new InvalidOperationException(
            "DevelopmentSeed:KitchenPassword must be supplied " +
            "through an environment variable or user secret.");
    }

    await using var scope =
        app.Services.CreateAsyncScope();

    var seeder =
        scope.ServiceProvider
            .GetRequiredService<DevelopmentDataSeeder>();

    await seeder.SeedAsync(
        app.Environment.EnvironmentName,
        kitchenPassword,
        CancellationToken.None);

    return;
}

//
// Request Pipeline
//

app.UseMiddleware<CorrelationIdMiddleware>();

app.UseExceptionHandler();

//
// Production Security
//

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

//
// Angular Static Files
//
// GitHub Actions copies Angular production output
// into the ASP.NET Core publish/wwwroot directory.
//

app.UseStaticFiles();

//
// Rate Limiting / Authentication / Authorization
//

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.UseAntiforgery();

//
// Development OpenAPI
//

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//
// Health Endpoints
//

app.MapHealthChecks(
        "/health/live",
        new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter =
                HealthResponseWriter.WriteAsync,
        })
    .WithName("Liveness")
    .WithTags("Health");

app.MapHealthChecks(
        "/health/ready",
        new HealthCheckOptions
        {
            Predicate = registration =>
                registration.Tags.Contains("ready"),
            ResponseWriter =
                HealthResponseWriter.WriteAsync,
        })
    .WithName("Readiness")
    .WithTags("Health");

//
// API Endpoints
//

app.MapSecurityEndpoints();

app.MapCatalogEndpoints();

app.MapManagementCatalogEndpoints();

app.MapOrderEndpoints();

app.MapKitchenEndpoints();

app.MapCashierEndpoints();
app.MapDriverEndpoints();
app.MapOperationsEndpoints();

app.MapOrderTrackingEndpoints();
app.MapRestaurantControlEndpoints();

//
// SignalR
//

app.MapHub<KitchenHub>("/hubs/kitchen");
app.MapHub<CashierHub>("/hubs/cashier");

app.MapHub<DriverHub>("/hubs/driver");

app.MapHub<OperationsHub>("/hubs/operations");

app.MapHub<OrderTrackingHub>("/hubs/order-tracking");

//
// Angular SPA Fallback
//
// Handles:
// /
// /cart
// /checkout
// /order-confirmed
// /kitchen
// /kitchen/sign-in
// /cashier
// /cashier/sign-in
//
// But API, SignalR and health routes must remain real
// backend routes and return 404 when no endpoint exists.
//

app.MapFallback(async context =>
{
    var path = context.Request.Path;

    if (path.StartsWithSegments("/api")
        || path.StartsWithSegments("/hubs")
        || path.StartsWithSegments("/health"))
    {
        context.Response.StatusCode =
            StatusCodes.Status404NotFound;

        return;
    }

    var webRoot =
        app.Environment.WebRootPath
        ?? Path.Combine(
            app.Environment.ContentRootPath,
            "wwwroot");

    var indexPath =
        Path.Combine(
            webRoot,
            "index.html");

    if (!File.Exists(indexPath))
    {
        context.Response.StatusCode =
            StatusCodes.Status404NotFound;

        return;
    }

    context.Response.ContentType =
        "text/html; charset=utf-8";

    await context.Response.SendFileAsync(indexPath);
});

//
// Start
//

app.Run();

public partial class Program;
