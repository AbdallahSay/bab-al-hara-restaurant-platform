# ARCHITECTURE.md — Recommended Full-Stack Architecture

> This document contains recommended engineering decisions for implementation. Where the product requirements did not specify infrastructure details, the choices below are architectural recommendations, not source requirements.

## Architecture style

Start as a modular monolith.

Reasons:

- One restaurant product with tightly connected ordering workflows.
- Easier transactional consistency for orders/payments.
- Lower deployment/operations complexity than premature microservices.
- Clear module boundaries can later be extracted if scale requires it.

## Frontend

- Angular.
- Feature/domain-oriented structure.
- First-class localization for Arabic RTL and English LTR.
- Responsive role-specific shells rather than one giant universal dashboard.
- Strongly typed API client generated or maintained from an OpenAPI contract.
- SignalR client for real-time order events.

Suggested feature boundaries:

- auth
- customer-menu
- cart-checkout
- order-tracking
- kitchen
- cashier
- driver
- menu-management
- delivery-areas
- employees-access
- reports
- shared-ui
- core-platform

## Backend

- ASP.NET Core Web API.
- Modular domain/application/infrastructure boundaries inside one deployable service initially.
- Entity Framework Core for relational persistence.
- Microsoft SQL Server 2025 is the single official relational database, accessed through EF Core's SQL Server provider. Dual-provider runtime and migration paths are prohibited.
- OpenAPI contract enabled and treated as a compatibility surface.
- SignalR hubs for real-time operational/client updates.

Suggested backend modules:

- Identity & Access
- Catalog/Menu
- Ordering
- Payments
- Delivery
- Notifications
- Reporting
- Administration

## Authentication and authorization

- Authentication mechanism should be production-safe for an Angular web client and documented in an ADR during implementation.
- Authorization is always enforced server-side.
- Role/policy checks must protect kitchen, cashier, driver, manager, and admin actions.
- Driver queries must scope to assigned orders.
- Customer order-history endpoints must scope to the authenticated customer.

## Order domain

Order state is authoritative on the server.

Canonical flow:
Pending -> Confirmed -> Preparing -> Ready -> OnTheWay -> Delivered

Implement explicit allowed transitions and transition commands.
Do not expose a generic "set status" endpoint that allows arbitrary states.

Examples:

- ConfirmOrder
- StartPreparing
- MarkReady
- AssignDriver
- StartDelivery
- MarkDelivered
- CancelOrder (only under allowed business conditions)

Transition operations should be idempotent where retries are plausible.

## Real-time

Use SignalR to publish domain-relevant UI events after successful persistence.
Examples:

- OrderCreated
- OrderConfirmed
- OrderPreparationStarted
- OrderReady
- DriverAssigned
- DeliveryStarted
- OrderDelivered
- MenuItemAvailabilityChanged

Do not use real-time messages as the source of truth; clients must be able to re-fetch current state after reconnect.

## Notifications

WhatsApp integration behind an interface such as `IWhatsAppNotificationProvider`.
Notification sending should not block the primary order transaction.
Use a durable outbox/background processing approach so transient provider failures can be retried safely.

## Payments

Paymob behind a payment-provider abstraction.

- Server creates/validates payment intents/transactions.
- Webhook callbacks are authenticated/verified according to provider requirements.
- Webhook handling must be idempotent.
- Client redirects/callback UI cannot be trusted as payment proof.
- Refund operations are auditable and authorization-protected.

## Persistence and consistency

- Relational database.
- Use transactions around business operations that must be atomic.
- Use optimistic concurrency or equivalent safeguards where simultaneous staff actions can conflict.
- Persist audit-relevant timestamps in UTC and display in local restaurant time.
- Default decimal storage is `decimal(18,2)`; monetary properties must use `decimal` and declare intentional precision in their entity configuration, never `float` or `double`.
- Store UTC `DateTime` values as `datetime2(7)` and offset-aware values as `datetimeoffset(7)`.
- Map GUIDs to `uniqueidentifier`; choose sequential generation only after an index/write-pattern review.
- Bound persisted strings intentionally. Indexed Unicode strings normally remain at or below 450 characters to stay within SQL Server key-size limits.
- Define indexes and unique constraints explicitly and keep generated identifiers within SQL Server's 128-character limit.
- Declare delete behavior on every relationship; do not allow unreviewed cascades across business aggregates.
- Keep one SQL Server migration history. Migrations are deployment operations and are never applied by API startup.
- The current foundation has no product entities or relationships; these mapping rules become acceptance criteria when a vertical slice adds them.

## Reporting

Operational writes stay in the primary transactional model initially.
Reports should use efficient read queries/projections.
Do not introduce a separate analytics platform until proven necessary.

## File/media storage

Menu item images should be stored in an object/file storage abstraction, not in the relational database as large blobs.
Keep provider-specific storage details behind an interface.

## Observability

Production implementation must include:

- structured application logs
- correlation/request IDs
- health endpoints
- dependency health where practical
- exception handling without leaking sensitive details
- metrics/tracing hooks suitable for production hosting

## Deployment

Container-friendly deployment.
Use environment-specific configuration and secret injection.
CI should build/test frontend and backend and validate production builds.

## Future multi-branch readiness

Model boundaries should avoid hard-coding assumptions that make future branch support impossible, but do not build multi-branch product features until requested.
