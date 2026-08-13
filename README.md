# Bab Al Hara Restaurant Platform

Production bilingual restaurant ordering and operations platform. Arabic is the default RTL language; English is a first-class LTR language.

Phase 0 establishes the engineering and design foundation only. It intentionally contains no fake menu, order, dashboard, employee, payment, or reporting features.

## Technology baseline

- Angular 22.1 with standalone components, strict TypeScript, Vitest, ESLint, and Prettier
- ASP.NET Core on .NET 10 LTS with OpenAPI, RFC 7807 errors, JSON logs, correlation IDs, and health checks
- PostgreSQL 18 with EF Core 10 and reviewed migrations
- GitHub Actions for locked frontend and backend build/test gates

Important decisions are recorded in [`docs/adr`](docs/adr/README.md).

## Repository layout

```text
frontend/       Angular application and bilingual design-token proof
backend/src/    API, Application, Domain, and Infrastructure projects
backend/tests/  Architecture and API integration tests
infra/          Local dependency orchestration
codex/          Task instructions
```

## Prerequisites

- Node.js 24.19 or a compatible Node 24 release (`frontend/.nvmrc`)
- npm 10.9 or later
- .NET SDK 10.0.400 or a compatible 10.0 feature-band update (`global.json`)
- Docker with Compose, only if using the supplied local PostgreSQL service

## Local setup

### 1. Start PostgreSQL

Copy the placeholder file, replace its value locally, and keep the resulting `.env` untracked.

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f infra/compose.dev.yaml up -d database
```

Store the same local password in ASP.NET Core user secrets. The value below is deliberately a placeholder.

```powershell
dotnet user-secrets set "ConnectionStrings:Database" "Host=localhost;Port=5432;Database=bab_al_hara;Username=bab_al_hara;Password=<the local password>;Include Error Detail=false" --project backend/src/BabAlHara.Api
dotnet tool restore
dotnet ef database update --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api
```

Production connection strings must come from the deployment secret store. The application never auto-applies migrations on startup.

### 2. Run the API

```powershell
dotnet run --project backend/src/BabAlHara.Api
```

Development endpoints:

- liveness: `http://localhost:5181/health/live`
- readiness, including PostgreSQL: `http://localhost:5181/health/ready`
- OpenAPI document: `http://localhost:5181/openapi/v1.json`

### 3. Run Angular

```powershell
Set-Location frontend
npm ci
npm start
```

Open `http://localhost:4200`. The shell persists the chosen language locally and updates both `lang` and `dir` on the document.

## Quality gates

Frontend:

```powershell
Set-Location frontend
npm run check
```

Backend:

```powershell
dotnet restore backend/BabAlHara.sln --locked-mode
dotnet format backend/BabAlHara.sln --no-restore --verify-no-changes
dotnet build backend/BabAlHara.sln --configuration Release --no-restore
dotnet test backend/BabAlHara.sln --configuration Release --no-build --no-restore
```

Build the API container from the repository root:

```powershell
docker build --file backend/Dockerfile --tag bab-al-hara-api:local .
```

## Configuration and secrets

ASP.NET Core follows its standard configuration precedence: committed settings, environment-specific settings, user secrets in Development, environment variables, and command-line arguments. Use `ConnectionStrings__Database` for injected deployment configuration. Never commit `.env`, local settings, access tokens, provider secrets, or production credentials.

Frontend build-time defaults live in `frontend/src/environments`. They contain public routing configuration only; browser bundles must never contain secrets.
