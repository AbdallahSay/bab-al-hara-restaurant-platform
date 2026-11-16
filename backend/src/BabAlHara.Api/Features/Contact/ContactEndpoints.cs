using System.Security.Claims;
using BabAlHara.Api.Platform.Security;
using BabAlHara.Domain.Inquiries;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.Features.Contact;

public sealed record CreateInquiryRequest(string Name, string PhoneOrEmail, string? Subject, string Message);

public sealed record InquiryResponse(Guid Id, DateTimeOffset CreatedAtUtc, string Name, string ContactInfo, string? Subject, string Message, string Status, DateTimeOffset? ReviewedAtUtc, string? StaffNotes);

public sealed record UpdateInquiryStatusRequest(InquiryStatus Status, string? StaffNotes);

public static class ContactEndpoints
{
    public static IEndpointRouteBuilder MapContactEndpoints(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        // Public Contact Submission Endpoint
        endpoints
            .MapPost(
                "/api/contact",
                async (
                    CreateInquiryRequest request,
                    AppDbContext dbContext,
                    TimeProvider timeProvider,
                    ILoggerFactory loggerFactory,
                    CancellationToken cancellationToken) =>
                {
                    var logger = loggerFactory.CreateLogger("BabAlHara.Api.Features.Contact");

                    if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length < 2 || request.Name.Trim().Length > 120)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "الاسم مطلوب ويجب أن يكون بين حرفين و 120 حرفًا.");
                    }

                    if (string.IsNullOrWhiteSpace(request.PhoneOrEmail) || request.PhoneOrEmail.Trim().Length < 5 || request.PhoneOrEmail.Trim().Length > 120)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "بيانات الاتصال (الهاتف أو البريد) مطلوبة وصحيحة.");
                    }

                    if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length < 5 || request.Message.Trim().Length > 2000)
                    {
                        return Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Validation failed",
                            detail: "نص الرسالة مطلوب ويجب ألا يقل عن 5 أحرف ولا يزيد عن 2000 حرف.");
                    }

                    var inquiryId = Guid.NewGuid();
                    var now = timeProvider.GetUtcNow();

                    var inquiry = new CustomerInquiry(
                        inquiryId,
                        now,
                        request.Name.Trim(),
                        request.PhoneOrEmail.Trim(),
                        request.Subject?.Trim(),
                        request.Message.Trim());

                    dbContext.CustomerInquiries.Add(inquiry);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    // Structured logging without exposing PII (do not log Name, Phone/Email, or Message)
                    ContactLogMessages.LogInquiryAccepted(logger, inquiryId);

                    return Results.Created(
                        $"/api/contact/{inquiryId}",
                        new { Id = inquiryId, CreatedAtUtc = now, Success = true });
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireRateLimiting("contact-submit")
            .WithName("SubmitContactInquiry")
            .WithTags("Contact")
            .Produces(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // Management Inquiries Review
        var management = endpoints.MapGroup("/api/management/inquiries").WithTags("Management Inquiries");

        management
            .MapGet(
                "",
                async (
                    InquiryStatus? status,
                    AppDbContext dbContext,
                    CancellationToken cancellationToken) =>
                {
                    var query = dbContext.CustomerInquiries.AsNoTracking();

                    if (status.HasValue)
                    {
                        query = query.Where(i => i.Status == status.Value);
                    }

                    var inquiries = await query
                        .OrderByDescending(i => i.CreatedAtUtc)
                        .Take(100)
                        .Select(i => new InquiryResponse(
                            i.Id,
                            i.CreatedAtUtc,
                            i.Name,
                            i.ContactInfo,
                            i.Subject,
                            i.Message,
                            i.Status.ToString(),
                            i.ReviewedAtUtc,
                            i.StaffNotes))
                        .ToListAsync(cancellationToken);

                    return Results.Ok(inquiries);
                })
            .RequireAuthorization(AuthorizationPolicies.Management)
            .WithName("GetManagementInquiries")
            .Produces<List<InquiryResponse>>()
            .Produces(StatusCodes.Status401Unauthorized);

        management
            .MapPatch(
                "/{id:guid}/status",
                async (
                    Guid id,
                    UpdateInquiryStatusRequest request,
                    HttpContext context,
                    AppDbContext dbContext,
                    TimeProvider timeProvider,
                    CancellationToken cancellationToken) =>
                {
                    var staffIdStr = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
                    var staffId = Guid.TryParse(staffIdStr, out var parsedId) ? parsedId : Guid.Empty;

                    var inquiry = await dbContext.CustomerInquiries.FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
                    if (inquiry is null)
                    {
                        return Results.NotFound();
                    }

                    var now = timeProvider.GetUtcNow();
                    inquiry.UpdateStatus(request.Status, staffId, now, request.StaffNotes);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    return Results.Ok(new InquiryResponse(
                        inquiry.Id,
                        inquiry.CreatedAtUtc,
                        inquiry.Name,
                        inquiry.ContactInfo,
                        inquiry.Subject,
                        inquiry.Message,
                        inquiry.Status.ToString(),
                        inquiry.ReviewedAtUtc,
                        inquiry.StaffNotes));
                })
            .WithMetadata(new RequireAntiforgeryTokenAttribute(true))
            .RequireAuthorization(AuthorizationPolicies.Management)
            .WithName("UpdateManagementInquiryStatus")
            .Produces<InquiryResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized);

        return endpoints;
    }
}

internal static partial class ContactLogMessages
{
    [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "New customer inquiry accepted durably with ID {InquiryId}")]
    public static partial void LogInquiryAccepted(ILogger logger, Guid inquiryId);
}
