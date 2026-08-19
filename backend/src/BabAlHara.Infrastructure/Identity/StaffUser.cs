using Microsoft.AspNetCore.Identity;

namespace BabAlHara.Infrastructure.Identity;

public sealed class StaffUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
