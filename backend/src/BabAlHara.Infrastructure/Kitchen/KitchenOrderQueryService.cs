using BabAlHara.Application.Kitchen;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Kitchen;

public sealed class KitchenOrderQueryService(AppDbContext dbContext) : IKitchenOrderQueryService
{
    public async Task<IReadOnlyList<KitchenOrderDto>> GetActiveAsync(
        CancellationToken cancellationToken) =>
        await dbContext.Orders
            .AsNoTracking()
            .Where(order => order.Status != OrderStatus.Delivered)
            .OrderBy(order => order.CreatedAt)
            .Select(order => new KitchenOrderDto(
                order.PublicCode,
                order.CreatedAt,
                order.OrderType,
                order.Status,
                order.CustomerName,
                order.DeliveryAreaNameAr,
                order.DeliveryAreaNameEn,
                order.Address,
                order.CustomerNote,
                order.Items
                    .OrderBy(item => item.Id)
                    .Select(item => new KitchenOrderItemDto(
                        item.ProductNameAr,
                        item.ProductNameEn,
                        item.Quantity))
                    .ToList()))
            .ToListAsync(cancellationToken);
}
