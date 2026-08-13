using Microsoft.EntityFrameworkCore;

namespace BabAlHara.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public const string ConnectionStringName = "Database";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.HasDefaultSchema("app");
        base.OnModelCreating(modelBuilder);
    }
}
