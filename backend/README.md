# Bab Al Hara backend

.NET 10 modular-monolith foundation.

## Projects

- `BabAlHara.Domain`: business rules with no outward dependencies
- `BabAlHara.Application`: use-case orchestration depending only on Domain
- `BabAlHara.Infrastructure`: PostgreSQL/EF Core and future provider adapters
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
```

Migrations are deployment operations and are never applied automatically during API startup.
