# SECURITY.md — Production Security Baseline

## Principles

- Least privilege.
- Deny by default for privileged actions.
- Server-side validation and authorization are authoritative.
- Minimize stored personal data.
- Never trust browser/UI state for security decisions.

## Authentication/session

- Use a production-supported authentication strategy appropriate for Angular + ASP.NET Core.
- Secure session/token storage and renewal.
- Protect login endpoints against brute force/credential stuffing.
- Passwords must be handled only through trusted identity/password hashing mechanisms.
- Administrative roles require stronger operational controls and auditability.

## Authorization

- Role/policy authorization on every protected backend operation.
- Hidden UI is not authorization.
- Drivers access only assigned deliveries.
- Kitchen/cashier privileges are constrained to their operational actions.
- Manager/Admin mutations are auditable.

## Input and output safety

- Validate all request DTOs server-side.
- Constrain lengths, numeric ranges, enums, file types, and uploaded image sizes.
- Encode output correctly to prevent injection/XSS.
- Avoid rendering user-provided HTML.

## Payments

- Never store raw card data.
- Treat Paymob server/webhook confirmation as authoritative according to provider integration rules.
- Verify webhook authenticity.
- Make webhook handling idempotent.
- Never log payment secrets or sensitive provider payload fields unnecessarily.

## Customer data

Protect:

- names
- phone numbers
- addresses
- order history

Avoid exposing them in logs, analytics, or unauthorized roles.

## API protections

- HTTPS only in production.
- Secure CORS configuration.
- CSRF protection if cookie-based auth is used.
- Rate limiting for public/login/order-tracking abuse-sensitive endpoints.
- Request size limits.
- Safe error responses without stack traces or secrets.

## Secrets

- No secrets in source control.
- Use environment/secret-store configuration.
- Rotate compromised credentials.

## Database access

- Inject SQL Server credentials through user secrets, environment variables, or the deployment secret store.
- Local development and CI may use the container `sa` account; deployed applications use a dedicated least-privileged login.
- Keep transport encryption enabled. `TrustServerCertificate=True` is limited to local development and CI; production validates a trusted server certificate.
- Do not log connection strings, credentials, or database exception details that can expose customer data.
- Apply migrations as an authenticated deployment operation, not during application startup.
- Restrict network reachability to approved application and operations hosts.

## Audit trail

Record security/operations-relevant events such as:

- admin employee changes
- role/permission changes
- refunds
- sensitive order cancellations
- driver assignment changes when operationally important

## Dependencies

- Keep frontend/backend dependencies intentionally small.
- Pin versions in lock files/manifests.
- Run dependency/security checks in CI where available.
