using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace BabAlHara.Application.Employees;

public sealed record EmployeeManagementDto(
    Guid Id,
    string DisplayName,
    string Email,
    string Role,
    bool IsActive,
    bool IsCurrentUser,
    string ConcurrencyToken
);

public sealed record CreateEmployeeRequest(
    string DisplayName,
    string Email,
    string Role,
    string TemporaryPassword
);

public sealed record UpdateEmployeeRequest(
    string DisplayName,
    string Role,
    string ConcurrencyToken
);

public sealed record SetEmployeeStatusRequest(
    bool IsActive,
    string ConcurrencyToken
);

public sealed record ResetEmployeePasswordRequest(
    string NewPassword,
    string ConcurrencyToken
);

public interface IEmployeeManagementService
{
    Task<IReadOnlyList<EmployeeManagementDto>> GetAllAsync(CancellationToken ct);
    Task<EmployeeManagementDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<EmployeeManagementDto> CreateAsync(CreateEmployeeRequest request, Guid actorId, CancellationToken ct);
    Task<EmployeeManagementDto> UpdateAsync(Guid id, UpdateEmployeeRequest request, Guid actorId, CancellationToken ct);
    Task SetStatusAsync(Guid id, bool isActive, string concurrencyToken, Guid actorId, CancellationToken ct);
    Task ResetPasswordAsync(Guid id, ResetEmployeePasswordRequest request, Guid actorId, CancellationToken ct);
}
