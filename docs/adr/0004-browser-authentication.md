# ADR 0004: Use same-origin secure cookie sessions for staff and customers

- Status: Accepted
- Date: 2026-08-13

## Context

The Angular client needs production-safe authentication for customers and restaurant staff. Long-lived bearer tokens in browser storage increase the impact of cross-site scripting, while UI-only role checks are not authorization.

## Decision

When identity is implemented, use ASP.NET Core Identity with same-origin, `HttpOnly`, `Secure`, appropriately `SameSite` cookies for browser sessions.

- The Angular application will not store session tokens in `localStorage` or `sessionStorage`.
- State-changing requests will use antiforgery protection.
- Login and recovery endpoints will be rate limited and return non-enumerating errors.
- Server policies will authorize every protected operation independently of UI visibility.
- Session renewal, revocation, password hashing, lockout, and security-stamp behavior will use supported ASP.NET Core Identity mechanisms.
- Guest checkout remains a distinct, narrowly scoped flow and does not silently create an account.

## Consequences

- Frontend and API should be served from the same site in production; cross-origin development requires explicit credentialed CORS and antiforgery configuration.
- Native or third-party clients may require a separate standards-based token flow. That need must be documented in a new ADR rather than weakening browser storage rules.
- Identity schema and policies will be introduced with the first authenticated vertical slice, not as fake foundation users or roles.
