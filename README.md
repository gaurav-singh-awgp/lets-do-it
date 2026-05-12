# lets-do-it

Full-stack personal todo app (BMAD specs in `_bmad-output/planning-artifacts/`).

## Documentation

- **[Documentation index](docs/README.md)** — user guide, developer guide, and links to specs, QA evidence, BMad narrative, AI log, and implementation tracking.
- **[Using the app](docs/USER_GUIDE.md)** — end-user flows: add, complete, delete, errors, limits, keyboard.
- **[Developer guide](docs/DEVELOPER_GUIDE.md)** — repo layout, environment variables, tests, CI, where artifacts live.

## Run

From the repository root (requires Node **20.19+** or **22.12+** per architecture):

**1. Postgres (Docker)**

```bash
npm run compose:postgres
# equivalent: sh scripts/compose.sh up -d postgres
```

Uses `docker-compose.yml` at the repo root (`postgres:17-alpine`, database `todos`, user/password `todo`).

**Docker Compose CLI:** Some machines have the V2 plugin only (`docker compose`), others only standalone (`docker-compose`). Use **`scripts/compose.sh`** or the **`npm run compose:*`** scripts below — they pick whichever is installed.

**Full stack in Docker (Epic 4 — profile `full`)**

To run **Postgres + API + web** as containers (production-style images; no host Node for api/web):

```bash
npm run compose:full
# equivalent: sh scripts/compose.sh --profile full up -d --build
```

Stop the full stack when finished:

```bash
npm run compose:down
```

Then open **`http://127.0.0.1:9080/`** (static SPA). The API is published at **`http://127.0.0.1:3000/`** (health: **`/health`**). Compose sets **`WEB_ORIGIN`** to the web URL and builds the SPA with **`VITE_API_BASE_URL=http://127.0.0.1:3000`** so the browser can reach the API from the host. Do not run this at the same time as **`npm run dev:api`** on port **3000** (port conflict).

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

**CORS:** set **`WEB_ORIGIN`** in `api/.env` to the **single** origin the browser uses for the Vite app (default when unset: `http://127.0.0.1:5173`). The API does not accept a comma-separated list; use one URL only. The value is matched with **string equality** to the browser `Origin` header—use the same scheme (`http` vs `https`), host, port, and **no trailing slash** (e.g. `http://127.0.0.1:5173`, not `http://127.0.0.1:5173/`).

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

**Coverage (Vitest v8 — Epic 4 / NFR-09)**

```bash
npm run test:coverage              # HTML + lcov under api/coverage/ and web/coverage/ (gitignored)
npm run test:coverage:ci           # Same with ≥70% lines/statements/functions and ≥60% branches (set CI_COVERAGE_GATE)
```

For **`api`** integration coverage, set **`DATABASE_URL`** (e.g. match root Compose: `postgres://todo:todo@127.0.0.1:5432/todos`). CI runs **`test:coverage:ci`** after unit tests with **`DATABASE_URL`** from the workflow env.

**End-to-end (Playwright)**

```bash
npx playwright install chromium   # once per machine / CI image
npm run test:e2e                  # see playwright.config.ts (webServer + globalSetup)
```

**E2E wiring (same as `playwright.config.ts`)**

- **`webServer`** runs **`npm run dev:e2e`**, which starts the **API** and **Vite** together against Postgres.
- **`tests/e2e/global-setup.mjs`** runs **`sh scripts/compose.sh up -d`** when Docker is available (ignored if Compose errors, e.g. port **5432** already in use). Skipped automatically when **`CI=true`** (Postgres is already provided by the Actions service container).
- If **`DATABASE_URL`** is unset, Playwright defaults to **`postgres://todo:todo@127.0.0.1:5432/todos`** — aligned with `docker-compose.yml` and `api/.env.example`.

If the web server health check times out on first run, ensure port **5173** is free. You can run with **`CI=1`** so Playwright always starts a fresh dev server, but **`CI=1`** also skips the Compose startup in `global-setup.mjs`; start Postgres first with **`npm run compose:postgres`** (or provide a reachable **`DATABASE_URL`**).

**Lint**

```bash
npm run lint        # ESLint — `web` workspace only (`api` has no lint script yet)
```

**README structure guard (US-1.5.a)**

```bash
npm run check:readme   # fails if ## Run / ## Test / ## API contract are missing
```

**Continuous integration**

On **push** and **pull_request** to **`main`**, GitHub Actions (`.github/workflows/ci.yml`) runs **`npm ci`**, then **`npm run check:readme`**, **`npm run lint`**, **`npm run test:api`**, **`npm run test:web`**, **`npm run test:coverage:ci`** (Vitest coverage gate with **`DATABASE_URL`**), installs **Playwright Chromium**, and **`npm run test:e2e`** against a **Postgres 17** service with the same **`todo` / `todo` / `todos`** credentials as local Compose. The E2E step includes **`a11y-list-shell.spec.ts`** (NFR-07 axe gate: zero critical violations on empty state, populated list, error banner, composer validation, and full **add → complete → delete** flow, `ES-3.4.a`).

NFR-01 / NFR-02 performance measurements are not hard-gated in this CI workflow. Track them as a future vendor-neutral perf smoke (`ES-3.4.b` / backlog hook) using server timing logs or client marks before introducing a hard threshold.

**All automated tests (unit + e2e)**

```bash
npm run test:all
```

## API contract

With the API running (default **`http://localhost:3000`**):

- **OpenAPI UI (Swagger):** **`/documentation`** — e.g. `http://localhost:3000/documentation`
- **OpenAPI JSON (machine-readable):** **`/documentation/json`** — e.g. `http://localhost:3000/documentation/json`

Todo REST resources live under **`/api/v1/todos`**. **`GET /api/v1/todos`** returns a **bare JSON array** (no `{ "data": ... }` wrapper): objects use **camelCase** keys `id`, `text`, `done`, `createdAt`, sorted by **`createdAt` descending** (newest first). Errors use **`{ "error": { "code", "message", "requestId"?, "details"? } }`**.

**`POST /api/v1/todos`** accepts JSON **`{ "text": "…" }`**. On success it returns **201** with a single todo object in the same **camelCase** shape (`done` is always **`false`** on create). Empty / whitespace-only text, or text over **500 Unicode code points**, returns **400** with **`error.code`** **`VALIDATION`** (see OpenAPI for response shapes).

**`PATCH /api/v1/todos/:id`** updates **`done` only**. The body must be JSON **`{ "done": true }`** or **`{ "done": false }`** — there is **no** `text` field on PATCH (todo text is immutable after create). On success it returns **200** with the updated todo object. **`400`** **`VALIDATION`** when the body is malformed, includes extra keys, or attempts to set **`text`**; **`404`** **`NOT_FOUND`** when the id does not exist; **`400`** **`VALIDATION`** for a non-UUID id. Unexpected failures may return **`500`** **`INTERNAL`** with the same error envelope as other routes. See the OpenAPI JSON for full response shapes.

**`DELETE /api/v1/todos/:id`** performs a **hard delete**. On success it returns **204** with **no response body**. Returns **400** with **`error.code`** **`VALIDATION`** for an invalid UUID, and **404** with **`error.code`** **`NOT_FOUND`** when the id does not exist or has already been deleted (repeat delete also returns **404** — integrators should treat both first and repeat delete as idempotent from a UX perspective). See the OpenAPI JSON for full response shapes.

**`GET /health`** is a lightweight smoke check (not part of the versioned todo contract).
