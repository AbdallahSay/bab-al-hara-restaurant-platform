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
                table.HasCheckConstraint(
                    "CK_MenuItems_DisplayOrder",
                    "[DisplayOrder] >= 0");
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
        builder.Property(item => item.DisplayOrder).HasDefaultValue(0).IsRequired();
        builder.Property(item => item.IsActive).IsRequired();
        builder.Property(item => item.IsAvailable).IsRequired();
        builder.Property(item => item.RowVersion).IsRowVersion();
        builder.HasIndex(item => new { item.CategoryId, item.IsActive, item.IsAvailable });
        builder
            .HasOne(item => item.Category)
            .WithMany(category => category.MenuItems)
            .HasForeignKey(item => item.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasData(
            new { Id = new Guid("20000000-0000-0000-0000-000000000001"), CategoryId = new Guid("10000000-0000-0000-0000-000000000001"), NameAr = "مشكل مشاوي باب الحارة", NameEn = "Bab Al Hara mixed grill", DescriptionAr = "كفتة وكباب وشيش طاووق مع خضار مشوية.", DescriptionEn = "Kofta, kebab, and shish tawook with grilled vegetables.", Price = 295m, ImageReference = "/images/menu/mixed-grill.webp", PreparationMinutes = 28, DisplayOrder = 10, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000002"), CategoryId = new Guid("10000000-0000-0000-0000-000000000001"), NameAr = "نصف فرخة مشوية", NameEn = "Half grilled chicken", DescriptionAr = "دجاج متبل على الفحم مع ثومية ومخلل.", DescriptionEn = "Charcoal-grilled marinated chicken with garlic sauce and pickles.", Price = 180m, ImageReference = "/images/menu/grilled-chicken.webp", PreparationMinutes = 25, DisplayOrder = 20, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000003"), CategoryId = new Guid("10000000-0000-0000-0000-000000000002"), NameAr = "سندوتش كفتة", NameEn = "Kofta sandwich", DescriptionAr = "كفتة مشوية في عيش بلدي مع طحينة وسلطة.", DescriptionEn = "Grilled kofta in baladi bread with tahini and salad.", Price = 85m, ImageReference = "/images/menu/kofta-sandwich.webp", PreparationMinutes = 14, DisplayOrder = 10, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000004"), CategoryId = new Guid("10000000-0000-0000-0000-000000000002"), NameAr = "سندوتش شيش طاووق", NameEn = "Shish tawook sandwich", DescriptionAr = "شيش طاووق مشوي مع ثومية وخيار مخلل.", DescriptionEn = "Grilled shish tawook with garlic sauce and pickled cucumber.", Price = 78m, ImageReference = "/images/menu/shish-sandwich.webp", PreparationMinutes = 14, DisplayOrder = 20, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000005"), CategoryId = new Guid("10000000-0000-0000-0000-000000000003"), NameAr = "حمص بالطحينة", NameEn = "Hummus", DescriptionAr = "حمص كريمي بزيت الزيتون والبابريكا.", DescriptionEn = "Creamy hummus finished with olive oil and paprika.", Price = 48m, ImageReference = "/images/menu/hummus.webp", PreparationMinutes = 6, DisplayOrder = 10, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000006"), CategoryId = new Guid("10000000-0000-0000-0000-000000000003"), NameAr = "فتوش", NameEn = "Fattoush", DescriptionAr = "خضار طازجة وخبز محمص بدبس الرمان.", DescriptionEn = "Fresh vegetables and toasted bread with pomegranate molasses.", Price = 55m, ImageReference = "/images/menu/fattoush.webp", PreparationMinutes = 8, DisplayOrder = 20, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000007"), CategoryId = new Guid("10000000-0000-0000-0000-000000000004"), NameAr = "ليمون بالنعناع", NameEn = "Mint lemonade", DescriptionAr = "ليمون طازج ونعناع محضر عند الطلب.", DescriptionEn = "Fresh lemon and mint, blended to order.", Price = 42m, ImageReference = "/images/menu/mint-lemonade.webp", PreparationMinutes = 5, DisplayOrder = 10, IsActive = true, IsAvailable = true },
            new { Id = new Guid("20000000-0000-0000-0000-000000000008"), CategoryId = new Guid("10000000-0000-0000-0000-000000000004"), NameAr = "تمر هندي", NameEn = "Tamarind", DescriptionAr = "مشروب تمر هندي شرقي بارد.", DescriptionEn = "Chilled traditional tamarind drink.", Price = 35m, ImageReference = "/images/menu/tamarind.webp", PreparationMinutes = 3, DisplayOrder = 20, IsActive = true, IsAvailable = false });
    }
}
