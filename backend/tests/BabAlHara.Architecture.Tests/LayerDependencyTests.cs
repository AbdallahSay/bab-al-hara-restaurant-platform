using BabAlHara.Application;
using BabAlHara.Domain;
using BabAlHara.Infrastructure.Persistence;

namespace BabAlHara.Architecture.Tests;

public sealed class LayerDependencyTests
{
    [Fact]
    public void DomainDoesNotReferenceOuterLayers()
    {
        var references = GetReferences(typeof(DomainAssemblyMarker).Assembly);

        Assert.DoesNotContain("BabAlHara.Application", references);
        Assert.DoesNotContain("BabAlHara.Infrastructure", references);
        Assert.DoesNotContain("BabAlHara.Api", references);
    }

    [Fact]
    public void ApplicationDoesNotReferenceInfrastructureOrApi()
    {
        var references = GetReferences(typeof(ApplicationAssemblyMarker).Assembly);

        Assert.DoesNotContain("BabAlHara.Infrastructure", references);
        Assert.DoesNotContain("BabAlHara.Api", references);
    }

    [Fact]
    public void InfrastructureDoesNotReferenceApi()
    {
        var references = GetReferences(typeof(AppDbContext).Assembly);

        Assert.DoesNotContain("BabAlHara.Api", references);
    }

    private static string?[] GetReferences(System.Reflection.Assembly assembly) =>
        assembly.GetReferencedAssemblies().Select(reference => reference.Name).ToArray();
}
