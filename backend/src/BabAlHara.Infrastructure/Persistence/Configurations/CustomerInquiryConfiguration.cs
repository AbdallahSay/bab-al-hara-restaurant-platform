using BabAlHara.Domain.Inquiries;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class CustomerInquiryConfiguration : IEntityTypeConfiguration<CustomerInquiry>
{
    public void Configure(EntityTypeBuilder<CustomerInquiry> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("CustomerInquiries");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();
        builder.Property(i => i.CreatedAtUtc).IsRequired();
        builder.Property(i => i.Name).HasMaxLength(120).IsRequired();
        builder.Property(i => i.ContactInfo).HasMaxLength(120).IsRequired();
        builder.Property(i => i.Subject).HasMaxLength(200);
        builder.Property(i => i.Message).HasMaxLength(2000).IsRequired();
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(i => i.ReviewedAtUtc);
        builder.Property(i => i.ReviewedByStaffId);
        builder.Property(i => i.StaffNotes).HasMaxLength(500);

        builder.HasIndex(i => i.CreatedAtUtc).IsDescending(true);
        builder.HasIndex(i => new { i.Status, i.CreatedAtUtc }).IsDescending(false, true);
    }
}
