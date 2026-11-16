using BabAlHara.Domain.Customers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class CustomerUserConfiguration : IEntityTypeConfiguration<CustomerUser>
{
    public void Configure(EntityTypeBuilder<CustomerUser> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("CustomerUsers");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.FullName).HasMaxLength(120).IsRequired();
        builder.Property(c => c.Email).HasMaxLength(256);
        builder.Property(c => c.NormalizedEmail).HasMaxLength(256);
        builder.Property(c => c.PhoneNumber).HasMaxLength(32);
        builder.Property(c => c.NormalizedPhone).HasMaxLength(32);
        builder.Property(c => c.PasswordHash).HasMaxLength(1024).IsRequired();
        builder.Property(c => c.SecurityStamp).HasMaxLength(128).IsRequired();
        builder.Property(c => c.ConcurrencyStamp).HasMaxLength(128).IsRequired();
        builder.Property(c => c.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(c => c.CreatedAtUtc).IsRequired();
        builder.Property(c => c.LastLoginAtUtc);
        builder.Property(c => c.SavedAddress).HasMaxLength(500);
        builder.Property(c => c.PreferredDeliveryAreaId);

        builder.HasIndex(c => c.NormalizedEmail)
            .IsUnique()
            .HasFilter("[NormalizedEmail] IS NOT NULL");

        builder.HasIndex(c => c.NormalizedPhone)
            .IsUnique()
            .HasFilter("[NormalizedPhone] IS NOT NULL");
    }
}
