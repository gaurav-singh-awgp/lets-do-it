# lets-do-it

Full-stack personal todo app (BMAD specs in `_bmad-output/planning-artifacts/`).

## Run

From the repository root (requires Node **20.19+** or **22.12+** per architecture):

**1. Postgres (Docker)**

```bash
docker compose up -d postgres
# or: docker-compose up -d postgres
```

Uses `docker-compose.yml` at the repo root (`postgres:17-alpine`, database `todos`, user/password `todo`).

**2. API env and schema**

```bash
cp api/.env.example api/.env   # if you do not already have api/.env
npm install
npm run db:migrate -w api      # apply Drizzle migrations (required before first API start)
```

`DATABASE_URL` must match Compose (see `api/.env.example`).

**Schema / migrations:** `npm run db:migrate -w api` and API startup both invoke the same Drizzle migrator against `api/src/db/migrations` (idempotent via the migration table). Use the CLI when you want the schema applied **without** starting the server (CI, provisioning). Starting `dev:api` still runs migrations so local stacks self-heal if you skip the CLI after the database exists.

**3. Dev servers**

```bash
npm run dev:api   # Fastify API — default http://localhost:3000
npm run dev:web   # Vite client — default http://127.0.0.1:5173
```

Run **api** and **web** in **separate terminals**.

**CORS:** set **`WEB_ORIGIN`** in `api/.env` to the **single** origin the browser uses for the Vite app (default when unset: `http://127.0.0.1:5173`). The API does not accept a comma-separated list; use one URL only.

**Drizzle (from `api/`)**

- Generate SQL after editing `api/src/db/schema.ts`: `npm run db:generate -w api`
- Apply migrations: `npm run db:migrate -w api`

## Test

**Unit / component (Vitest)**

```bash
npm run test:api    # API — Node environment
npm run test:web    # Web — jsdom + Testing Library
npm run test        # All workspace test scripts
```

**End-to-end (Playwright)**

```bash
npx playwright install chromium   # once per machine / CI image
npm run test:e2e                  # starts Vite on 127.0.0.1:5173 (see playwright.config.ts)
```

If the web server health check times out on first run, ensure port **5173** is free or run with `CI=1` so Playwright always starts a fresh dev server.

**All automated tests (unit + e2e)**

```bash
npm run test:all
```

## API contract

With the API running (default **`http://localhost:3000`**):

- **OpenAPI UI (Swagger):** **`/documentation`** — e.g. `http://localhost:3000/documentation`
- **OpenAPI JSON (machine-readable):** **`/documentation/json`** — e.g. `http://localhost:3000/documentation/json`

Todo REST resources live under **`/api/v1/todos`**. **`GET /api/v1/todos`** returns a **bare JSON array** (no `{ "data": ... }` wrapper): objects use **camelCase** keys `id`, `text`, `done`, `createdAt`, sorted by **`createdAt` descending** (newest first). Errors use **`{ "error": { "code", "message", "requestId"?, "details"? } }`**.

**`GET /health`** is a lightweight smoke check (not part of the versioned todo contract).
