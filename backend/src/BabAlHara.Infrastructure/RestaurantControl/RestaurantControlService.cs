using BabAlHara.Application.RestaurantControl;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.RestaurantControl;

public sealed class RestaurantControlService(
    AppDbContext dbContext,
    TimeProvider timeProvider) : IRestaurantControlService
{
    public async Task<RestaurantPublicStatusResponse> GetPublicStatusAsync(CancellationToken cancellationToken)
    {
        var control = await dbContext.RestaurantControls.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == Domain.Ordering.RestaurantControl.SingletonId, cancellationToken);

        if (control is null)
        {
            return new RestaurantPublicStatusResponse(true, null, null);
        }

        return new RestaurantPublicStatusResponse(
            control.AcceptingOrders,
            control.AcceptingOrders ? null : control.PauseMessageAr,
            control.AcceptingOrders ? null : control.PauseMessageEn);
    }

    public async Task<RestaurantControlDto> GetControlStatusAsync(CancellationToken cancellationToken)
    {
        var control = await EnsureControlEntityAsync(cancellationToken);
        return MapToDto(control);
    }

    public async Task<UpdateRestaurantControlOutcome> UpdateControlStatusAsync(
        UpdateRestaurantControlCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var control = await EnsureControlEntityAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(command.RowVersion))
        {
            try
            {
                var expectedRowVersion = Convert.FromBase64String(command.RowVersion);
                dbContext.Entry(control).Property(c => c.RowVersion).OriginalValue = expectedRowVersion;
            }
            catch (FormatException)
            {
                return new UpdateRestaurantControlOutcome(UpdateRestaurantControlResultStatus.Conflict);
            }
        }

        var now = timeProvider.GetUtcNow();
        control.UpdateStatus(
            command.AcceptingOrders,
            command.PauseMessageAr,
            command.PauseMessageEn,
            command.UpdatedByStaffDisplayName,
            now);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new UpdateRestaurantControlOutcome(UpdateRestaurantControlResultStatus.Conflict);
        }

        return new UpdateRestaurantControlOutcome(UpdateRestaurantControlResultStatus.Success, MapToDto(control));
    }

    private async Task<Domain.Ordering.RestaurantControl> EnsureControlEntityAsync(CancellationToken cancellationToken)
    {
        var control = await dbContext.RestaurantControls
            .SingleOrDefaultAsync(c => c.Id == Domain.Ordering.RestaurantControl.SingletonId, cancellationToken);

        if (control is not null)
        {
            return control;
        }

        var now = timeProvider.GetUtcNow();
        control = new Domain.Ordering.RestaurantControl(
            Domain.Ordering.RestaurantControl.SingletonId,
            acceptingOrders: true,
            pauseMessageAr: null,
            pauseMessageEn: null,
            updatedAtUtc: now,
            updatedByStaffDisplayName: "System");

        dbContext.RestaurantControls.Add(control);
        await dbContext.SaveChangesAsync(cancellationToken);
        return control;
    }

    private static RestaurantControlDto MapToDto(Domain.Ordering.RestaurantControl control) =>
        new(
            control.AcceptingOrders,
            control.PauseMessageAr,
            control.PauseMessageEn,
            control.UpdatedAtUtc,
            control.UpdatedByStaffDisplayName,
            control.RowVersion != null ? Convert.ToBase64String(control.RowVersion) : string.Empty);
}
