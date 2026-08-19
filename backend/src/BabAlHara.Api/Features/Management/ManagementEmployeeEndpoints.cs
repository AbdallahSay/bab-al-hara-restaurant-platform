using System;
using System.Security.Claims;
using BabAlHara.Application.Employees;
using BabAlHara.Application.Exceptions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace BabAlHara.Api.Features.Management;

public static class ManagementEmployeeEndpoints
{
    public static IEndpointRouteBuilder MapManagementEmployeeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/management/employees")
            .RequireAuthorization(BabAlHara.Api.Platform.Security.AuthorizationPolicies.Management);

        group.MapGet("", async (IEmployeeManagementService service, HttpContext context) =>
        {
            var ct = context.RequestAborted;
            var employees = await service.GetAllAsync(ct);
            return Results.Ok(employees);
        });

        group.MapGet("/{id:guid}", async (Guid id, IEmployeeManagementService service, HttpContext context) =>
        {
            var ct = context.RequestAborted;
            var employee = await service.GetByIdAsync(id, ct);
            return employee is not null ? Results.Ok(employee) : Results.NotFound();
        });

        group.MapPost("", async ([FromBody] CreateEmployeeRequest request, IEmployeeManagementService service, HttpContext context) =>
        {
            var ct = context.RequestAborted;
            var actorId = GetActorId(context);
            try
            {
                var employee = await service.CreateAsync(request, actorId, ct);
                return Results.Created($"/api/management/employees/{employee.Id}", employee);
            }
            catch (ForbiddenException)
            {
                return Results.Forbid();
            }
            catch (ArgumentException ex)
            {
                return Results.UnprocessableEntity(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.UnprocessableEntity(new { message = ex.Message });
            }
        })
        .WithMetadata(new Microsoft.AspNetCore.Antiforgery.RequireAntiforgeryTokenAttribute(true));

        group.MapPut("/{id:guid}", async (Guid id, [FromBody] UpdateEmployeeRequest request, IEmployeeManagementService service, HttpContext context) =>
        {
            var ct = context.RequestAborted;
            var actorId = GetActorId(context);
            try
            {
                var employee = await service.UpdateAsync(id, request, actorId, ct);
                return Results.Ok(employee);
            }
            catch (ForbiddenException)
            {
                return Results.Forbid();
            }
            catch (ArgumentException)
            {
                return Results.NotFound();
            }
            catch (InvalidOperationException ex) when (ex.Message == "stale_conflict")
            {
                return Results.Conflict(new { code = "stale_conflict" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.UnprocessableEntity(new { message = ex.Message });
            }
        })
        .WithMetadata(new Microsoft.AspNetCore.Antiforgery.RequireAntiforgeryTokenAttribute(true));

        group.MapPatch("/{id:guid}/status", async (Guid id, [FromBody] SetEmployeeStatusRequest request, IEmployeeManagementService service, HttpContext context) =>
        {
            var ct = context.RequestAborted;
            var actorId = GetActorId(context);
            try
            {
                await service.SetStatusAsync(id, request.IsActive, request.ConcurrencyToken, actorId, ct);
                return Results.NoContent();
            }
            catch (ForbiddenException)
            {
                return Results.Forbid();
            }
            catch (ArgumentException)
            {
                return Results.NotFound();
            }
            catch (InvalidOperationException ex) when (ex.Message == "stale_conflict")
            {
                return Results.Conflict(new { code = "stale_conflict" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { message = ex.Message }); // e.g. last management account
            }
        })
        .WithMetadata(new Microsoft.AspNetCore.Antiforgery.RequireAntiforgeryTokenAttribute(true));

        group.MapPost("/{id:guid}/reset-password", async (Guid id, [FromBody] ResetEmployeePasswordRequest request, IEmployeeManagementService service, HttpContext context) =>
        {
            var ct = context.RequestAborted;
            var actorId = GetActorId(context);
            try
            {
                await service.ResetPasswordAsync(id, request, actorId, ct);
                return Results.NoContent();
            }
            catch (ForbiddenException)
            {
                return Results.Forbid();
            }
            catch (ArgumentException)
            {
                return Results.NotFound();
            }
            catch (InvalidOperationException ex) when (ex.Message == "stale_conflict")
            {
                return Results.Conflict(new { code = "stale_conflict" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.UnprocessableEntity(new { message = ex.Message });
            }
        })
        .WithMetadata(new Microsoft.AspNetCore.Antiforgery.RequireAntiforgeryTokenAttribute(true));

        return app;
    }

    private static Guid GetActorId(HttpContext context)
    {
        var idClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
    }
}
