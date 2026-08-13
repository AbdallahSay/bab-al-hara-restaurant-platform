# ADR 0001: Start with a modular monolith

- Status: Accepted
- Date: 2026-08-13

## Context

Ordering, payment, delivery, and restaurant operations need transactional consistency and share one product lifecycle. Splitting these concerns into deployable services before their boundaries are proven would add failure modes and operational work without user value.

## Decision

The backend is one ASP.NET Core deployable with explicit compile-time layers:

- `BabAlHara.Domain` contains business rules and has no project dependencies.
- `BabAlHara.Application` coordinates use cases and depends only on Domain.
- `BabAlHara.Infrastructure` implements persistence and provider adapters and depends inward.
- `BabAlHara.Api` is the composition and HTTP boundary.

Business code will be grouped by documented product module inside these boundaries. The Angular application remains a separately built client and is organized by product feature plus narrow platform concerns. Architecture tests prevent outward references from the inner backend layers.

## Consequences

- Cross-module transactions remain simple and reliable.
- One backend deployment and database reduce initial operating cost.
- Module boundaries must be maintained in code review and tests.
- A module may be extracted only after measured scaling or ownership pressure and a new ADR.
