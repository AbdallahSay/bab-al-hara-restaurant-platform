using BabAlHara.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("Categories", table =>
            table.HasCheckConstraint("CK_Categories_DisplayOrder", "[DisplayOrder] >= 0"));
        builder.HasKey(category => category.Id);
        builder.Property(category => category.Id).ValueGeneratedNever();
        builder.Property(category => category.NameAr).HasMaxLength(120).IsRequired();
        builder.Property(category => category.NameEn).HasMaxLength(120).IsRequired();
        builder.Property(category => category.DisplayOrder).IsRequired();
        builder.Property(category => category.IsActive).IsRequired();
        builder.HasIndex(category => new { category.IsActive, category.DisplayOrder });

        builder.HasData(
            new { Id = new Guid("10000000-0000-0000-0000-000000000001"), NameAr = "المشاوي", NameEn = "Grills", DisplayOrder = 10, IsActive = true },
            new { Id = new Guid("10000000-0000-0000-0000-000000000002"), NameAr = "السندوتشات", NameEn = "Sandwiches", DisplayOrder = 20, IsActive = true },
            new { Id = new Guid("10000000-0000-0000-0000-000000000003"), NameAr = "المقبلات", NameEn = "Sides", DisplayOrder = 30, IsActive = true },
            new { Id = new Guid("10000000-0000-0000-0000-000000000004"), NameAr = "المشروبات", NameEn = "Drinks", DisplayOrder = 40, IsActive = true });
    }
}
