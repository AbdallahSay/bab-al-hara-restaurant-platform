# ADR 0006: Persist orders before kitchen realtime delivery

- Status: Accepted
- Date: 2026-08-13

## Context

Customer order creation must remain correct if the kitchen browser is offline or SignalR delivery fails. Prices, availability, delivery fees, and totals are security-sensitive and cannot be accepted from the Angular client.

## Decision

- The order application service reloads active catalog and delivery-area data from SQL Server.
- The API accepts explicit customer details plus menu item identifiers and quantities; it accepts no monetary inputs.
- One EF Core `SaveChanges` call persists the `Order` aggregate and all `OrderItem` snapshots inside EF Core's automatic relational transaction.
- A database-unique, random, non-sequential `PublicCode` is the customer reference.
- `NewOrder` is published to the authenticated Kitchen SignalR hub only after `SaveChanges` succeeds.
- Realtime delivery is supplementary. The kitchen retrieves active orders from SQL Server on initial load and again after reconnect.
- If notification delivery fails after commit, order creation still succeeds and the operational queue recovers from persisted state.

## Consequences

- A failed database write cannot emit a successful kitchen event or leave partial order lines.
- A missed event cannot make the order disappear operationally.
- Current menu names and prices are copied into historical order-item snapshots.
- A durable outbox can replace the in-process post-commit notification later if multi-instance delivery guarantees require it; the event contract and persisted source of truth remain unchanged.
