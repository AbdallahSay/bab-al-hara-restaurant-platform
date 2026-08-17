using BabAlHara.Domain.Catalog;
using BabAlHara.Domain.Delivery;
using BabAlHara.Domain.Ordering;
using BabAlHara.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<StaffUser, IdentityRole<Guid>, Guid>(options)
{
    public const string ConnectionStringName = "Database";
    public const int DefaultDecimalPrecision = 18;
    public const int DefaultDecimalScale = 2;

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    public DbSet<MenuImageAsset> MenuImageAssets => Set<MenuImageAsset>();

    public DbSet<DeliveryArea> DeliveryAreas => Set<DeliveryArea>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();

    public DbSet<BabAlHara.Domain.Ordering.RestaurantControl> RestaurantControls => Set<BabAlHara.Domain.Ordering.RestaurantControl>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        ArgumentNullException.ThrowIfNull(configurationBuilder);

        configurationBuilder
            .Properties<decimal>()
            .HavePrecision(DefaultDecimalPrecision, DefaultDecimalScale);
        configurationBuilder
            .Properties<decimal?>()
            .HavePrecision(DefaultDecimalPrecision, DefaultDecimalScale);
        configurationBuilder.Properties<DateTime>().HaveColumnType("datetime2").HavePrecision(7);
        configurationBuilder
            .Properties<DateTime?>()
            .HaveColumnType("datetime2")
            .HavePrecision(7);
        configurationBuilder
            .Properties<DateTimeOffset>()
            .HaveColumnType("datetimeoffset")
            .HavePrecision(7);
        configurationBuilder
            .Properties<DateTimeOffset?>()
            .HaveColumnType("datetimeoffset")
            .HavePrecision(7);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.HasDefaultSchema("app");
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        builder.Entity<StaffUser>(user =>
        {
            user.ToTable("StaffUsers");
            user.Property(account => account.DisplayName).HasMaxLength(120).IsRequired();
            user.Property(account => account.PhoneNumber).HasMaxLength(20);
            user.Property(account => account.PasswordHash).HasMaxLength(1024);
            user.Property(account => account.SecurityStamp).HasMaxLength(128);
            user.Property(account => account.ConcurrencyStamp).HasMaxLength(128);
        });
        builder.Entity<IdentityRole<Guid>>().ToTable("StaffRoles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("StaffUserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("StaffUserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("StaffUserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("StaffRoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("StaffUserTokens");
    }
}
