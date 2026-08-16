using BabAlHara.Domain.Ordering;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BabAlHara.Infrastructure.Persistence.Configurations;

public sealed class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("OrderStatusHistories");
        builder.HasKey(history => history.Id);
        builder.Property(history => history.Id).ValueGeneratedNever();
        builder.Property(history => history.OrderId).IsRequired();
        builder.Property(history => history.PreviousStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(history => history.NewStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(history => history.ActorId).HasMaxLength(128);
        builder.Property(history => history.ActorName).HasMaxLength(120);
        builder.Property(history => history.ActorRole).HasMaxLength(50);
        builder.Property(history => history.ChangedAtUtc).IsRequired();
        builder.Property(history => history.Notes).HasMaxLength(500);

        builder.HasIndex(history => history.OrderId);
        builder.HasIndex(history => history.ChangedAtUtc);
        builder.HasIndex(history => new { history.OrderId, history.ChangedAtUtc });

        builder
            .HasOne(history => history.Order)
            .WithMany(order => order.StatusHistory)
            .HasForeignKey(history => history.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
