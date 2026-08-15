using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Ordering;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable(
            "OrderItems",
            table =>
            {
                table.HasCheckConstraint("CK_OrderItems_Quantity", "[Quantity] BETWEEN 1 AND 99");
                table.HasCheckConstraint("CK_OrderItems_UnitPrice", "[UnitPrice] >= 0");
                table.HasCheckConstraint(
                    "CK_OrderItems_LineTotal",
                    "[LineTotal] = [UnitPrice] * [Quantity]");
            });
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).ValueGeneratedNever();
        builder.Property(item => item.ProductNameAr).HasMaxLength(160).IsRequired();
        builder.Property(item => item.ProductNameEn).HasMaxLength(160).IsRequired();
        builder.Property(item => item.Quantity).IsRequired();
        builder.Property(item => item.UnitPrice).HasPrecision(18, 2).IsRequired();
        builder.Property(item => item.LineTotal).HasPrecision(18, 2).IsRequired();
        builder.HasIndex(item => item.OrderId);
        builder
            .HasOne<MenuItem>()
            .WithMany()
            .HasForeignKey(item => item.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
