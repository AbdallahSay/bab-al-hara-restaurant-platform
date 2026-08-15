# PRODUCT.md — Bab Al Hara Restaurant Platform

## Product goal
Build a bilingual Arabic/English restaurant ordering and operations platform that makes customer ordering simple and gives restaurant staff role-specific tools for kitchen, cashier, delivery, management, and administration.

The system must prioritize operational clarity, speed, and low training requirements.

## Current production slice

Implemented now:

- bilingual category menu with availability and local product imagery
- locally persistent guest cart
- Takeaway or Delivery checkout with active SQL Server delivery areas
- Cash only; no online-payment control is displayed
- server-authoritative prices, fees, availability, subtotal, and total
- historical order-item snapshots and non-sequential public order code
- protected kitchen current-order queue with post-commit SignalR delivery and API recovery

Order transitions, live customer tracking, WhatsApp, Paymob, cashier, driver, management, employee administration, and reporting remain later phases. The canonical statuses exist as domain rules, but this slice creates only `Pending` orders and does not expose speculative workflow controls.

## Primary user groups
1. Guest customer
2. Registered customer
3. Kitchen employee
4. Cashier
5. Delivery driver
6. Manager
7. Admin

## Customer capabilities
- Browse menu by categories with images, prices, and availability.
- Add items with quantity and notes.
- Order as a guest using name and phone number.
- Registered customers can save addresses, view order history, and reorder.
- Choose Takeaway or Delivery.
- For delivery, show delivery fee and estimated time before confirmation.
- Pay online via Paymob or pay cash.
- Receive an order code.
- Track the order live without refreshing.
- Receive WhatsApp notifications during relevant stages.

## Canonical order stages
- Pending
- Confirmed
- Preparing
- Ready
- On the Way
- Delivered

## Kitchen capabilities
- Receive new orders in real time.
- See order details, quantities, and notes.
- Start preparation.
- Mark order ready.
- Mark an item unavailable/out of stock so customers cannot order it.
- New orders must have an obvious visual alert and support an audible alert in the deployed UI.

## Cashier capabilities
- See ready/current orders.
- Verify takeaway order code.
- Confirm cash collection where applicable.
- Assign delivery orders to available drivers.
- See driver availability (Available / Busy).

## Driver capabilities
- See only assigned deliveries.
- See delivery address and customer phone.
- Start delivery / mark order on the way.
- Mark delivered.
- Customer receives relevant delivery updates.

## Manager capabilities
- Manage menu items and categories.
- Manage pricing, images, preparation times, and availability.
- Configure delivery areas, fees, and estimated times.
- View all orders and filter by date/type/status.
- Access sales reports and analytics.
- Analyze best-selling items, peak times, and driver performance.
- Export reports to Excel.

## Admin capabilities
All manager capabilities plus employee account management and role/permission administration.

## Payments
- Online card payments through Paymob.
- Cash on delivery or pickup where applicable.
- Payment status must be tracked server-side.
- Failed/declined payment and refund cases require real operational handling, not UI simulation.

## Real-time and notifications
- Order status updates should appear without page refresh.
- Kitchen/cashier operational views require real-time updates.
- WhatsApp notifications should be emitted via a provider integration abstraction.

## Future readiness
The product should be structured so multiple branches can be supported later without rewriting core business logic, but multi-branch UI/features should not be invented before they are explicitly required.

## Non-goals unless later approved
- Loyalty points
- Coupons/promotions engine
- Table reservations
- Dine-in table/POS management
- Inventory/recipe costing system
- Accounting/ERP
- Marketplace with multiple unrelated restaurants
- AI recommendations
- Social features

These are intentionally excluded to prevent scope creep.
