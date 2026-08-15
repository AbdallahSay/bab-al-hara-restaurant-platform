# API-CONTRACTS.md — Initial Contract Map

This is a contract map, not the final OpenAPI specification. Codex should turn accepted endpoints into explicit request/response DTOs and OpenAPI definitions.

## Implemented customer-ordering slice

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

- `GET /api/staff/session`
- `POST /api/staff/session` with antiforgery token; rate limited; non-enumerating error
- `DELETE /api/staff/session` with Kitchen authorization and antiforgery token
- `GET /api/kitchen/orders/active` with Kitchen authorization

The browser session uses an ASP.NET Core Identity `HttpOnly` same-site cookie. Angular stores no authentication token.

### SignalR

- Hub: `/hubs/kitchen`, Kitchen policy required
- Server-to-client method: `NewOrder(KitchenOrderDto)`

`KitchenOrderDto` includes public code, created time, order type/status, customer name, fulfilment snapshots, customer note, and item name/quantity snapshots. It contains no internal order IDs or customer phone. The event fires after the order commit. Initial load and reconnect use the active-orders API as the source of truth.

## Public/customer catalog
- GET `/api/menu/categories`
- GET `/api/menu/items`
- GET `/api/menu/items/{id}`

Filters may include category and availability, but do not over-generalize query systems unnecessarily.

## Customer ordering
- POST `/api/orders`
- GET `/api/orders/track/{orderCode}`
- GET `/api/me/orders` (registered customer)
- GET `/api/me/orders/{id}`
- POST `/api/me/orders/{id}/reorder-preview`

## Order commands
Prefer command-specific endpoints over arbitrary status mutation.

Examples:
- POST `/api/orders/{id}/confirm`
- POST `/api/orders/{id}/start-preparing`
- POST `/api/orders/{id}/mark-ready`
- POST `/api/orders/{id}/assign-driver`
- POST `/api/orders/{id}/start-delivery`
- POST `/api/orders/{id}/mark-delivered`
- POST `/api/orders/{id}/cancel` (when allowed)

Each endpoint must enforce allowed transitions and actor permissions.

## Kitchen
- GET `/api/kitchen/orders/active`
- POST `/api/menu/items/{id}/availability`

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
Exact Paymob endpoints depend on implementation details and provider flow.
Expected internal responsibilities:
- create payment session/intention
- receive Paymob webhook
- query payment status for UI
- authorized refund operation

## SignalR
Suggested hub responsibilities:
- customer order tracking group by order identifier/authorization
- kitchen operational group
- cashier operational group
- driver-specific group
- manager/admin monitoring group where justified

Events are notifications of changed state, not authoritative state themselves.
