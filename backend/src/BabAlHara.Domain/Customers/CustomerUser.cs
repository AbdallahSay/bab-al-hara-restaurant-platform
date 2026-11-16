namespace BabAlHara.Domain.Customers;

public sealed class CustomerUser
{
    public Guid Id { get; private set; }

    public string FullName { get; private set; } = string.Empty;

    public string? Email { get; private set; }

    public string? NormalizedEmail { get; private set; }

    public string? PhoneNumber { get; private set; }

    public string? NormalizedPhone { get; private set; }

    public string PasswordHash { get; private set; } = string.Empty;

    public string SecurityStamp { get; private set; } = string.Empty;

    public string ConcurrencyStamp { get; private set; } = string.Empty;

    public bool IsActive { get; private set; } = true;

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset? LastLoginAtUtc { get; private set; }

    public string? SavedAddress { get; private set; }

    public Guid? PreferredDeliveryAreaId { get; private set; }

    private CustomerUser()
    {
    }

    public CustomerUser(
        Guid id,
        string fullName,
        string? email,
        string? phoneNumber,
        string passwordHash,
        DateTimeOffset createdAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        var trimmedEmail = string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();
        var trimmedPhone = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();

        if (string.IsNullOrWhiteSpace(trimmedEmail) && string.IsNullOrWhiteSpace(trimmedPhone))
        {
            throw new ArgumentException("At least one contact identifier (email or phone) is required.");
        }

        Id = id;
        FullName = fullName.Trim();
        Email = trimmedEmail;
        NormalizedEmail = trimmedEmail?.ToUpperInvariant();
        PhoneNumber = trimmedPhone;
        NormalizedPhone = trimmedPhone is not null ? NormalizePhone(trimmedPhone) : null;
        PasswordHash = passwordHash;
        SecurityStamp = Guid.NewGuid().ToString("N");
        ConcurrencyStamp = Guid.NewGuid().ToString("N");
        IsActive = true;
        CreatedAtUtc = createdAtUtc;
    }

    public void UpdateProfile(string fullName, string? phoneNumber, string? savedAddress, Guid? preferredDeliveryAreaId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);

        FullName = fullName.Trim();
        var trimmedPhone = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim();
        PhoneNumber = trimmedPhone;
        NormalizedPhone = trimmedPhone is not null ? NormalizePhone(trimmedPhone) : null;
        SavedAddress = string.IsNullOrWhiteSpace(savedAddress) ? null : savedAddress.Trim();
        PreferredDeliveryAreaId = preferredDeliveryAreaId;
        ConcurrencyStamp = Guid.NewGuid().ToString("N");
    }

    public void RecordLogin(DateTimeOffset loginTimeUtc)
    {
        LastLoginAtUtc = loginTimeUtc;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newPasswordHash);
        PasswordHash = newPasswordHash;
        SecurityStamp = Guid.NewGuid().ToString("N");
        ConcurrencyStamp = Guid.NewGuid().ToString("N");
    }

    public void SetActiveStatus(bool isActive)
    {
        IsActive = isActive;
        SecurityStamp = Guid.NewGuid().ToString("N");
        ConcurrencyStamp = Guid.NewGuid().ToString("N");
    }

    public static string NormalizePhone(string phone)
    {
        return new string(phone.Where(char.IsDigit).ToArray());
    }
}
