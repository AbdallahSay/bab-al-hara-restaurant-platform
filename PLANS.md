# PLANS.md — Delivery Plan

## Operating rule

Build production-grade vertical slices. Do not create dozens of disconnected screens first.

## Phase 0 — Repository and engineering foundation

Status: COMPLETE — 2026-08-13

Delivered:

- Angular 22 strict standalone workspace with routing, runtime Arabic RTL / English LTR switching, self-hosted typography, design tokens, and a minimal accessible component proof
- .NET 10 modular-monolith solution with API, Application, Domain, Infrastructure, architecture tests, and API integration tests
- Microsoft SQL Server 2025 / EF Core 10 foundation with a SQL Server-specific initial reviewed schema migration
- OpenAPI, RFC 7807 global errors, correlation IDs, JSON logs, liveness/readiness health checks, and secure configuration conventions
- locked npm/NuGet dependencies, formatting/linting, warnings-as-errors builds, GitHub Actions CI with live SQL Server readiness validation, local SQL Server Compose, and a non-root API container definition
- architecture decision records and local development/run documentation

Acceptance evidence is recorded in the `chore/project-foundation` implementation commit. No business features or fake operational data were introduced.

The database provider was permanently re-baselined to SQL Server on 2026-08-13 before Phase 2. No product entities, business features, or dual-provider paths were introduced.

## Phase 1 — Shared design system + bilingual shell

Status: COMPLETE AS PART OF THE FIRST VERTICAL SLICE — 2026-08-13

Deliverables:

- design tokens
- typography/spacing/components
- Arabic RTL / English LTR switching
- responsive customer shell
- operational staff shell patterns
- loading/error/empty/confirm patterns

Acceptance:

- Arabic and English both reviewed
- components meet UX constitution
- no generic dashboard template styling

Delivered by the customer and kitchen surfaces: responsive customer header, operational kitchen shell, form/error/loading/empty patterns, Arabic/English runtime switching, direction-safe logical CSS, accessible status announcements, touch-sized actions, and production menu imagery.

## Phase 2 — Menu + customer ordering vertical slice

Status: COMPLETE — 2026-08-13

Deliverables end-to-end:

- categories/items persistence
- availability
- customer menu
- product details
- cart
- guest checkout
- Delivery/Takeaway
- delivery fee/time lookup
- create order API/domain/persistence
- order code generation
- validation/tests

Acceptance:
A real order submitted in Angular exists in the database and can be queried server-side.

Delivered with SQL Server authoritative pricing/fees/availability, order-item snapshots, guest Cash checkout, deterministic Development seed data, and required automated/live verification.

## Phase 3 — Kitchen real-time vertical slice

Status: PARTIALLY COMPLETE — CURRENT QUEUE AND NEW-ORDER DELIVERY ONLY — 2026-08-13

- Kitchen active orders screen
- SignalR new-order event
- audible + visual new-order alert
- Start Preparing
- Mark Ready
- item availability toggle with confirmation
- reconnection/re-fetch behavior
- authorization/tests

Acceptance:
Customer creates order -> kitchen receives it without refresh -> kitchen transitions persist correctly.

Delivered now because the approved mission explicitly included the kitchen receipt path: protected active-order retrieval, post-commit `NewOrder`, visual/optional-audible alert, and reconnect/refetch recovery. Start Preparing, Mark Ready, item-availability mutation, and their concurrency/transition tests remain deferred; no placeholder controls were added.

## Phase 4 — Customer live tracking + notifications foundation

- tracking page
- SignalR status updates
- resilient reconnect/re-fetch
- notification outbox
- WhatsApp provider interface and sandbox/test adapter

Acceptance:
Customer sees server-authoritative status progression.

## Phase 5 — Cashier

- ready/current queues
- cash confirmation
- takeaway verification/handoff
- driver availability
- driver assignment
- tests and permission enforcement

## Phase 6 — Driver

- assigned orders mobile UI
- call/map actions
- start delivery
- mark delivered
- customer status update
- tests

## Phase 7 — Management/Admin

- menu/category management
- bilingual item content
- delivery areas
- employee accounts and roles
- order history/filtering
- audit-sensitive operations

## Phase 8 — Paymob

- provider integration
- server-side payment workflow
- verified/idempotent webhooks
- payment state UI
- failed payment handling
- refund flow with authorization/audit

## Phase 9 — Reports

- daily/monthly sales
- best-selling items
- peak times
- driver performance
- Excel export
- query performance review

## Phase 10 — Production hardening

- security review
- accessibility review
- load/performance profiling for operational endpoints
- concurrency testing on order transitions
- recovery/reconnect testing
- observability
- backup/restore plan for database hosting
- deployment runbook
- release checklist

## Phase 11 — Future branch-readiness review

Verify the architecture does not block future multi-branch support. Do not add branch UX/features unless approved.
