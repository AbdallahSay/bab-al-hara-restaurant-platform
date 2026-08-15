using BabAlHara.Domain.Delivery;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class DeliveryAreaConfiguration : IEntityTypeConfiguration<DeliveryArea>
{
    public void Configure(EntityTypeBuilder<DeliveryArea> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable(
            "DeliveryAreas",
            table =>
            {
                table.HasCheckConstraint("CK_DeliveryAreas_DeliveryFee", "[DeliveryFee] >= 0");
                table.HasCheckConstraint(
                    "CK_DeliveryAreas_EstimatedDeliveryMinutes",
                    "[EstimatedDeliveryMinutes] BETWEEN 1 AND 480");
            });
        builder.HasKey(area => area.Id);
        builder.Property(area => area.Id).ValueGeneratedNever();
        builder.Property(area => area.NameAr).HasMaxLength(120).IsRequired();
        builder.Property(area => area.NameEn).HasMaxLength(120).IsRequired();
        builder.Property(area => area.DeliveryFee).HasPrecision(18, 2).IsRequired();
        builder.Property(area => area.EstimatedDeliveryMinutes).IsRequired();
        builder.Property(area => area.IsActive).IsRequired();
        builder.HasIndex(area => new { area.IsActive, area.NameEn });
    }
}
