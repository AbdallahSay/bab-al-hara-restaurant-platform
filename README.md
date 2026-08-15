# Bab Al Hara Restaurant Platform

Production bilingual restaurant ordering and operations platform. Arabic is the default RTL language; English is a first-class LTR language.

The first production vertical slice is implemented: bilingual customer menu, persistent cart, guest cash checkout, authoritative SQL Server order creation, and an authenticated realtime kitchen queue.

## Technology baseline

- Angular 22.1 with standalone components, strict TypeScript, Vitest, ESLint, and Prettier
- ASP.NET Core on .NET 10 LTS with OpenAPI, RFC 7807 errors, JSON logs, correlation IDs, and health checks
- Microsoft SQL Server 2025 with EF Core 10 and reviewed SQL Server-only migrations
- GitHub Actions for locked frontend and backend build/test gates

Important decisions are recorded in [`docs/adr`](docs/adr/README.md).

## Repository layout

```text
frontend/       Angular customer ordering and kitchen applications
backend/src/    API, Application, Domain, and Infrastructure projects
backend/tests/  Architecture and API integration tests
infra/          Local dependency orchestration
codex/          Task instructions
```

## Prerequisites

- Node.js 24.19 or a compatible Node 24 release (`frontend/.nvmrc`)
- npm 10.9 or later
- .NET SDK 10.0.400 or a compatible 10.0 feature-band update (`global.json`)
- Docker with Compose on an x86-64 host with at least 2 GB available to the supplied SQL Server service

## Local setup

### 1. Start Microsoft SQL Server

Copy the placeholder file, replace its value locally, and keep the resulting `.env` untracked.

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f infra/compose.dev.yaml up -d database
```

Store the same local password in ASP.NET Core user secrets. The value below is deliberately a placeholder.

```powershell
dotnet user-secrets set "ConnectionStrings:Database" "Server=localhost,1433;Database=bab_al_hara;User Id=sa;Password=<the local password>;Encrypt=True;TrustServerCertificate=True;Connect Timeout=5;Command Timeout=30" --project backend/src/BabAlHara.Api
dotnet user-secrets set "DevelopmentSeed:KitchenPassword" "<a strong local kitchen password>" --project backend/src/BabAlHara.Api
dotnet tool restore
dotnet ef database update --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api
dotnet run --project backend/src/BabAlHara.Api -- --seed-data
```

Production connection strings must come from the deployment secret store, use a least-privileged login, require trusted certificate validation, and never use the local `sa` account. The application never auto-applies migrations on startup. The Compose image and support rationale are documented in [`infra/README.md`](infra/README.md).

### 2. Run the API

```powershell
dotnet run --project backend/src/BabAlHara.Api
```

Development endpoints:

- liveness: `http://localhost:5181/health/live`
- readiness, including SQL Server connectivity: `http://localhost:5181/health/ready`
- OpenAPI document: `http://localhost:5181/openapi/v1.json`

### 3. Run Angular

```powershell
Set-Location frontend
npm ci
npm start
```

Open `http://localhost:4200`. The shell persists the chosen language locally and updates both `lang` and `dir` on the document.

Customer ordering starts at `http://localhost:4200/`. The protected kitchen screen is at `http://localhost:4200/kitchen`; its deterministic Development-only account is `kitchen@bab-al-hara.local` with the password supplied through `DevelopmentSeed:KitchenPassword`. No account or password is created in Production, and the seed command refuses to run outside Development.

### Customer-to-kitchen realtime check

1. Open `/kitchen`, sign in, and leave the kitchen queue visible. Choose **Enable sound alert** if an audible alert is wanted; browser policy requires this user gesture.
2. In a second browser context, open `/`, add an available item, and continue through the cart.
3. Complete guest checkout as Takeaway or Delivery and choose Cash (the only implemented payment method).
4. Confirm that the success page shows a `BH-...` public code only after the API returns `201 Created`.
5. Confirm that the same code appears on the kitchen screen without refresh.
6. Refresh `/kitchen` and confirm that the order is recovered from `GET /api/kitchen/orders/active` and SQL Server.

## Quality gates

The SQL Server model contains catalog, delivery, ordering, order-item snapshot, and ASP.NET Core Identity tables. Monetary properties use explicit `decimal(18,2)` and never `float` or `double`; order timestamps use `datetimeoffset(7)`. Relationships, indexes, unique public codes, bounded strings, and delete behavior are explicit in the EF configuration.

Verify the migration model without connecting to a database:

```powershell
dotnet tool restore
dotnet ef migrations has-pending-model-changes --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api
dotnet ef migrations script --idempotent --project backend/src/BabAlHara.Infrastructure --startup-project backend/src/BabAlHara.Api --output migration.sql
```

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
dotnet list backend/BabAlHara.sln package --vulnerable --include-transitive
```

Build the API container from the repository root:

```powershell
docker build --file backend/Dockerfile --tag bab-al-hara-api:local .
```

## Configuration and secrets

ASP.NET Core follows its standard configuration precedence: committed settings, environment-specific settings, user secrets in Development, environment variables, and command-line arguments. Use `ConnectionStrings__Database` for injected deployment configuration. Never commit `.env`, local settings, access tokens, provider secrets, or production credentials.

Frontend build-time defaults live in `frontend/src/environments`. They contain public routing configuration only; browser bundles must never contain secrets.

The ordering integration tests require a reachable SQL Server. Locally they default to `Server=.\MSSQLSERVER01` with Windows integrated authentication. CI and other environments provide `BAB_AL_HARA_TEST_SQLSERVER`; the fixture creates and deletes an isolated database and applies real EF migrations.
