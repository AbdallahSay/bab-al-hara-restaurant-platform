# ADR 0005: Use Microsoft SQL Server with Entity Framework Core

- Status: Accepted
- Date: 2026-08-13

## Context

The database decision changed permanently before Phase 2 and before the foundation contained product entities or production data. A single provider avoids divergent migrations, type semantics, operational runbooks, and test paths.

## Decision

Use Microsoft SQL Server as the product's only relational database and Entity Framework Core 10 with `Microsoft.EntityFrameworkCore.SqlServer` 10.0.11 for persistence.

Local development and CI use `mcr.microsoft.com/mssql/server:2025-CU7-ubuntu-24.04`, pinned to registry manifest digest `sha256:86cc6144ef39bb0fbed2329e1ad79b13ee82e7b2e4739213a0db0800e668a74a` as verified on 2026-08-13. The tag selects SQL Server 2025 CU7, released in July 2026, on Ubuntu 24.04; the digest makes the selected container content immutable. SQL Server 2025 is in mainstream support until January 2031 and extended support until January 2036. The image is compatible with the project's .NET 10 and EF Core 10 baseline and includes the current `mssql-tools18` path used by health checks. The container requires an x86-64 Docker host and at least 2 GB of memory.

The persistence policy is:

- all decimal properties have a `decimal(18,2)` convention; every monetary property must also declare an intentional decimal precision in its entity mapping and must never use `float` or `double`
- `DateTime` maps to `datetime2(7)` and represents UTC; `DateTimeOffset` maps to `datetimeoffset(7)`
- GUID keys map to SQL Server `uniqueidentifier`; sequential generation may be selected only with a reviewed mapping
- bounded strings declare maximum lengths; indexed Unicode strings must respect SQL Server key-size limits, normally at most 450 characters
- indexes and unique constraints are explicit and reviewed for SQL Server's 128-character identifier limit
- every relationship declares intentional delete behavior; cascading deletes across business aggregates are not implicit
- migrations are generated and reviewed for SQL Server only

The current foundation model has no product entities, properties, indexes, unique constraints, GUID keys, or relationships. The review therefore found nothing to translate. The type conventions above and the SQL Server-specific baseline establish the guardrails for future mappings.

Connection strings and credentials come from user secrets, environment variables, or the deployment secret store. Local containers may use the `sa` account; deployed environments must use a least-privileged application login. Encryption remains enabled, and `TrustServerCertificate=True` is limited to local development and CI.

## Consequences

- The application, health checks, migrations, Compose service, CI, and documentation target one provider.
- Provider changes require a new ADR, data migration plan, revalidated migrations, and operational review.
- The application never applies migrations automatically at startup.
- Production backup, restore, high-availability, and least-privilege login procedures remain deployment runbook work in the hardening phase.
