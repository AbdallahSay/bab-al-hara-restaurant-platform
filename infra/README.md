# Local infrastructure

`compose.dev.yaml` runs the durable dependency required by the foundation: Microsoft SQL Server 2025 CU7 Developer edition on Ubuntu 24.04.

The image uses `mcr.microsoft.com/mssql/server:2025-CU7-ubuntu-24.04`, the Microsoft tag for the July 2026 CU, pinned to manifest digest `sha256:86cc6144ef39bb0fbed2329e1ad79b13ee82e7b2e4739213a0db0800e668a74a` as verified on 2026-08-13. The digest makes the selected container content immutable. SQL Server 2025 remains in mainstream support through January 2031 and extended support through January 2036. The Ubuntu 24.04 image matches Microsoft's current supported container line and includes `/opt/mssql-tools18/bin/sqlcmd`, which the Compose health check uses. The image requires an x86-64 Docker host and at least 2 GB of memory.

Developer edition is for local development and CI only. Production edition, licensing, storage, backup, restore, and high availability are deployment decisions.

Copy the placeholder file and choose a strong local password. The resulting `.env` is ignored and must never be committed.

```powershell
Copy-Item .env.example .env
docker compose --env-file .env -f infra/compose.dev.yaml up -d database
docker compose --env-file .env -f infra/compose.dev.yaml ps
```

The container accepts the EULA explicitly, persists data in the `bab-al-hara-sqlserver` named volume at `/var/opt/mssql`, and exposes port 1433. Its health check authenticates with the runtime-injected password and executes `SELECT 1` over an encrypted client connection.

Stopping the service preserves its named volume:

```powershell
docker compose --env-file .env -f infra/compose.dev.yaml stop database
```

Do not reuse the local `sa` account in production. Inject a least-privileged application connection string from the deployment secret store.
