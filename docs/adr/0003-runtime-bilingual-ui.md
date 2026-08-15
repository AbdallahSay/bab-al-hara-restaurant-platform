# ADR 0003: Switch Arabic and English at runtime

- Status: Accepted
- Date: 2026-08-13

## Context

Arabic is the default and must be fully RTL, while English must be fully LTR. Users need to switch without loading a separately deployed application. Direction, spacing, accessible names, and persisted preference must change together.

## Decision

Use typed runtime translation catalogs for application chrome and a single language service that owns the current language, document `lang`, document `dir`, and local preference.

- Arabic is the safe default when no valid preference exists.
- CSS uses logical properties so layout follows direction without duplicated stylesheets.
- Noto Sans Arabic is self-hosted to avoid a runtime font-provider dependency and supports both scripts consistently.
- Product content returned by future APIs will expose explicit Arabic and English fields; it will not be embedded in the shell catalog.
- Language and direction behavior are unit tested. Every product slice must review Arabic and English at its target viewport.

## Consequences

- Catalog keys remain compile-time checked and easy to review.
- Translators need a maintained workflow as the catalog grows; adopting a translation management format can be decided when that need exists.
- Any directional icon must be reviewed semantically rather than mirrored automatically.
