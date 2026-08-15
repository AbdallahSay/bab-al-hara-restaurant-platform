# Bab Al Hara frontend

Angular 22 customer-ordering and kitchen application for Arabic RTL and English LTR experiences.

## Commands

```text
npm start              Development server
npm run build          Production build
npm test               One-shot unit tests
npm run lint           TypeScript and template lint
npm run format:check   Formatting verification
npm run check          Complete frontend quality gate
```

## Structure

- `app/core/config`: typed public application configuration
- `app/core/i18n`: language state, complete typed copy, and locale formatters
- `app/features/customer-ordering`: menu, persistent cart, checkout, receipt, and explicit API contracts
- `app/features/kitchen`: protected staff session, persisted queue retrieval, and SignalR recovery
- `app/shared`: direction-safe customer shell
- `environments`: public same-origin API and hub paths only

`npm start` uses `proxy.conf.json` so the Angular development server reaches the API and SignalR hub through the same browser origin. This preserves secure cookie and antiforgery semantics without enabling a permissive cross-origin production path.

Use logical CSS properties for direction-aware layout. Do not mirror semantically directional icons without review. Never put credentials or provider secrets in an Angular environment file.
