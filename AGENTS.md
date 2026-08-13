# AGENTS.md — Bab Al Hara Restaurant Platform

This repository is a production product, not a demo, prototype-only build, proof of concept, or dry run.

## 1. Source of truth
Before any implementation, read:
1. `PRODUCT.md`
2. `UX-GUIDELINES.md`
3. `DESIGN-BRIEF.md`
4. `ARCHITECTURE.md`
5. `SECURITY.md`
6. `API-CONTRACTS.md`
7. `GIT-WORKFLOW.md`
8. `PLANS.md`

Do not invent product features, dashboards, charts, actions, roles, settings, or data without documented justification. If a requirement is ambiguous, choose the smallest safe implementation and document the assumption.

## 2. UX constitution
The product will be used by customers and restaurant staff with mixed literacy and technical ability.

Mandatory rules:
- Clarity beats decoration.
- Every visible UI element must support a user task, decision, navigation action, status, or feedback. Otherwise remove it.
- Never produce a generic admin-template look.
- No meaningless cards, fake charts, decorative gradients, excessive glassmorphism, random icons, or animation for its own sake.
- Never rely on color alone for status.
- Critical actions use icon + text label.
- Touch targets are large and forgiving.
- Operational screens expose the minimum actions needed for that role.
- Arabic is first-class and full RTL. English is first-class and full LTR.
- Avoid jargon. Use short, concrete labels.
- Implement loading, empty, error, success, disabled, permission-denied, offline/reconnecting, and retry states.
- Confirm destructive or irreversible actions.
- Prevent mistakes before they happen.
- Do not copy the visual style of old Bootstrap/Material admin templates.
- Do not add UI merely because “dashboards usually have it”.

## 3. Design quality gate
Before calling a screen complete:
- Review it at its target viewport.
- Verify hierarchy is immediately understandable in 3–5 seconds.
- Verify the primary action is unmistakable.
- Remove any element that does not help the user complete the current task.
- Verify Arabic typography, RTL spacing, icon directionality, truncation, wrapping, and long labels.
- Verify English LTR separately.
- Verify touch use on kitchen/cashier/driver screens.
- Verify low-literacy usability: short wording, large controls, icon + label, obvious feedback.

When uncertain about visual direction, follow `DESIGN-BRIEF.md`. Do not improvise a generic AI-generated design language.

## 4. Production completeness
A feature is not complete because the UI looks complete.

A production-complete vertical slice includes, where applicable:
1. UI and responsive behavior
2. Arabic + English localization
3. accessibility and low-literacy UX review
4. client-side validation
5. explicit API contract
6. server-side validation
7. authentication/authorization
8. domain/business rules
9. persistence and migrations
10. concurrency/idempotency considerations
11. real-time events when required
12. audit/logging where required
13. loading/error/empty/retry states
14. automated tests
15. documentation updates
16. successful production builds
17. committed and pushed Git changes

Do not leave production paths backed by mock data, hard-coded users, fake API responses, dead buttons, placeholder pages, critical TODOs, or bypassed authorization.

## 5. Architecture rules
- Frontend: Angular.
- Backend: ASP.NET Core / .NET.
- Start as a modular monolith. Do not introduce microservices without an explicit architectural decision.
- Organize code by business/domain feature rather than giant technical folders.
- Keep domain logic out of Angular components and controllers.
- Keep controllers/endpoints thin.
- Use explicit DTOs/contracts at API boundaries.
- Use a server-enforced order state machine. Never trust the client to choose arbitrary state transitions.
- Use SignalR for real-time operational updates.
- Payment and WhatsApp integrations must be behind provider interfaces/adapters.
- Use durable persistence. Never simulate production persistence with in-memory stores.
- Secrets must never be committed.
- Avoid architecture astronautics and unnecessary abstractions.

## 6. Roles
Support only documented roles unless explicitly approved:
- Guest Customer
- Registered Customer
- Kitchen Employee
- Cashier
- Driver
- Manager
- Admin

Every server-side action must enforce authorization independently of UI visibility.

## 7. Order lifecycle
Canonical lifecycle:
`Pending -> Confirmed -> Preparing -> Ready -> OnTheWay -> Delivered`

Additional exception/terminal states such as `Cancelled` or `FailedPayment` are permitted only when required by documented operational/payment flows. Define and test allowed transitions explicitly.

## 8. Code quality
- Prefer simple, readable production code over clever abstractions.
- Backend remains authoritative for business rules.
- Add tests for domain rules and important API behavior.
- Keep components focused and reusable.
- Do not create a “shared/common” dumping ground.
- Remove dead code and unused dependencies.
- Avoid broad dependencies for trivial functionality.
- Treat warnings as defects when practical.

## 9. Security
Follow `SECURITY.md`.
- Least privilege.
- Validate all external input server-side.
- Protect customer PII.
- Never log payment secrets or sensitive tokens.
- Rate-limit abuse-sensitive public endpoints.
- Use secure authentication/session handling.

## 10. Git is mandatory, not optional
Follow `GIT-WORKFLOW.md`.

For every meaningful task:
1. Work on a dedicated branch unless the task is explicitly a main-branch maintenance action.
2. Keep commits focused and descriptive.
3. Run the required build/test/lint/format checks before commit.
4. Commit meaningful completed work.
5. Push the current branch to `origin` before reporting completion.
6. Never finish a task with meaningful uncommitted changes.
7. Never claim completion if the branch has not been pushed successfully.
8. If push fails because of authentication/network/remote policy, report the exact failure and leave the local commit intact; do not pretend the task is complete.
9. Prefer a pull request for substantial features and cross-cutting changes.
10. Never force-push shared branches unless explicitly authorized.

Before finalizing a task, run and report:
- `git status`
- current branch
- latest commit
- push result

## 11. Workflow
Before a major phase:
1. Read relevant product/design/architecture docs.
2. Write a concise implementation plan.
3. Identify data model/API/state changes.
4. Implement as a vertical slice.
5. Run formatting, build, tests, and linting.
6. Review the actual UI at target viewport sizes.
7. Update docs and `PLANS.md` status.
8. Commit and push.

Do not mark work complete while builds/tests fail.

## 12. Definition of done
A task is done only if it works end-to-end in the intended user flow, is suitable for production review, and its completed changes are committed and pushed to the remote repository.
