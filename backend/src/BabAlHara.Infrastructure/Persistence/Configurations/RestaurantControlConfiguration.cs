using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class RestaurantControlConfiguration : IEntityTypeConfiguration<BabAlHara.Domain.Ordering.RestaurantControl>
{
    public void Configure(EntityTypeBuilder<BabAlHara.Domain.Ordering.RestaurantControl> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("RestaurantControl");
        builder.HasKey(control => control.Id);
        builder.Property(control => control.Id).ValueGeneratedNever();
        builder.Property(control => control.AcceptingOrders).IsRequired();
        builder.Property(control => control.PauseMessageAr).HasMaxLength(300);
        builder.Property(control => control.PauseMessageEn).HasMaxLength(300);
        builder.Property(control => control.UpdatedAtUtc).IsRequired();
        builder.Property(control => control.UpdatedByStaffDisplayName).HasMaxLength(120);
        builder.Property(control => control.RowVersion).IsRowVersion();

        builder.HasData(
            new
            {
                Id = BabAlHara.Domain.Ordering.RestaurantControl.SingletonId,
                AcceptingOrders = true,
                PauseMessageAr = (string?)null,
                PauseMessageEn = (string?)null,
                UpdatedAtUtc = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
                UpdatedByStaffDisplayName = (string?)"System"
            });
    }
}
