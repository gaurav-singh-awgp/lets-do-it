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
npm run test:e2e                  # see playwright.config.ts (webServer + globalSetup)
```

**E2E wiring (same as `playwright.config.ts`)**

- **`webServer`** runs **`npm run dev:e2e`**, which starts the **API** and **Vite** together against Postgres.
- **`tests/e2e/global-setup.mjs`** runs **`docker compose up -d`** when Docker is available (ignored if Compose errors, e.g. port **5432** already in use).
- If **`DATABASE_URL`** is unset, Playwright defaults to **`postgres://todo:todo@127.0.0.1:5432/todos`** — aligned with `docker-compose.yml` and `api/.env.example`.

If the web server health check times out on first run, ensure port **5173** is free or run with **`CI=1`** so Playwright always starts a fresh dev server.

**Lint**

```bash
npm run lint        # ESLint — `web` workspace only (`api` has no lint script yet)
```

**README structure guard (US-1.5.a)**

```bash
npm run check:readme   # fails if ## Run / ## Test / ## API contract are missing
```

**Continuous integration**

On **push** and **pull_request** to **`main`**, GitHub Actions (`.github/workflows/ci.yml`) runs **`npm ci`**, then **`npm run check:readme`**, **`npm run lint`**, **`npm run test:api`**, **`npm run test:web`**, installs **Playwright Chromium**, and **`npm run test:e2e`** against a **Postgres 17** service with the same **`todo` / `todo` / `todos`** credentials as local Compose. **NFR-07** axe gates on full flows are **not** part of this workflow — they are tracked for later stories (e.g. **3.4** in the backlog).

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
