# UX-GUIDELINES.md — Product Design Constitution

## Design objective
Create a modern, calm, highly usable restaurant product that can be understood with little or no training.

The target is not "a fancy dashboard". The target is confident task completion with minimal mistakes.

## Brand/design direction
- Contemporary Arabic restaurant identity.
- Warm and welcoming for customers.
- Functional and restrained for staff operations.
- Clean spacing and strong hierarchy.
- Avoid dated Bootstrap/admin-template aesthetics.
- Avoid decorative complexity that competes with food, order status, or primary actions.

## Bilingual behavior
- Arabic is default and full RTL.
- English is full LTR.
- The same feature must feel native in both directions.
- Do not merely mirror icons that have a semantic direction unless appropriate.
- Layout must tolerate Arabic/English text-length differences.
- Menu content supports Arabic and English names/descriptions.

## Low-literacy / low-tech rules
- Short labels and plain language.
- One primary task per screen/region where possible.
- Large typography for operational data.
- Large touch targets.
- Icon + text for critical actions.
- Do not hide important actions behind gestures or hover.
- Avoid deep nested menus.
- Avoid long forms.
- Give immediate, visible feedback after actions.
- Use confirmation for destructive actions.
- Status always uses text plus visual styling, not color alone.
- Use familiar wording, not technical terms.

## Customer experience
Mobile-first.

Core flow:
Home -> Menu -> Product -> Cart -> Order Type -> Checkout -> Payment -> Confirmation -> Tracking

Design priorities:
- Food photography is prominent.
- Price and availability are obvious.
- "Add" action is large and easy.
- Cart total is easy to understand.
- Checkout asks only for necessary data.
- Guest checkout is first-class.
- Delivery fee and estimated time are visible before final confirmation.
- Confirmation prominently shows order code and next step.
- Tracking is a simple visual stepper with status text.

## Kitchen display
Target: large tablet / desktop display in a noisy, fast environment.

Order card must prioritize:
1. Order number
2. Time received / elapsed time
3. Items and quantities
4. Customer notes/modifiers
5. Delivery vs Takeaway
6. Current status and next action

Primary actions:
- Start Preparing
- Mark Ready
- Out of Stock (separate inventory-availability action, confirmed)

Do not show analytics, customer history, settings, or unnecessary navigation on the kitchen operational screen.

## Cashier
Use clear status tabs/filters:
- New
- Preparing
- Ready
- Delivery
- Completed

Key actions:
- Confirm cash payment
- Verify/handoff takeaway
- Assign driver

Driver assignment should show only information needed to choose a driver, especially availability.

## Driver
Mobile-first and extremely simple.

Assigned order view:
- Order number
- Customer name
- Phone
- Address
- Amount/payment method
- Important delivery note

Large actions:
- Call Customer
- Open Map
- Start Delivery
- Delivered

No dashboard clutter.

## Manager/Admin
Desktop-first, responsive to tablet.

Navigation may include:
Dashboard, Orders, Menu, Categories, Delivery Areas, Drivers, Employees, Customers, Reports, Payments, Settings.

Dashboards should answer operational questions, not show metrics for decoration.
Every chart/card must have a clear decision/use case.

## Interaction states
Every actionable feature must design:
- loading
- empty
- success
- error
- disabled
- permission denied
- network disconnected/reconnecting when real-time matters

## Accessibility baseline
- Keyboard-accessible management interfaces.
- Visible focus indicators.
- Semantic controls and labels.
- Sufficient contrast.
- Error messages attached to fields and written in plain language.
- No critical information conveyed only by color, animation, or sound.

## Visual review gate
Before accepting a screen:
- Can the intended user identify the next action in under a few seconds?
- Is there anything visible that does not help the task?
- Can a low-tech user understand the labels?
- Is the Arabic version genuinely usable, not mechanically mirrored?
- Are dangerous actions clearly separated?
- Does the screen work at its target viewport and touch context?
