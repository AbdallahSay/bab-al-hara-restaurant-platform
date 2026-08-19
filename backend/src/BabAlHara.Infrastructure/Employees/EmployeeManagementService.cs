using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BabAlHara.Application.Employees;
using BabAlHara.Application.Exceptions;
using BabAlHara.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace BabAlHara.Infrastructure.Employees;

public sealed class EmployeeManagementService(
    UserManager<StaffUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager) : IEmployeeManagementService
{
    private const string KitchenRole = "Kitchen";
    private const string ManagerRole = "Manager";
    private const string AdminRole = "Admin";
    private const string CashierRole = "Cashier";
    private const string DriverRole = "Driver";

    private static readonly string[] ValidRoles = { KitchenRole, ManagerRole, AdminRole, CashierRole, DriverRole };

    public async Task<IReadOnlyList<EmployeeManagementDto>> GetAllAsync(CancellationToken ct)
    {
        var users = await userManager.GetUsersInRoleAsync(KitchenRole);
        var managers = await userManager.GetUsersInRoleAsync(ManagerRole);
        var admins = await userManager.GetUsersInRoleAsync(AdminRole);
        var cashiers = await userManager.GetUsersInRoleAsync(CashierRole);
        var drivers = await userManager.GetUsersInRoleAsync(DriverRole);

        var allUsers = users.Concat(managers).Concat(admins).Concat(cashiers).Concat(drivers).DistinctBy(u => u.Id).ToList();

        var dtos = new List<EmployeeManagementDto>();
        foreach (var user in allUsers)
        {
            var role = (await userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty;
            dtos.Add(MapToDto(user, role, Guid.Empty)); // IsCurrentUser will be set by caller or not needed since we don't have actorId in GetAllAsync according to interface
        }

        return dtos;
    }

    public async Task<EmployeeManagementDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) return null;

        var role = (await userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty;
        return MapToDto(user, role, Guid.Empty);
    }

    public async Task<EmployeeManagementDto> CreateAsync(CreateEmployeeRequest request, Guid actorId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 120)
            throw new ArgumentException("Invalid DisplayName");

        if (!ValidRoles.Contains(request.Role))
            throw new ArgumentException("Invalid Role");

        var actor = await userManager.FindByIdAsync(actorId.ToString());
        var actorRole = actor != null ? (await userManager.GetRolesAsync(actor)).FirstOrDefault() : null;
        EnforceCallerCanManageTargetRole(actorRole, request.Role);

        var user = new StaffUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            IsActive = true
        };

        var result = await userManager.CreateAsync(user, request.TemporaryPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Code)));

        if (!await roleManager.RoleExistsAsync(request.Role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid> { Name = request.Role });
        }

        var roleResult = await userManager.AddToRoleAsync(user, request.Role);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            throw new InvalidOperationException("Failed to assign role.");
        }

        return MapToDto(user, request.Role, actorId);
    }

    public async Task<EmployeeManagementDto> UpdateAsync(Guid id, UpdateEmployeeRequest request, Guid actorId, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) throw new ArgumentException("User not found");

        var actor = await userManager.FindByIdAsync(actorId.ToString());
        var actorRole = actor != null ? (await userManager.GetRolesAsync(actor)).FirstOrDefault() : null;

        var currentRole = (await userManager.GetRolesAsync(user)).FirstOrDefault();
        EnforceCallerCanManageTargetRole(actorRole, currentRole);
        if (currentRole != request.Role)
        {
            EnforceCallerCanManageTargetRole(actorRole, request.Role);
        }

        if (user.ConcurrencyStamp != request.ConcurrencyToken)
            throw new InvalidOperationException("stale_conflict");

        bool updateStamp = false;
        if (user.DisplayName != request.DisplayName)
        {
            user.DisplayName = request.DisplayName;
        }

        if (currentRole != request.Role && ValidRoles.Contains(request.Role))
        {
            var roles = await userManager.GetRolesAsync(user);
            await userManager.RemoveFromRolesAsync(user, roles);
            if (!await roleManager.RoleExistsAsync(request.Role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid> { Name = request.Role });
            }
            await userManager.AddToRoleAsync(user, request.Role);
            updateStamp = true;
        }

        if (updateStamp)
        {
            await userManager.UpdateSecurityStampAsync(user);
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "ConcurrencyFailure"))
                throw new InvalidOperationException("stale_conflict");
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Code)));
        }

        var newRole = (await userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty;
        return MapToDto(user, newRole, actorId);
    }

    public async Task SetStatusAsync(Guid id, bool isActive, string concurrencyToken, Guid actorId, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) throw new ArgumentException("User not found");

        if (id == actorId)
            throw new ForbiddenException("Cannot disable self.");

        var actor = await userManager.FindByIdAsync(actorId.ToString());
        var actorRole = actor != null ? (await userManager.GetRolesAsync(actor)).FirstOrDefault() : null;
        var currentRole = (await userManager.GetRolesAsync(user)).FirstOrDefault();
        EnforceCallerCanManageTargetRole(actorRole, currentRole);

        if (!isActive && (currentRole == ManagerRole || currentRole == AdminRole))
        {
            var activeManagers = await userManager.GetUsersInRoleAsync(ManagerRole);
            var activeAdmins = await userManager.GetUsersInRoleAsync(AdminRole);
            var activeManagementCount = activeManagers.Count(u => u.IsActive && u.Id != id)
                                      + activeAdmins.Count(u => u.IsActive && u.Id != id);
            if (activeManagementCount == 0)
                throw new InvalidOperationException("Cannot disable the last active management account.");
        }

        if (user.ConcurrencyStamp != concurrencyToken)
            throw new InvalidOperationException("stale_conflict");

        user.IsActive = isActive;
        if (!isActive)
        {
            await userManager.UpdateSecurityStampAsync(user);
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "ConcurrencyFailure"))
                throw new InvalidOperationException("stale_conflict");
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Code)));
        }
    }

    public async Task ResetPasswordAsync(Guid id, ResetEmployeePasswordRequest request, Guid actorId, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null) throw new ArgumentException("User not found");

        if (id == actorId)
            throw new ForbiddenException("Cannot reset own password via this endpoint.");

        var actor = await userManager.FindByIdAsync(actorId.ToString());
        var actorRole = actor != null ? (await userManager.GetRolesAsync(actor)).FirstOrDefault() : null;
        var currentRole = (await userManager.GetRolesAsync(user)).FirstOrDefault();
        EnforceCallerCanManageTargetRole(actorRole, currentRole);

        if (user.ConcurrencyStamp != request.ConcurrencyToken)
            throw new InvalidOperationException("stale_conflict");

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code == "ConcurrencyFailure"))
                throw new InvalidOperationException("stale_conflict");
            throw new InvalidOperationException(string.Join("; ", result.Errors.Select(e => e.Code)));
        }
    }

    private static void EnforceCallerCanManageTargetRole(string? callerRole, string? targetRole)
    {
        if (callerRole == AdminRole) return;
        if (callerRole != ManagerRole)
            throw new ForbiddenException();
        if (targetRole is ManagerRole or AdminRole)
            throw new ForbiddenException();
    }

    private static EmployeeManagementDto MapToDto(StaffUser user, string role, Guid actorId)
    {
        return new EmployeeManagementDto(
            user.Id,
            user.DisplayName,
            user.Email ?? string.Empty,
            role,
            user.IsActive,
            user.Id == actorId,
            user.ConcurrencyStamp ?? string.Empty
        );
    }
}
