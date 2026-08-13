using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BabAlHara.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString(AppDbContext.ConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{AppDbContext.ConnectionStringName}' is required.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                connectionString,
                sqlServer =>
                {
                    sqlServer.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    sqlServer.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                }));

        return services;
    }
}
