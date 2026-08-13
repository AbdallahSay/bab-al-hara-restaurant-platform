# DESIGN-BRIEF.md — Visual & Interaction Direction

## North star
The product should feel like a thoughtfully designed modern restaurant operating system, not an AI-generated admin dashboard.

The visual result should be calm, contemporary, intentional, and highly legible. Customer surfaces may feel warm and appetizing; staff surfaces must feel operational, fast, and nearly impossible to misunderstand.

## What “modern” means here
- strong typography and hierarchy
- deliberate spacing
- few well-designed components reused consistently
- clear information density appropriate to each role
- restrained surfaces and borders
- subtle depth only where it helps grouping
- polished empty/loading/error states
- responsive layout behavior that feels native at each breakpoint
- purposeful motion only for state change/feedback

## What is forbidden
- old Bootstrap admin aesthetics
- generic Material-dashboard look
- giant gradients as decoration
- glassmorphism everywhere
- random emoji as production icons
- excessive rounded cards nested inside rounded cards
- fake analytics
- decorative widgets with no task value
- huge hero sections on operational screens
- tiny grey text
- critical actions represented only by icons
- ambiguous iconography
- visual noise that competes with order information

## Initial visual language
This is a starting design direction, not permission to add unrelated branding features.

### Customer-facing
- warm off-white/neutral backgrounds
- deep warm primary brand tone (burgundy/terracotta family), used with restraint
- charcoal text with excellent contrast
- food photography is the visual emphasis
- clean category navigation
- obvious price, availability, quantity, and add-to-cart affordances
- comfortable spacing and large tap targets

### Operational staff
- neutral high-contrast surfaces
- status color is secondary to explicit text labels
- dense enough to be efficient, but never cramped
- primary action visually dominant
- order number, elapsed time, quantities, and exceptions/notes are highly scannable
- no decorative food photography unless operationally useful

## Typography
Choose a production-quality Arabic/Latin typeface pairing or a family supporting both scripts well.
Requirements:
- Arabic must remain legible at small/medium sizes
- numerals must be easy to scan under time pressure
- avoid ultra-light weights
- use a small, consistent type scale
- do not shrink labels to make bad layouts fit

## Spacing and components
- use an 8px-derived spacing rhythm where practical
- large touch targets for kitchen/cashier/driver
- consistent input heights
- consistent button hierarchy: primary, secondary, danger, quiet
- status badges always include readable text
- dialogs are reserved for decisions that genuinely need interruption

## Role-specific design intent

### Customer
Emotion: warm, trustworthy, effortless.
Primary goal: choose food and place an order with minimal friction.
Do not overwhelm with account creation. Guest checkout remains first-class.

### Kitchen
Emotion: focused, fast, unmistakable.
Primary goal: see what must be cooked and move it from new -> preparing -> ready.
The kitchen screen should be understandable from several feet away on a tablet/display.

### Cashier
Emotion: controlled, operational.
Primary goal: identify ready/current orders, verify handoff/payment, assign delivery.
Avoid management analytics here.

### Driver
Emotion: minimal, mobile, obvious.
Primary goal: know where to go and update delivery status.
Keep the screen usable one-handed and outdoors.

### Manager/Admin
Emotion: professional and precise.
Primary goal: manage configuration and understand operations.
Use tables/charts only when they answer real management questions.

## Interaction feedback
Every important action needs immediate feedback:
- optimistic UI only when safe
- otherwise show progress and server-confirmed success
- errors must say what happened and what the user can do next
- destructive actions require confirmation
- real-time screens must make reconnecting/stale-state behavior obvious but not alarming

## Accessibility and low-literacy design
- text + icon for critical actions
- large readable labels
- simple vocabulary
- no color-only meaning
- no hidden gestures
- strong focus states for keyboard users where relevant
- good contrast
- avoid long instructions; prefer short inline guidance

## Final visual test
If a screen looks impressive but a first-time restaurant worker could hesitate about what to do next, redesign it.
