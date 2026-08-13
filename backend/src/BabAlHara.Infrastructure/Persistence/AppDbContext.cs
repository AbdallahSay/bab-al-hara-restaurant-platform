using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public const string ConnectionStringName = "Database";
    public const int DefaultDecimalPrecision = 18;
    public const int DefaultDecimalScale = 2;

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.HasDefaultSchema("app");
        base.OnModelCreating(modelBuilder);
    }
}
