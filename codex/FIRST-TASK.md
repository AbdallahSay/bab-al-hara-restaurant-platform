# FIRST TASK — Production Foundation Only

## Goal
Establish a production-grade Full Stack repository foundation for Angular + ASP.NET Core/.NET without prematurely implementing restaurant business features.

## Mandatory first actions
1. Read all root documentation.
2. Inspect repository state, configured remotes, and current branch.
3. Confirm `origin` points to `AbdallahSay/bab-al-hara-restaurant-platform`.
4. Create and switch to `chore/project-foundation` unless already on an appropriate dedicated branch.
5. Produce a concise implementation plan before editing files.

## Foundation deliverables

### Frontend
Create a current stable Angular application in `frontend/` suitable for production development.
- standalone architecture where appropriate
- strict TypeScript
- routing
- environment configuration pattern
- i18n-ready architecture for Arabic RTL and English LTR
- global styling/tokens foundation based on `DESIGN-BRIEF.md`
- lint/format/test setup
- no restaurant feature pages beyond a minimal shell needed to prove the app runs
- avoid Angular-specific overengineering

### Backend
Create an ASP.NET Core Web API solution in `backend/` suitable for production development.
- clear modular-monolith project boundaries
- API project plus sensible domain/application/infrastructure separation only where justified
- OpenAPI
- global exception handling
- health checks
- structured logging baseline
- configuration/secrets pattern
- persistence foundation with a production relational database choice documented in an ADR
- EF Core migrations baseline if persistence is initialized
- test projects
- no fake business features

### Cross-cutting
- Docker/container-friendly local development approach if it adds clear value
- root commands/docs to run frontend and backend
- CI workflow for frontend + backend build/test
- formatting/linting
- `.env.example` only if needed, with no secrets
- update `README.md`
- add architecture decision records for important choices

## Design constraints
Do not create a generic dashboard demo. The only UI needed in this task is a polished minimal application shell/design-token proof showing:
- Arabic RTL toggle
- English LTR toggle
- typography
- button hierarchy
- form field
- status badge
- alert/feedback example

This proof exists only to validate the design system foundation; do not invent restaurant metrics or fake operational data.

## Quality gates
Before completion:
- frontend production build succeeds
- frontend tests/lint succeed if configured
- backend build succeeds
- backend tests succeed
- health endpoint works
- no secrets are committed
- no meaningful warnings are ignored without explanation
- documentation is updated

## Git requirement
Before reporting completion:
1. show `git status`
2. commit with a clear message, e.g. `chore: establish production full-stack foundation`
3. push `chore/project-foundation` to `origin`
4. verify push success
5. report branch name + commit SHA + commands used + test/build results

Do not claim completion if push fails.
