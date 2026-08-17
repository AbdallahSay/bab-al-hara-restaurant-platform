using BabAlHara.Domain.Ordering;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable(
            "Orders",
            table =>
            {
                table.HasCheckConstraint("CK_Orders_DeliveryFee", "[DeliveryFee] >= 0");
                table.HasCheckConstraint("CK_Orders_Subtotal", "[Subtotal] >= 0");
                table.HasCheckConstraint("CK_Orders_Total", "[Total] = [Subtotal] + [DeliveryFee]");
            });
        builder.HasKey(order => order.Id);
        builder.Property(order => order.Id).ValueGeneratedNever();
        builder.Property(order => order.PublicCode).HasColumnType("varchar(32)").HasMaxLength(32).IsRequired();
        builder.Property(order => order.CreatedAt).IsRequired();
        builder.Property(order => order.OrderType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(order => order.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(order => order.CustomerName).HasMaxLength(120).IsRequired();
        builder.Property(order => order.CustomerPhone).HasColumnType("varchar(20)").HasMaxLength(20).IsRequired();
        builder.Property(order => order.DeliveryAreaNameAr).HasMaxLength(120);
        builder.Property(order => order.DeliveryAreaNameEn).HasMaxLength(120);
        builder.Property(order => order.Address).HasMaxLength(500);
        builder.Property(order => order.DeliveryFee).HasPrecision(18, 2).IsRequired();
        builder.Property(order => order.Subtotal).HasPrecision(18, 2).IsRequired();
        builder.Property(order => order.Total).HasPrecision(18, 2).IsRequired();
        builder.Property(order => order.CustomerNote).HasMaxLength(500);
        builder.Property(order => order.PaymentMethod).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(order => order.PaymentStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(order => order.DriverId);
        builder.Property(order => order.DriverName).HasMaxLength(120);
        builder.Property(order => order.DriverAssignedAtUtc);
        builder.Property(order => order.TrackingTokenHash).HasColumnType("varchar(64)").HasMaxLength(64).IsRequired();
        builder.Property(order => order.TrackingTokenExpiresAtUtc);
        builder.Property(order => order.RowVersion).IsRowVersion();
        builder.HasIndex(order => order.PublicCode).IsUnique();
        builder.HasIndex(order => order.TrackingTokenHash).IsUnique();
        builder.HasIndex(order => order.CreatedAt).IsDescending(true);
        builder.HasIndex(order => new { order.Status, order.CreatedAt }).IsDescending(false, true);
        builder.HasIndex(order => new { order.DriverId, order.Status });
        builder
            .HasOne(order => order.DeliveryArea)
            .WithMany()
            .HasForeignKey(order => order.DeliveryAreaId)
            .OnDelete(DeleteBehavior.Restrict);
        builder
            .HasMany(order => order.Items)
            .WithOne(item => item.Order)
            .HasForeignKey(item => item.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasMany(order => order.StatusHistory)
            .WithOne(history => history.Order)
            .HasForeignKey(history => history.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
