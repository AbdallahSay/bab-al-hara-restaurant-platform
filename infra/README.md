# Local infrastructure

`compose.dev.yaml` runs only the durable dependency needed by the current foundation: PostgreSQL 18.4.

The password is required through an untracked `.env` file. No default credential or trust authentication is provided. PostgreSQL 18 stores versioned data under `/var/lib/postgresql`, so the named volume intentionally targets that path.

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f infra/compose.dev.yaml up -d database
docker compose --env-file .env -f infra/compose.dev.yaml ps
```

Stopping the service preserves its named volume:

```powershell
docker compose --env-file .env -f infra/compose.dev.yaml stop database
```
