using System.Security.Claims;
using System.Text.RegularExpressions;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Domain.Customers;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.Features.Customer;

public sealed record RegisterCustomerRequest(string FullName, string PhoneOrEmail, string Password);

public sealed record CustomerSignInRequest(string PhoneOrEmail, string Password, bool RememberMe = true);

public sealed record UpdateCustomerProfileRequest(string FullName, string? PhoneNumber, string? SavedAddress, Guid? PreferredDeliveryAreaId);

public sealed record CustomerSessionResponse(bool IsAuthenticated, Guid? Id, string? FullName, string? Email, string? PhoneNumber);

public sealed record CustomerProfileResponse(Guid Id, string FullName, string? Email, string? PhoneNumber, string? SavedAddress, Guid? PreferredDeliveryAreaId, DateTimeOffset CreatedAtUtc);

public sealed record CustomerOrderSummaryDto(
    string PublicCode,
    DateTimeOffset CreatedAt,
    string Status,
    string OrderType,
    decimal Total,
    int ItemCount,
    string? DeliveryAreaNameAr,
    string? DeliveryAreaNameEn,
    string? Address);

public static class CustomerAuthEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static IEndpointRouteBuilder MapCustomerAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var group = endpoints.MapGroup("/api/customer").WithTags("Customer Account");

        // 1. Session check
        group
            .MapGet(
                "/auth/session",
                async (HttpContext context, AppDbContext dbContext) =>
                {
                    var authResult = await context.AuthenticateAsync(CustomerAuthSchemes.Customer);
                    if (!authResult.Succeeded || authResult.Principal is null)
                    {
                        return Results.Ok(new CustomerSessionResponse(false, null, null, null, null));
                    }

                    var idStr = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(idStr, out var customerId))
                    {
                        return Results.Ok(new CustomerSessionResponse(false, null, null, null, null));
                    }

                    var user = await dbContext.CustomerUsers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == customerId);
                    if (user is null || !user.IsActive)
                    {
                        await context.SignOutAsync(CustomerAuthSchemes.Customer);
                        return Results.Ok(new CustomerSessionResponse(false, null, null, null, null));
                    }

                    return Results.Ok(new CustomerSessionResponse(true, user.Id, user.FullName, user.Email, user.PhoneNumber));
                })
            .WithName("GetCustomerSession")
            .Produces<CustomerSessionResponse>();

        // 2. Register
        group
            .MapPost(
                "/auth/register",
                async (
                    RegisterCustomerRequest request,
                    HttpContext context,
                    AppDbContext dbContext,
                    IPasswordHasher<CustomerUser> passwordHasher,
                    TimeProvider timeProvider,
                    CancellationToken cancellationToken) =>
                {
                    if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length < 2)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "الاسم مطلوب ويجب ألا يقل عن حرفين.");
                    }

                    if (string.IsNullOrWhiteSpace(request.PhoneOrEmail))
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "رقم الهاتف أو البريد الإلكتروني مطلوب.");
                    }

                    if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
                    }

                    var input = request.PhoneOrEmail.Trim();
                    string? email = null;
                    string? phone = null;

                    if (input.Contains('@'))
                    {
                        if (!EmailRegex.IsMatch(input))
                        {
                            return Results.Problem(
                                statusCode: StatusCodes.Status400BadRequest,
                                title: "Validation failed",
                                detail: "البريد الإلكتروني المدخل غير صالح.");
                        }
                        email = input.ToLowerInvariant();
                    }
                    else
                    {
                        var digits = CustomerUser.NormalizePhone(input);
                        if (digits.Length < 8 || digits.Length > 20)
                        {
                            return Results.Problem(
                                statusCode: StatusCodes.Status400BadRequest,
                                title: "Validation failed",
                                detail: "رقم الهاتف المدخل غير صالح.");
                        }
                        phone = input;
                    }

                    // Check duplicate
                    if (email is not null)
                    {
                        var normEmail = email.ToUpperInvariant();
                        var emailExists = await dbContext.CustomerUsers.AnyAsync(c => c.NormalizedEmail == normEmail, cancellationToken);
                        if (emailExists)
                        {
                            return Results.Problem(
                                statusCode: StatusCodes.Status409Conflict,
                                title: "Account conflict",
                                detail: "يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني.");
                        }
                    }

                    if (phone is not null)
                    {
                        var normPhone = CustomerUser.NormalizePhone(phone);
                        var phoneExists = await dbContext.CustomerUsers.AnyAsync(c => c.NormalizedPhone == normPhone, cancellationToken);
                        if (phoneExists)
                        {
                            return Results.Problem(
                                statusCode: StatusCodes.Status409Conflict,
                                title: "Account conflict",
                                detail: "يوجد حساب مسجل بالفعل برقم الهاتف هذا.");
                        }
                    }

                    var customerId = Guid.NewGuid();
                    var now = timeProvider.GetUtcNow();

                    // Temporary user to hash password
                    var tempUser = new CustomerUser(customerId, request.FullName.Trim(), email, phone, "temp_hash", now);
                    var hashedPassword = passwordHasher.HashPassword(tempUser, request.Password);
                    tempUser.UpdatePassword(hashedPassword);

                    dbContext.CustomerUsers.Add(tempUser);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    // Sign in customer
                    var claims = new List<Claim>
                    {
                        new(ClaimTypes.NameIdentifier, tempUser.Id.ToString()),
                        new(ClaimTypes.Name, tempUser.FullName),
                        new(ClaimTypes.Role, "Customer"),
                        new("SecurityStamp", tempUser.SecurityStamp),
                    };

                    if (!string.IsNullOrWhiteSpace(tempUser.Email))
                    {
                        claims.Add(new Claim(ClaimTypes.Email, tempUser.Email));
                    }
                    if (!string.IsNullOrWhiteSpace(tempUser.PhoneNumber))
                    {
                        claims.Add(new Claim(ClaimTypes.MobilePhone, tempUser.PhoneNumber));
                    }

                    var identity = new ClaimsIdentity(claims, CustomerAuthSchemes.Customer);
                    var principal = new ClaimsPrincipal(identity);

                    var authProperties = new AuthenticationProperties
                    {
                        IsPersistent = true,
                        AllowRefresh = true,
                        ExpiresUtc = now.AddDays(30),
                    };

                    await context.SignInAsync(CustomerAuthSchemes.Customer, principal, authProperties);

                    return Results.Created(
                        "/api/customer/profile",
                        new CustomerSessionResponse(true, tempUser.Id, tempUser.FullName, tempUser.Email, tempUser.PhoneNumber));
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireRateLimiting("customer-auth")
            .WithName("RegisterCustomer")
            .Produces<CustomerSessionResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 3. Sign In
        group
            .MapPost(
                "/auth/sign-in",
                async (
                    CustomerSignInRequest request,
                    HttpContext context,
                    AppDbContext dbContext,
                    IPasswordHasher<CustomerUser> passwordHasher,
                    TimeProvider timeProvider,
                    CancellationToken cancellationToken) =>
                {
                    if (string.IsNullOrWhiteSpace(request.PhoneOrEmail) || string.IsNullOrWhiteSpace(request.Password))
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Authentication failed",
                            detail: "بيانات الدخول غير صحيحة.");
                    }

                    var input = request.PhoneOrEmail.Trim();
                    CustomerUser? user = null;

                    if (input.Contains('@'))
                    {
                        var normEmail = input.ToUpperInvariant();
                        user = await dbContext.CustomerUsers.FirstOrDefaultAsync(c => c.NormalizedEmail == normEmail, cancellationToken);
                    }
                    else
                    {
                        var normPhone = CustomerUser.NormalizePhone(input);
                        user = await dbContext.CustomerUsers.FirstOrDefaultAsync(c => c.NormalizedPhone == normPhone, cancellationToken);
                    }

                    if (user is null || !user.IsActive)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Authentication failed",
                            detail: "بيانات الدخول غير صحيحة.");
                    }

                    var verifyResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
                    if (verifyResult == PasswordVerificationResult.Failed)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status401Unauthorized,
                            title: "Authentication failed",
                            detail: "بيانات الدخول غير صحيحة.");
                    }

                    var now = timeProvider.GetUtcNow();
                    user.RecordLogin(now);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    var claims = new List<Claim>
                    {
                        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new(ClaimTypes.Name, user.FullName),
                        new(ClaimTypes.Role, "Customer"),
                        new("SecurityStamp", user.SecurityStamp),
                    };

                    if (!string.IsNullOrWhiteSpace(user.Email))
                    {
                        claims.Add(new Claim(ClaimTypes.Email, user.Email));
                    }
                    if (!string.IsNullOrWhiteSpace(user.PhoneNumber))
                    {
                        claims.Add(new Claim(ClaimTypes.MobilePhone, user.PhoneNumber));
                    }

                    var identity = new ClaimsIdentity(claims, CustomerAuthSchemes.Customer);
                    var principal = new ClaimsPrincipal(identity);

                    var authProperties = new AuthenticationProperties
                    {
                        IsPersistent = request.RememberMe,
                        AllowRefresh = true,
                        ExpiresUtc = request.RememberMe ? now.AddDays(30) : now.AddHours(8),
                    };

                    await context.SignInAsync(CustomerAuthSchemes.Customer, principal, authProperties);

                    return Results.Ok(new CustomerSessionResponse(true, user.Id, user.FullName, user.Email, user.PhoneNumber));
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireRateLimiting("customer-auth")
            .WithName("CustomerSignIn")
            .Produces<CustomerSessionResponse>()
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 4. Sign Out
        group
            .MapPost(
                "/auth/sign-out",
                async (HttpContext context) =>
                {
                    await context.SignOutAsync(CustomerAuthSchemes.Customer);
                    return Results.NoContent();
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .WithName("CustomerSignOut")
            .Produces(StatusCodes.Status204NoContent);

        // 5. Get Profile
        group
            .MapGet(
                "/profile",
                async (HttpContext context, AppDbContext dbContext, CancellationToken cancellationToken) =>
                {
                    var customerId = GetAuthenticatedCustomerId(context);
                    if (!customerId.HasValue)
                    {
                        return Results.Unauthorized();
                    }

                    var user = await dbContext.CustomerUsers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == customerId.Value, cancellationToken);
                    if (user is null || !user.IsActive)
                    {
                        return Results.Unauthorized();
                    }

                    return Results.Ok(new CustomerProfileResponse(
                        user.Id,
                        user.FullName,
                        user.Email,
                        user.PhoneNumber,
                        user.SavedAddress,
                        user.PreferredDeliveryAreaId,
                        user.CreatedAtUtc));
                })
            .RequireAuthorization(AuthorizationPolicies.Customer)
            .WithName("GetCustomerProfile")
            .Produces<CustomerProfileResponse>()
            .Produces(StatusCodes.Status401Unauthorized);

        // 6. Update Profile
        group
            .MapPut(
                "/profile",
                async (
                    UpdateCustomerProfileRequest request,
                    HttpContext context,
                    AppDbContext dbContext,
                    CancellationToken cancellationToken) =>
                {
                    var customerId = GetAuthenticatedCustomerId(context);
                    if (!customerId.HasValue)
                    {
                        return Results.Unauthorized();
                    }

                    if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length < 2)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "الاسم مطلوب ويجب ألا يقل عن حرفين.");
                    }

                    var user = await dbContext.CustomerUsers.FirstOrDefaultAsync(c => c.Id == customerId.Value, cancellationToken);
                    if (user is null || !user.IsActive)
                    {
                        return Results.Unauthorized();
                    }

                    user.UpdateProfile(
                        request.FullName,
                        request.PhoneNumber,
                        request.SavedAddress,
                        request.PreferredDeliveryAreaId);

                    await dbContext.SaveChangesAsync(cancellationToken);

                    return Results.Ok(new CustomerProfileResponse(
                        user.Id,
                        user.FullName,
                        user.Email,
                        user.PhoneNumber,
                        user.SavedAddress,
                        user.PreferredDeliveryAreaId,
                        user.CreatedAtUtc));
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireAuthorization(AuthorizationPolicies.Customer)
            .WithName("UpdateCustomerProfile")
            .Produces<CustomerProfileResponse>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized);

        // 7. Get Customer Orders
        group
            .MapGet(
                "/orders",
                async (HttpContext context, AppDbContext dbContext, CancellationToken cancellationToken) =>
                {
                    var customerId = GetAuthenticatedCustomerId(context);
                    if (!customerId.HasValue)
                    {
                        return Results.Unauthorized();
                    }

                    var orders = await dbContext.Orders
                        .Include(o => o.Items)
                        .AsNoTracking()
                        .Where(o => o.CustomerId == customerId.Value)
                        .OrderByDescending(o => o.CreatedAt)
                        .Select(o => new CustomerOrderSummaryDto(
                            o.PublicCode,
                            o.CreatedAt,
                            o.Status.ToString(),
                            o.OrderType.ToString(),
                            o.Total,
                            o.Items.Count,
                            o.DeliveryAreaNameAr,
                            o.DeliveryAreaNameEn,
                            o.Address))
                        .ToListAsync(cancellationToken);

                    return Results.Ok(orders);
                })
            .RequireAuthorization(AuthorizationPolicies.Customer)
            .WithName("GetCustomerOrders")
            .Produces<List<CustomerOrderSummaryDto>>()
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }

    private static Guid? GetAuthenticatedCustomerId(HttpContext context)
    {
        var idStr = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(idStr, out var id))
        {
            return id;
        }
        return null;
    }
}
