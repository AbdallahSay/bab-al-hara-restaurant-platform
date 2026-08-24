# PLANS.md â€” Delivery Plan

## Operating rule

Build production-grade vertical slices. Do not create dozens of disconnected screens first.

## Phase 0 â€” Repository and engineering foundation

Status: COMPLETE â€” 2026-08-13

Delivered:

- Angular 22 strict standalone workspace with routing, runtime Arabic RTL / English LTR switching, self-hosted typography, design tokens, and a minimal accessible component proof
- .NET 10 modular-monolith solution with API, Application, Domain, Infrastructure, architecture tests, and API integration tests
- Microsoft SQL Server 2025 / EF Core 10 foundation with a SQL Server-specific initial reviewed schema migration
- OpenAPI, RFC 7807 global errors, correlation IDs, JSON logs, liveness/readiness health checks, and secure configuration conventions
- locked npm/NuGet dependencies, formatting/linting, warnings-as-errors builds, GitHub Actions CI with live SQL Server readiness validation, local SQL Server Compose, and a non-root API container definition
- architecture decision records and local development/run documentation

Acceptance evidence is recorded in the `chore/project-foundation` implementation commit. No business features or fake operational data were introduced.

The database provider was permanently re-baselined to SQL Server on 2026-08-13 before Phase 2. No product entities, business features, or dual-provider paths were introduced.

## Phase 1 â€” Shared design system + bilingual shell

Status: COMPLETE AS PART OF THE FIRST VERTICAL SLICE â€” 2026-08-13

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

### Figma page-by-page visual calibration — management sign-in

Status: COMPLETE FOR VISUAL REVIEW — 2026-08-24

- audited the connected Figma screen families without deep-loading future pages
- established Figma node `101:2371` as the management authentication calibration reference
- extended the existing semantic token layer with the observed orange primary, information, neutral alias, auth background, radius, glow, and elevation values
- migrated only `/management/sign-in` to the dark split auth composition with the exact downloaded Figma food artwork and Bab Al Hara branding
- preserved the existing management cookie session, antiforgery request, route return, validation, error, loading, and language-switch behavior
- verified Arabic RTL and English LTR at 1280px, 1024px, 768px, and 390px; future screen families remain intentionally unchanged

## Phase 2 â€” Menu + customer ordering vertical slice

Status: COMPLETE â€” 2026-08-13

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

## Phase 3 â€” Kitchen real-time vertical slice

Status: BACKEND COMPLETE â€” 2026-08-16

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

## Phase 4 â€” Customer live tracking, notifications & repeat ordering

Status: COMPLETE â€” 2026-08-18

- tracking page with SignalR status updates
- resilient reconnect/re-fetch with HttpOnly tracking capability cookie
- customer reorder CTA on Delivered orders
- server-authoritative reorder preview endpoint (`POST /api/orders/track/{publicCode}/reorder-preview`)
- current catalog availability, active status, and price resolution
- accessible cart merge/replace choice modal
- device-local versioned fulfillment preferences (`Takeaway` vs `Delivery`)
- saved delivery address with stale delivery area detection and recovery
- privacy-preserving "Clear saved address" UX
- customer My Orders page (`/orders` â€” Ø·Ù„Ø¨Ø§ØªÙŠ) grouping active vs previous orders
- bounded device-local public order index (`bab-al-hara.recent-orders.v1`) with zero credential exposure
- customer header "Ø·Ù„Ø¨Ø§ØªÙŠ" link and contextual "Ù…ØªØ§Ø¨Ø¹Ø© Ø·Ù„Ø¨Ùƒ" indicator
- comprehensive unit, integration, and security test suites

## Phase 5 â€” Cashier

- ready/current queues
- cash confirmation
- takeaway verification/handoff
- driver availability
- driver assignment
- tests and permission enforcement

## Phase 6 â€” Driver

- assigned orders mobile UI
- call/map actions
- start delivery
- mark delivered
- customer status update
- tests

## Phase 7 â€” Management/Admin

### Vertical Slice: Management Menu & Restaurant Control
Status: COMPLETE â€” 2026-08-17

Delivered:
- **Management Catalog Backend Slice:**
  - Full CRUD endpoints for Categories and Menu Items (`/api/management/categories`, `/api/management/menu-items`)
  - Server-side optimistic concurrency enforcement using `byte[] RowVersion` (returning 409 Conflict with ProblemDetails `stale_conflict`)
  - Fast status toggle (Active/Archived) for categories and items (`PATCH /api/management/categories/{id}/status`, `PATCH /api/management/menu-items/{id}/status`)
  - Fast 1-click availability toggle (`PATCH /api/management/menu-items/{id}/availability`) reflecting across customer menu and kitchen
  - Non-negative display order, bilingual AR/EN validation, preparation minutes (1-240 min)
  - Protected under `Management` authorization policy (Manager / Admin) with CSRF protection
- **Restaurant Control Backend Slice:**
  - Singleton `RestaurantControl` entity with EF Core migration
  - Public status endpoint `GET /api/restaurant/status` (Anonymous)
  - Management endpoint `PUT /api/management/restaurant/status` with optimistic concurrency token
  - Server-authoritative order placement gate: `OrderApplicationService` rejects checkout when `AcceptingOrders == false` with HTTP 409 `restaurant_not_accepting_orders`
- **Customer Restaurant Status Integration Frontend:**
  - Integrated `RestaurantStatusService` polling / querying operational status
  - Clear, non-alarming bilingual `RestaurantPausedBanner` across Menu and Cart
  - Cart items preserved when paused (customer cart is not wiped)
  - Checkout submit button disabled with explanation when paused; 409 conflict handled gracefully with retry prompt without wiping cart
- **Management Frontend:**
  - Routes `/management`, `/management/menu`, `/management/sign-in` protected by `managementAuthGuard`
  - `RestaurantStatusCard` component for instant order acceptance toggle, AR/EN pause message editor with 300 char counter, and optimistic concurrency error recovery
  - Management Hub with live catalog statistics (active categories, available/sold-out/archived items) and quick links
  - Menu Management screen with tabs for Categories and Menu Items, category pills filter, live search, 1-click availability toggle, 1-click active/archived toggle, create/edit modals with validation
  - Full bilingual Arabic RTL & English LTR support, responsive touch-first design, comprehensive Vitest specs
### Vertical Slice: Employee Accounts Lifecycle & Session Revocation Security
Status: COMPLETE â€” 2026-08-20

Delivered:
- **Employee Management Backend Slice:**
  - Full CRUD endpoints (`/api/management/employees`) for staff accounts across all 5 operational roles (`Kitchen`, `Cashier`, `Driver`, `Manager`, `Admin`)
  - Server-enforced role authorization matrix: Manager can manage only Kitchen, Cashier, and Driver; Admin can manage all roles
  - Self-protection & last-active-management-account guardrails (cannot disable self or final active manager/admin)
  - EF Core migration `AddEmployeeIsActiveField` adding non-destructive `IsActive` column to `StaffUsers` (default `true`)
  - Optimistic concurrency control using `ConcurrencyStamp` (returning 409 Conflict with `stale_conflict`)
  - Zero exposure of internal credentials, PasswordHash, SecurityStamp, or Normalized fields in API contracts
  - All mutating endpoints protected by `X-XSRF-TOKEN` antiforgery tokens
- **Staff Session Revocation & Security Validation Slice:**
  - Per-user session revocation: updating SecurityStamp on account disable, role change, or password reset immediately invalidates that user's sessions without global cookie rotation or affecting other users
  - Multi-portal principal validation: `StaffPrincipalValidator` wired into `OnValidatePrincipal` across all 4 custom cookie schemes (`Kitchen`, `Cashier`, `Driver`, `Management`) and legacy scheme
  - Real-time and API authorization gates: inactive accounts and stale principals rejected across all portals and SignalR hubs (`/hubs/kitchen`, `/hubs/cashier`, `/hubs/driver`, `/hubs/operations`)
  - Comprehensive integration test suite covering role matrix, self-protection, last-account protection, concurrency, password reset, and multi-user isolation
- **Employee Management Frontend:**
  - Route `/management/employees` protected by `managementAuthGuard` and linked in Management Hub navigation
  - Responsive desktop table and mobile card layout with search by name/email, role filter pills, and active/disabled status filter
  - Slide-out create/edit drawer with client-side validation, cryptographic temporary password generation (`crypto.getRandomValues`), 1-click clipboard copy, and show/hide toggle
  - Dedicated confirmation modals for account disable/re-enable and role change
  - Complete Arabic RTL and English LTR translations with accessibility roles and keyboard navigation
  - 100% passing Vitest unit test suite

- **Remaining Management Scope (Future phases):**
  - Delivery areas management
  - Order history/filtering and advanced audit views

## Phase 8 â€” Paymob

- provider integration
- server-side payment workflow
- verified/idempotent webhooks
- payment state UI
- failed payment handling
- refund flow with authorization/audit

## Phase 9 â€” Reports

- daily/monthly sales
- best-selling items
- peak times
- driver performance
- Excel export
- query performance review

## Phase 10 â€” Production hardening

- security review
- accessibility review
- load/performance profiling for operational endpoints
- concurrency testing on order transitions
- recovery/reconnect testing
- observability
- backup/restore plan for database hosting
- deployment runbook
- release checklist

## Phase 11 â€” Future branch-readiness review

Verify the architecture does not block future multi-branch support. Do not add branch UX/features unless approved.
