using BabAlHara.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class MenuImageAssetConfiguration : IEntityTypeConfiguration<MenuImageAsset>
{
    public void Configure(EntityTypeBuilder<MenuImageAsset> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("MenuImageAssets");
        builder.HasKey(asset => asset.Id);
        builder.Property(asset => asset.Id).ValueGeneratedNever();
        builder.Property(asset => asset.ContentType).HasMaxLength(64).IsRequired();
        builder.Property(asset => asset.ContentLength).IsRequired();
        builder.Property(asset => asset.ContentHash).HasMaxLength(64).IsRequired();
        builder.Property(asset => asset.Content).HasColumnType("varbinary(max)").IsRequired();
        builder.Property(asset => asset.FileName).HasMaxLength(256).IsRequired(false);
        builder.Property(asset => asset.CreatedAtUtc).IsRequired();

        builder.HasIndex(asset => asset.ContentHash);
    }
}
