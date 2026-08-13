# ADR 0002: Initial relational provider selection

- Status: Superseded
- Date: 2026-08-13
- Superseded by: [ADR 0005](0005-sql-server-ef-core.md)

## Context

Phase 0 originally selected a relational provider before any product entities or business data existed. The product database decision then changed permanently before Phase 2 began.

## Decision

This initial provider decision no longer applies. ADR 0005 is the sole current database decision. The repository does not retain compatibility packages, migrations, configuration, or runtime paths for the superseded provider.

## Consequences

- There is one official relational provider.
- The initial migration was re-baselined before any product tables or production data existed.
- Phase 2 remains unstarted and must build only on ADR 0005.
