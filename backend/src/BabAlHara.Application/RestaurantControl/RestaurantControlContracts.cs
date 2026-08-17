namespace BabAlHara.Application.RestaurantControl;

public sealed record RestaurantPublicStatusResponse(
    bool AcceptingOrders,
    string? MessageAr,
    string? MessageEn);

public sealed record RestaurantControlDto(
    bool AcceptingOrders,
    string? PauseMessageAr,
    string? PauseMessageEn,
    DateTimeOffset UpdatedAtUtc,
    string? UpdatedByStaffDisplayName,
    string RowVersion);

public sealed record UpdateRestaurantControlRequest(
    bool AcceptingOrders,
    string? PauseMessageAr,
    string? PauseMessageEn,
    string? RowVersion);

public sealed record UpdateRestaurantControlCommand(
    bool AcceptingOrders,
    string? PauseMessageAr,
    string? PauseMessageEn,
    string? RowVersion,
    string? UpdatedByStaffDisplayName);

public enum UpdateRestaurantControlResultStatus
{
    Success,
    Conflict,
}

public sealed record UpdateRestaurantControlOutcome(
    UpdateRestaurantControlResultStatus Status,
    RestaurantControlDto? Control = null);

public interface IRestaurantControlService
{
    Task<RestaurantPublicStatusResponse> GetPublicStatusAsync(CancellationToken cancellationToken);

    Task<RestaurantControlDto> GetControlStatusAsync(CancellationToken cancellationToken);

    Task<UpdateRestaurantControlOutcome> UpdateControlStatusAsync(
        UpdateRestaurantControlCommand command,
        CancellationToken cancellationToken);
}
