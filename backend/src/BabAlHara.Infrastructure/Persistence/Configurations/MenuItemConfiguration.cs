using BabAlHara.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable(
            "MenuItems",
            table =>
            {
                table.HasCheckConstraint("CK_MenuItems_Price", "[Price] >= 0");
                table.HasCheckConstraint(
                    "CK_MenuItems_PreparationMinutes",
                    "[PreparationMinutes] BETWEEN 1 AND 240");
            });
        builder.HasKey(item => item.Id);
        builder.Property(item => item.Id).ValueGeneratedNever();
        builder.Property(item => item.NameAr).HasMaxLength(160).IsRequired();
        builder.Property(item => item.NameEn).HasMaxLength(160).IsRequired();
        builder.Property(item => item.DescriptionAr).HasMaxLength(600).IsRequired();
        builder.Property(item => item.DescriptionEn).HasMaxLength(600).IsRequired();
        builder.Property(item => item.Price).HasPrecision(18, 2).IsRequired();
        builder.Property(item => item.ImageReference).HasMaxLength(240).IsRequired();
        builder.Property(item => item.PreparationMinutes).IsRequired();
        builder.Property(item => item.IsActive).IsRequired();
        builder.Property(item => item.IsAvailable).IsRequired();
        builder.HasIndex(item => new { item.CategoryId, item.IsActive, item.IsAvailable });
        builder
            .HasOne(item => item.Category)
            .WithMany(category => category.MenuItems)
            .HasForeignKey(item => item.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
