# ADR 0002: Use PostgreSQL 18 with Entity Framework Core

- Status: Accepted
- Date: 2026-08-13

## Context

The product needs durable relational transactions for orders, payments, assignments, and audit-relevant state. It also needs a supported database with mature .NET tooling and a clear local-development path.

## Decision

Use PostgreSQL 18 as the production relational database and EF Core 10 with the Npgsql provider for persistence.

- The local container is pinned to PostgreSQL 18.4, the current supported patch at this decision date.
- `AppDbContext` and migrations live in `BabAlHara.Infrastructure`.
- The baseline migration creates the owned `app` schema without inventing business tables.
- Connection strings come from ASP.NET Core configuration. Passwords are supplied by local untracked environment files or a deployment secret store, never source control.
- EF migrations are reviewed and applied as an explicit deployment operation; the API does not auto-migrate on startup.
- Audit-relevant timestamps will be stored in UTC.

## Consequences

- Local development requires PostgreSQL or the provided Docker Compose service.
- Schema changes are versioned and reviewable.
- Production hosting must provide backups, encrypted connections, least-privilege credentials, and restore testing before launch.
- Major PostgreSQL upgrades require a separate runbook and compatibility review.
