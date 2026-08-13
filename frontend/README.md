# Bab Al Hara frontend

Angular 22 application foundation for Arabic RTL and English LTR experiences.

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
- `app/core/i18n`: language state and typed shell catalogs
- `app/platform/foundation`: the minimal design-token and component-state proof
- `environments`: development/production public API base URLs

The foundation proof is not a restaurant feature screen. New product work must follow the documented feature boundaries and provide Arabic, English, responsive, error, loading, empty, and permission states where applicable.

Use logical CSS properties for direction-aware layout. Do not mirror semantically directional icons without review. Never put credentials or provider secrets in an Angular environment file.
