using System.Security.Cryptography;
using System.Text;
using BabAlHara.Application.Tracking;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Tracking;

public sealed class CustomerOrderTrackingService(AppDbContext dbContext) : ICustomerOrderTrackingService
{
    public string GenerateTrackingToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64UrlTextEncoder.Encode(bytes);
    }

    public string HashToken(string rawToken)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public async Task<CustomerOrderTrackingDto?> GetTrackingDataAsync(string publicCode, string rawToken, CancellationToken cancellationToken)
    {
        var hash = HashToken(rawToken);

        var order = await dbContext.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusHistory)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.PublicCode == publicCode && o.TrackingTokenHash == hash, cancellationToken);

        if (order is null)
        {
            return null;
        }

        if (order.TrackingTokenExpiresAtUtc.HasValue && order.TrackingTokenExpiresAtUtc.Value <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        return MapToDto(order);
    }

    public async Task<ReorderPreviewDto?> GetReorderPreviewAsync(string publicCode, string rawToken, CancellationToken cancellationToken)
    {
        var hash = HashToken(rawToken);

        var order = await dbContext.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.PublicCode == publicCode && o.TrackingTokenHash == hash, cancellationToken);

        if (order is null)
        {
            return null;
        }

        if (order.TrackingTokenExpiresAtUtc.HasValue && order.TrackingTokenExpiresAtUtc.Value <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        var menuItemIds = order.Items.Select(i => i.MenuItemId).Distinct().ToList();

        var catalogItems = await dbContext.MenuItems
            .Include(m => m.Category)
            .AsNoTracking()
            .Where(m => menuItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, cancellationToken);

        var eligibleItems = new List<ReorderEligibleItemDto>();
        var unavailableItems = new List<ReorderUnavailableItemDto>();

        foreach (var item in order.Items)
        {
            if (!catalogItems.TryGetValue(item.MenuItemId, out var menuItem))
            {
                unavailableItems.Add(new ReorderUnavailableItemDto(
                    item.MenuItemId,
                    item.ProductNameAr,
                    item.ProductNameEn,
                    "NotFound"));
            }
            else if (!menuItem.IsActive || (menuItem.Category is not null && !menuItem.Category.IsActive))
            {
                unavailableItems.Add(new ReorderUnavailableItemDto(
                    menuItem.Id,
                    item.ProductNameAr,
                    item.ProductNameEn,
                    "Inactive"));
            }
            else if (!menuItem.IsAvailable)
            {
                unavailableItems.Add(new ReorderUnavailableItemDto(
                    menuItem.Id,
                    item.ProductNameAr,
                    item.ProductNameEn,
                    "SoldOut"));
            }
            else
            {
                eligibleItems.Add(new ReorderEligibleItemDto(
                    menuItem.Id,
                    menuItem.NameAr,
                    menuItem.NameEn,
                    menuItem.ImageReference,
                    item.Quantity,
                    menuItem.Price));
            }
        }

        Guid? suggestedDeliveryAreaId = null;
        string? suggestedDeliveryAreaNameAr = null;
        string? suggestedDeliveryAreaNameEn = null;
        string? suggestedAddress = null;

        if (order.OrderType == OrderType.Delivery)
        {
            suggestedAddress = order.Address;
            if (order.DeliveryAreaId.HasValue)
            {
                var deliveryArea = await dbContext.DeliveryAreas
                    .AsNoTracking()
                    .FirstOrDefaultAsync(da => da.Id == order.DeliveryAreaId.Value, cancellationToken);

                if (deliveryArea is not null && deliveryArea.IsActive)
                {
                    suggestedDeliveryAreaId = deliveryArea.Id;
                    suggestedDeliveryAreaNameAr = deliveryArea.NameAr;
                    suggestedDeliveryAreaNameEn = deliveryArea.NameEn;
                }
                else
                {
                    suggestedDeliveryAreaId = null;
                    suggestedDeliveryAreaNameAr = order.DeliveryAreaNameAr;
                    suggestedDeliveryAreaNameEn = order.DeliveryAreaNameEn;
                }
            }
            else
            {
                suggestedDeliveryAreaNameAr = order.DeliveryAreaNameAr;
                suggestedDeliveryAreaNameEn = order.DeliveryAreaNameEn;
            }
        }

        return new ReorderPreviewDto(
            order.PublicCode,
            order.OrderType.ToString(),
            eligibleItems,
            unavailableItems,
            suggestedDeliveryAreaId,
            suggestedDeliveryAreaNameAr,
            suggestedDeliveryAreaNameEn,
            suggestedAddress,
            order.CustomerNote);
    }

    public static CustomerOrderTrackingDto MapToDto(Order order)
    {
        var items = order.Items.Select(i => new CustomerOrderItemDto(
            i.ProductNameAr,
            i.ProductNameEn,
            i.Quantity,
            i.UnitPrice,
            i.LineTotal
        )).ToList();

        var timeline = order.StatusHistory
            .OrderBy(h => h.ChangedAtUtc)
            .Select(h => new CustomerTimelineEntryDto(
                h.NewStatus.ToString(),
                h.ChangedAtUtc
            )).ToList();

        var lastUpdatedAt = timeline.Count > 0 ? timeline[^1].ChangedAt : order.CreatedAt;

        return new CustomerOrderTrackingDto(
            order.PublicCode,
            order.Status.ToString(),
            order.OrderType.ToString(),
            order.CreatedAt,
            lastUpdatedAt,
            items,
            order.Subtotal,
            order.DeliveryFee,
            order.Total,
            order.PaymentMethod.ToString(),
            order.PaymentStatus.ToString(),
            order.DeliveryAreaNameAr,
            order.DeliveryAreaNameEn,
            order.Address,
            timeline
        );
    }
}
