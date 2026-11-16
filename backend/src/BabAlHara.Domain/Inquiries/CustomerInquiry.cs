namespace BabAlHara.Domain.Inquiries;

public sealed class CustomerInquiry
{
    public Guid Id { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string ContactInfo { get; private set; } = string.Empty;

    public string? Subject { get; private set; }

    public string Message { get; private set; } = string.Empty;

    public InquiryStatus Status { get; private set; } = InquiryStatus.New;

    public DateTimeOffset? ReviewedAtUtc { get; private set; }

    public Guid? ReviewedByStaffId { get; private set; }

    public string? StaffNotes { get; private set; }

    private CustomerInquiry()
    {
    }

    public CustomerInquiry(
        Guid id,
        DateTimeOffset createdAtUtc,
        string name,
        string contactInfo,
        string? subject,
        string message)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(contactInfo);
        ArgumentException.ThrowIfNullOrWhiteSpace(message);

        Id = id;
        CreatedAtUtc = createdAtUtc;
        Name = name.Trim();
        ContactInfo = contactInfo.Trim();
        Subject = string.IsNullOrWhiteSpace(subject) ? null : subject.Trim();
        Message = message.Trim();
        Status = InquiryStatus.New;
    }

    public void MarkReviewed(Guid staffId, DateTimeOffset reviewedAtUtc, string? notes = null)
    {
        ReviewedByStaffId = staffId;
        ReviewedAtUtc = reviewedAtUtc;
        Status = InquiryStatus.Read;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            StaffNotes = notes.Trim();
        }
    }

    public void UpdateStatus(InquiryStatus status, Guid staffId, DateTimeOffset timestampUtc, string? notes = null)
    {
        Status = status;
        ReviewedByStaffId = staffId;
        ReviewedAtUtc = timestampUtc;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            StaffNotes = notes.Trim();
        }
    }
}
