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
