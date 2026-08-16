# Bab Al Hara backend

.NET 10 modular monolith with the customer-ordering and realtime-kitchen vertical slice.

## Projects

- `BabAlHara.Domain`: business rules with no outward dependencies
- `BabAlHara.Application`: use-case orchestration depending only on Domain
- `BabAlHara.Infrastructure`: Microsoft SQL Server/EF Core persistence and infrastructure adapters
- `BabAlHara.Api`: HTTP composition root and platform middleware
- `BabAlHara.Architecture.Tests`: compile-time boundary regression tests
- `BabAlHara.Api.IntegrationTests`: in-process API behavior tests

The API exposes explicit catalog, delivery-area, guest order, staff session, and kitchen queue contracts. Guest order creation reloads prices, availability, and delivery fees from SQL Server, persists one aggregate transaction, and publishes the strongly typed SignalR event after commit.

## Migrations

Restore the pinned local tool and list migrations without modifying a database:

```powershell
dotnet tool restore
dotnet ef migrations list --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api
```

Create a reviewed migration after a real domain model change:

```powershell
dotnet ef migrations add <DescriptiveName> --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api --output-dir Persistence/Migrations
```

SQL Server is the only supported relational provider. Before committing a migration:

- run `dotnet ef migrations has-pending-model-changes` and generate an idempotent SQL script for review
- configure monetary properties as `decimal` with intentional precision; never use `float` or `double`
- review temporal types, bounded string lengths, GUID generation, indexes, uniqueness, and delete behavior
- apply migrations through the deployment workflow rather than API startup
- verify readiness both with a reachable SQL Server and after the dependency is stopped

Migrations are deployment operations and are never applied automatically during API startup.

Development seed data is explicit, deterministic, and guarded by the Development environment:

```powershell
dotnet user-secrets set "DevelopmentSeed:KitchenPassword" "<strong local password>" --project src/BabAlHara.Api
dotnet run --project src/BabAlHara.Api -- --seed-data
```

The seed creates bilingual menu data, delivery areas, the Kitchen role, and `kitchen@bab-al-hara.local`; it never embeds a password in source or configuration.
