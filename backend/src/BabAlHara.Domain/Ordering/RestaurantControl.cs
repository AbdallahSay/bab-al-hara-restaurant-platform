namespace BabAlHara.Domain.Ordering;

public sealed class RestaurantControl
{
    public static readonly Guid SingletonId = new("30000000-0000-0000-0000-000000000001");

    public Guid Id { get; private set; }

    public bool AcceptingOrders { get; private set; }

    public string? PauseMessageAr { get; private set; }

    public string? PauseMessageEn { get; private set; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public string? UpdatedByStaffDisplayName { get; private set; }

    public byte[] RowVersion { get; private set; } = [];

    public RestaurantControl(
        Guid id,
        bool acceptingOrders,
        string? pauseMessageAr,
        string? pauseMessageEn,
        DateTimeOffset updatedAtUtc,
        string? updatedByStaffDisplayName)
    {
        Id = id;
        AcceptingOrders = acceptingOrders;
        PauseMessageAr = pauseMessageAr?.Trim();
        PauseMessageEn = pauseMessageEn?.Trim();
        UpdatedAtUtc = updatedAtUtc;
        UpdatedByStaffDisplayName = updatedByStaffDisplayName?.Trim();
    }

    private RestaurantControl()
    {
    }

    public void UpdateStatus(
        bool acceptingOrders,
        string? pauseMessageAr,
        string? pauseMessageEn,
        string? updatedBy,
        DateTimeOffset now)
    {
        AcceptingOrders = acceptingOrders;
        PauseMessageAr = acceptingOrders ? null : NormalizeMessage(pauseMessageAr);
        PauseMessageEn = acceptingOrders ? null : NormalizeMessage(pauseMessageEn);
        UpdatedByStaffDisplayName = updatedBy?.Trim();
        UpdatedAtUtc = now;
    }

    private static string? NormalizeMessage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length > 300 ? trimmed[..300] : trimmed;
    }
}
