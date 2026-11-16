using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using BabAlHara.Api.Features.Contact;
using BabAlHara.Domain.Inquiries;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Api.IntegrationTests;

[Collection("Sequential")]
public sealed class ContactApiTests(OrderingApiFactory factory) : IClassFixture<OrderingApiFactory>, IAsyncLifetime
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Task InitializeAsync() => factory.ResetAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private static async Task<string> GetCsrfTokenAsync(HttpClient client)
    {
        using var tokenResponse = await client.GetAsync("/api/security/csrf");
        tokenResponse.EnsureSuccessStatusCode();
        using var tokenDocument = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync());
        return tokenDocument.RootElement.GetProperty("requestToken").GetString()!;
    }

    [Fact]
    public async Task SubmitContactInquiryWithValidDataReturns201CreatedAndPersists()
    {
        using var client = factory.CreateClient();
        var csrf = await GetCsrfTokenAsync(client);

        var request = new CreateInquiryRequest("طارق محمود", "01012345678", "استفسار بخصوص الحجز", "هل يتوفر حجز لطاولة عائلية مساء الجمعة؟");
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/contact")
        {
            Content = JsonContent.Create(request),
        };
        message.Headers.Add("X-XSRF-TOKEN", csrf);

        var response = await client.SendAsync(message);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using var dbContext = factory.CreateDbContext();
        var inquiry = await dbContext.CustomerInquiries.FirstOrDefaultAsync(i => i.Name == "طارق محمود");
        Assert.NotNull(inquiry);
        Assert.Equal("01012345678", inquiry.ContactInfo);
        Assert.Equal("استفسار بخصوص الحجز", inquiry.Subject);
        Assert.Equal(InquiryStatus.New, inquiry.Status);
    }

    [Fact]
    public async Task SubmitContactInquiryWithInvalidDataReturns400BadRequest()
    {
        using var client = factory.CreateClient();
        var csrf = await GetCsrfTokenAsync(client);

        var request = new CreateInquiryRequest("", "", null, "");
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/contact")
        {
            Content = JsonContent.Create(request),
        };
        message.Headers.Add("X-XSRF-TOKEN", csrf);

        var response = await client.SendAsync(message);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ManagementInquiriesRequiresManagementAuthorization()
    {
        using var client = factory.CreateClient();

        // 1. Unauthenticated request should be 401
        var unauthResponse = await client.GetAsync("/api/management/inquiries");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthResponse.StatusCode);

        // 2. Authenticate as Manager
        using var managerClient = await factory.CreateAuthenticatedStaffClientAsync(
            "manager@bab-al-hara.local",
            "Manager",
            "Manager User",
            "management");

        // 3. Submit an inquiry
        await using (var dbContext = factory.CreateDbContext())
        {
            dbContext.CustomerInquiries.Add(new CustomerInquiry(
                Guid.NewGuid(),
                DateTimeOffset.UtcNow,
                "عميل تجريبي",
                "01099998888",
                "طلب رعاية",
                "استفسار بخصوص خدمة الحفلات والمناسبات."));
            await dbContext.SaveChangesAsync();
        }

        // 4. Authorized manager retrieves inquiries
        var response = await managerClient.GetAsync("/api/management/inquiries");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var inquiries = await response.Content.ReadFromJsonAsync<List<InquiryResponse>>(JsonOptions);
        Assert.NotNull(inquiries);
        Assert.NotEmpty(inquiries);
        Assert.Equal("عميل تجريبي", inquiries[0].Name);

        // 5. Manager updates inquiry status to Read
        var csrf = await GetCsrfTokenAsync(managerClient);
        var updateRequest = new UpdateInquiryStatusRequest(InquiryStatus.Read, "تم التواصل هاتفياً");
        using var patchMsg = new HttpRequestMessage(HttpMethod.Patch, $"/api/management/inquiries/{inquiries[0].Id}/status")
        {
            Content = JsonContent.Create(updateRequest),
        };
        patchMsg.Headers.Add("X-XSRF-TOKEN", csrf);
        var patchRes = await managerClient.SendAsync(patchMsg);

        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);
        var updated = await patchRes.Content.ReadFromJsonAsync<InquiryResponse>(JsonOptions);
        Assert.NotNull(updated);
        Assert.Equal("Read", updated.Status);
        Assert.Equal("تم التواصل هاتفياً", updated.StaffNotes);
    }
}
