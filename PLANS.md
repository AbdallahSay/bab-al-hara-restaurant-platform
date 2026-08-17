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

Status: BACKEND COMPLETE — 2026-08-16

- Kitchen active orders screen
- SignalR new-order event
- audible + visual new-order alert
- Start Preparing
- Mark Ready
- item availability toggle with confirmation
- reconnection/re-fetch behavior
- authorization/tests

Delivered Backend Slice:
- Kitchen active orders queue endpoint (`GET /api/kitchen/orders/active`) with optimistic concurrency tokens (`byte[] RowVersion`)
- Order state machine transitions (`Pending -> Confirmed`, `Confirmed -> Preparing`, `Preparing -> Ready`, `Pending -> Preparing`)
- Order status audit trail recording with `OrderStatusHistory` table (actor ID, actor name, actor role, timestamps, notes)
- Strict rejection of illegal or out-of-scope status transitions
- Concurrency conflict detection returning HTTP 409 Conflict with ProblemDetails
- Menu item availability toggling endpoints (`POST /api/kitchen/menu-items/{id}/availability` and `POST /api/menu/items/{id}/availability`) reflecting in public catalog
- SignalR real-time event broadcasting (`NewOrder`, `OrderStatusChanged`, `MenuItemAvailabilityChanged`) on `/hubs/kitchen`
- Role-based authorization for Kitchen, Manager, and Admin
- Comprehensive domain unit tests and API integration test suite covering all transitions, concurrency conflicts, audit logs, and security
- EF Core migration `KitchenOperations`

## Phase 4 — Customer live tracking + notifications foundation

- tracking page
- SignalR status updates
- resilient reconnect/re-fetch
- notification outbox
- WhatsApp provider interface and sandbox/test adapter

Acceptance:
Customer sees server-authoritative status progression.

## Phase 5 — Cashier

Status: COMPLETE — 2026-08-17

Delivered:
- Compact operational queues with fast scan time (<2s)
- Live operational metrics strip (Ready count, Takeaway queue, Delivery queue, Cash to collect)
- Immediate search & 1-tap queue filters (All, Ready for Pickup, Waiting for Driver)
- Progressive details disclosure (collapsible item drawers, global expand/collapse)
- 3-tier aging alerts (normal, attention 10m+, overdue 20m+)
- Takeaway handover action with confirmation modal and payment collection verification
- Driver assignment workflows with concurrency/409 handling
- Real-time SignalR live order updates and Web Audio alert chime
- Bilingual Arabic RTL and English LTR support

## Phase 6 — Driver

Status: COMPLETE — 2026-08-17

Delivered:
- Mobile-first driver operational portal (360-430px) and centered desktop workspace
- Current active order visual dominance with grouped customer contact & delivery address
- One-tap phone call integration with large touch targets (>= 48px)
- High-contrast COD banner ("Cash on Delivery: XX.XX EGP" vs "Prepaid Online")
- Single dominant primary action (`Start Delivery` -> `Mark Delivered`)
- Confirmation dialog with explicit cash collection reminder
- SignalR real-time updates and reconnection handling
- Stale state / 409 conflict recovery
- Bilingual Arabic RTL and English LTR support

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
