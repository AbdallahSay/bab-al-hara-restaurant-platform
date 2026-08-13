using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using BabAlHara.Api.Features.Catalog;
using BabAlHara.Api.Features.Kitchen;
using BabAlHara.Api.Features.Ordering;
using BabAlHara.Api.Platform.Errors;
using BabAlHara.Api.Platform.Health;
using BabAlHara.Api.Platform.Observability;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Application.Kitchen;
using BabAlHara.Infrastructure;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    };
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.Configure<JsonOptions>(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddAntiforgery(options => options.HeaderName = "X-XSRF-TOKEN");
builder.Services.AddSignalR().AddJsonProtocol(options =>
    options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSingleton<INewOrderNotifier, SignalRNewOrderNotifier>();
builder.Services
    .AddAuthorizationBuilder()
    .AddPolicy(
        AuthorizationPolicies.Kitchen,
        policy => policy.RequireAuthenticatedUser().RequireRole(DevelopmentDataSeeder.KitchenRole));
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = builder.Environment.IsDevelopment()
        ? "BabAlHara.Staff"
        : "__Host-BabAlHara-Staff";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
    options.Events = new CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        },
        OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        },
    };
});
builder.Services.AddRateLimiter(options =>
{
    var guestOrderPermitLimit = builder.Configuration.GetValue("RateLimiting:GuestOrderPermitLimit", 12);
    var staffSignInPermitLimit = builder.Configuration.GetValue("RateLimiting:StaffSignInPermitLimit", 5);
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(
        "guest-order",
        context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = guestOrderPermitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
    options.AddPolicy(
        "staff-sign-in",
        context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = staffSignInPermitLimit,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true,
            }));
});
builder.Services
    .AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(
        name: "sql-server",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["ready"],
        customTestQuery: async (dbContext, cancellationToken) =>
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(5));
            return await dbContext.Database.CanConnectAsync(timeout.Token);
        });

var app = builder.Build();

if (args.Contains("--seed-data", StringComparer.Ordinal))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("--seed-data can only be used in Development.");
    }

    var kitchenPassword = app.Configuration["DevelopmentSeed:KitchenPassword"];
    if (string.IsNullOrWhiteSpace(kitchenPassword))
    {
        throw new InvalidOperationException(
            "DevelopmentSeed:KitchenPassword must be supplied through an environment variable or user secret.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    var seeder = scope.ServiceProvider.GetRequiredService<DevelopmentDataSeeder>();
    await seeder.SeedAsync(app.Environment.EnvironmentName, kitchenPassword, CancellationToken.None);
    return;
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseExceptionHandler();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.MapHealthChecks(
        "/health/live",
        new HealthCheckOptions
        {
            Predicate = _ => false,
            ResponseWriter = HealthResponseWriter.WriteAsync,
        })
    .WithName("Liveness")
    .WithTags("Health");

app.MapHealthChecks(
        "/health/ready",
        new HealthCheckOptions
        {
            Predicate = registration => registration.Tags.Contains("ready"),
            ResponseWriter = HealthResponseWriter.WriteAsync,
        })
    .WithName("Readiness")
    .WithTags("Health");

app.MapSecurityEndpoints();
app.MapCatalogEndpoints();
app.MapOrderEndpoints();
app.MapKitchenEndpoints();
app.MapHub<KitchenHub>("/hubs/kitchen");

app.Run();

public partial class Program;
