# Bab Al Hara backend

.NET 10 modular-monolith foundation.

## Projects

- `BabAlHara.Domain`: business rules with no outward dependencies
- `BabAlHara.Application`: use-case orchestration depending only on Domain
- `BabAlHara.Infrastructure`: Microsoft SQL Server/EF Core persistence and infrastructure adapters
- `BabAlHara.Api`: HTTP composition root and platform middleware
- `BabAlHara.Architecture.Tests`: compile-time boundary regression tests
- `BabAlHara.Api.IntegrationTests`: in-process API behavior tests

The current API exposes platform health and development OpenAPI only. Product endpoints are added as complete vertical slices with explicit DTOs, validation, authorization, persistence, and tests.

## Migrations

Restore the pinned local tool and list migrations without modifying a database:

```powershell
dotnet tool restore
dotnet ef migrations list --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api
```

Create a reviewed migration after a real domain model change:

```powershell
dotnet ef migrations add <DescriptiveName> --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api --output-dir Persistence/Migrations

SQL Server is the only supported relational provider. Before committing a migration:

- run `dotnet ef migrations has-pending-model-changes` and generate an idempotent SQL script for review
- configure monetary properties as `decimal` with intentional precision; never use `float` or `double`
- review temporal types, bounded string lengths, GUID generation, indexes, uniqueness, and delete behavior
- apply migrations through the deployment workflow rather than API startup
- verify readiness both with a reachable SQL Server and after the dependency is stopped
```

Migrations are deployment operations and are never applied automatically during API startup.
