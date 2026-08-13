# API-CONTRACTS.md — Initial Contract Map

This is a contract map, not the final OpenAPI specification. Codex should turn accepted endpoints into explicit request/response DTOs and OpenAPI definitions.

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
