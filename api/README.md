# `api` — Fastify todo service

JSON REST API under **`/api/v1/todos`**, **OpenAPI** at **`/documentation`**, **PostgreSQL** via **Drizzle**.

## Documentation

- **Run / test / contract:** root [**README**](../README.md)  
- **Developer guide:** [**docs/DEVELOPER_GUIDE.md**](../docs/DEVELOPER_GUIDE.md)  
- **Doc index:** [**docs/README.md**](../docs/README.md)

## Scripts (this package)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server with migrations (needs **`DATABASE_URL`**). |
| `npm run test` | Vitest unit + integration (integration needs **`DATABASE_URL`**). |
| `npm run db:migrate` / `npm run db:generate` | Drizzle migrations (see root README). |
