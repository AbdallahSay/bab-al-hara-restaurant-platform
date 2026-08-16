# API-CONTRACTS.md — Initial Contract Map

This is a contract map, not the final OpenAPI specification. Codex should turn accepted endpoints into explicit request/response DTOs and OpenAPI definitions.

## Implemented customer-ordering & kitchen-operations slice

Implemented endpoints are JSON and use string enum names. EF entities are never serialized as API contracts.

### Public menu and delivery

- `GET /api/menu/categories` -> active `CategoryDto[]`
- `GET /api/menu/items?categoryId={guid}` -> active `MenuItemDto[]`; `isAvailable` remains explicit
- `GET /api/menu/items/{id}` -> active `MenuItemDto` or `404`
- `GET /api/delivery-areas` -> active `DeliveryAreaDto[]` with current fee and ETA

### Guest cash order creation

- `GET /api/security/csrf` -> antiforgery request token
- `POST /api/orders` with `X-XSRF-TOKEN`

Request fields: `customerName`, `customerPhone`, `orderType`, nullable `deliveryAreaId`, nullable `address`, nullable `customerNote`, and `items[{menuItemId,quantity}]`.

The request has no price, subtotal, delivery-fee, total, payment-method, payment-status, status, public-code, or internal-ID field. Unknown JSON properties cannot override server calculations. Success returns `201` with public code, created time, order type/status, fulfilment snapshots, authoritative money, and `Cash`/`Pending` payment state. Validation returns RFC 7807 with a stable `code`; current conflict codes cover inactive/unavailable menu items and inactive delivery areas.

### Staff session and kitchen

- `GET /api/staff/session` -> `StaffSessionResponse(isAuthenticated, displayName)`
- `POST /api/staff/session` with antiforgery token; rate limited; validates staff credentials (Kitchen, Manager, Admin, Cashier, Driver)
- `DELETE /api/staff/session` with authorization and antiforgery token

### Kitchen Operations Endpoints (Kitchen, Manager, Admin authorized)

- `GET /api/kitchen/orders/active` -> active `KitchenOrderDto[]` (Pending, Confirmed, Preparing, Ready queue) with RowVersion
- `GET /api/kitchen/orders/{publicCode}` -> `KitchenOrderDetailsDto` including complete item snapshot, RowVersion, and audit history
- `GET /api/kitchen/orders/{publicCode}/history` -> `OrderStatusHistoryDto[]`
- `POST /api/kitchen/orders/{publicCode}/confirm` -> transitions from Pending to Confirmed; accepts `{ rowVersion?: string, notes?: string }`
- `POST /api/kitchen/orders/{publicCode}/start-preparing` (alias `/prepare`) -> transitions from Confirmed/Pending to Preparing; accepts `{ rowVersion?: string, notes?: string }`
- `POST /api/kitchen/orders/{publicCode}/mark-ready` (alias `/ready`) -> transitions from Preparing to Ready; accepts `{ rowVersion?: string, notes?: string }`
- `POST /api/kitchen/orders/{publicCode}/transition` -> unified transition endpoint with `{ targetStatus: string, rowVersion?: string, notes?: string }`
- `POST /api/kitchen/menu-items/{id}/availability` (alias `POST /api/menu/items/{id}/availability`) -> `{ isAvailable: boolean }` updates availability and broadcasts event

Concurrency Handling:
- Order modifications enforce SQL Server `rowversion` concurrency token.
- Concurrent updates or stale rowversions return `409 Conflict` with `code: "concurrency_conflict"`.
- Illegal status transitions return `400 Bad Request` with `code: "invalid_order_transition"`.

### SignalR

- Hub: `/hubs/kitchen`, Kitchen policy required
- Server-to-client methods:
  - `NewOrder(KitchenOrderDto)`
  - `OrderStatusChanged(OrderStatusChangedEvent)` with `{ publicCode, previousStatus, newStatus, changedAtUtc, rowVersion }`
  - `MenuItemAvailabilityChanged(MenuItemAvailabilityChangedEvent)` with `{ menuItemId, isAvailable }`

The events fire after database transaction commits. Initial load and reconnect use the active-orders API as the source of truth.

## Customer ordering
- POST `/api/orders`
- GET `/api/orders/track/{orderCode}`
- GET `/api/me/orders` (registered customer)
- GET `/api/me/orders/{id}`
- POST `/api/me/orders/{id}/reorder-preview`

## Order commands (Full lifecycle across phases)
- POST `/api/kitchen/orders/{publicCode}/confirm` (Kitchen phase)
- POST `/api/kitchen/orders/{publicCode}/start-preparing` (Kitchen phase)
- POST `/api/kitchen/orders/{publicCode}/mark-ready` (Kitchen phase)
- POST `/api/orders/{id}/assign-driver` (Cashier/Driver phase)
- POST `/api/orders/{id}/start-delivery` (Driver phase)
- POST `/api/orders/{id}/mark-delivered` (Driver phase)
- POST `/api/orders/{id}/cancel` (when allowed)

## Cashier
- GET `/api/cashier/orders`
- POST `/api/orders/{id}/cash-payment/confirm`
- GET `/api/drivers/availability`
- POST `/api/orders/{id}/assign-driver`

## Driver
- GET `/api/driver/orders/assigned`
- GET `/api/driver/orders/{id}`
- POST `/api/orders/{id}/start-delivery`
- POST `/api/orders/{id}/mark-delivered`

## Management
- CRUD `/api/admin/menu/categories`
- CRUD `/api/admin/menu/items`
- CRUD `/api/admin/delivery-areas`
- GET `/api/admin/orders`
- GET `/api/admin/reports/sales`
- GET `/api/admin/reports/products`
- GET `/api/admin/reports/drivers`
- GET `/api/admin/reports/export`

## Employee administration
- GET `/api/admin/employees`
- POST `/api/admin/employees`
- PATCH `/api/admin/employees/{id}`
- POST `/api/admin/employees/{id}/activate`
- POST `/api/admin/employees/{id}/deactivate`
- POST `/api/admin/employees/{id}/role`

## Payments
- create payment session/intention
- receive Paymob webhook
- query payment status for UI
- authorized refund operation
