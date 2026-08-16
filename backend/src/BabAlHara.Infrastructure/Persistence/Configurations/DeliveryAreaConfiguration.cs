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

        builder.HasData(
            new { Id = new Guid("30000000-0000-0000-0000-000000000001"), NameAr = "مدينة نصر", NameEn = "Nasr City", DeliveryFee = 35m, EstimatedDeliveryMinutes = 45, IsActive = true },
            new { Id = new Guid("30000000-0000-0000-0000-000000000002"), NameAr = "مصر الجديدة", NameEn = "Heliopolis", DeliveryFee = 40m, EstimatedDeliveryMinutes = 50, IsActive = true },
            new { Id = new Guid("30000000-0000-0000-0000-000000000003"), NameAr = "القاهرة الجديدة", NameEn = "New Cairo", DeliveryFee = 55m, EstimatedDeliveryMinutes = 60, IsActive = true });
    }
}
