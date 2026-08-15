using BabAlHara.Infrastructure;
using BabAlHara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BabAlHara.Architecture.Tests;

public sealed class PersistenceConfigurationTests
{
    [Fact]
    public void InfrastructureRegistersOnlyTheSqlServerProvider()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Database"] =
                        "Server=localhost;Database=bab_al_hara_tests;Integrated Security=True;Encrypt=False",
                })
            .Build();

        using var serviceProvider = new ServiceCollection()
            .AddInfrastructure(configuration)
            .BuildServiceProvider(validateScopes: true);
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.Equal("Microsoft.EntityFrameworkCore.SqlServer", dbContext.Database.ProviderName);
        Assert.Equal("app", dbContext.Model.GetDefaultSchema());
        var entityTypes = dbContext.Model.GetEntityTypes().ToArray();
        Assert.Contains(entityTypes, entity => entity.ClrType == typeof(Domain.Catalog.Category));
        Assert.Contains(entityTypes, entity => entity.ClrType == typeof(Domain.Catalog.MenuItem));
        Assert.Contains(entityTypes, entity => entity.ClrType == typeof(Domain.Delivery.DeliveryArea));
        Assert.Contains(entityTypes, entity => entity.ClrType == typeof(Domain.Ordering.Order));
        Assert.Contains(entityTypes, entity => entity.ClrType == typeof(Domain.Ordering.OrderItem));
        Assert.Equal(18, AppDbContext.DefaultDecimalPrecision);
        Assert.Equal(2, AppDbContext.DefaultDecimalScale);
    }
}
