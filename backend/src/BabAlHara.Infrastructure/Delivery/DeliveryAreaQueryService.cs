using BabAlHara.Application.Delivery;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Delivery;

public sealed class DeliveryAreaQueryService(AppDbContext dbContext) : IDeliveryAreaQueryService
{
    public async Task<IReadOnlyList<DeliveryAreaDto>> GetActiveAsync(
        CancellationToken cancellationToken) =>
        await dbContext.DeliveryAreas
            .AsNoTracking()
            .Where(area => area.IsActive)
            .OrderBy(area => area.NameEn)
            .Select(area => new DeliveryAreaDto(
                area.Id,
                area.NameAr,
                area.NameEn,
                area.DeliveryFee,
                area.EstimatedDeliveryMinutes))
            .ToListAsync(cancellationToken);
}
