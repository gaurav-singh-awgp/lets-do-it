# Developer guide — lets-do-it

Monorepo (**npm workspaces**): **`api`** (Fastify + PostgreSQL + Drizzle) and **`web`** (Vite + React + TypeScript). Commands and ports are defined in detail in the root [**README**](../README.md); this guide orients contributors and links everything else.

---

## Repository layout

| Path | Purpose |
|------|---------|
| **`api/`** | HTTP API, migrations, Dockerfile, Vitest (unit + integration with `DATABASE_URL`). |
| **`web/`** | SPA, Vitest + Testing Library, Dockerfile. |
| **`tests/e2e/`** | Playwright specs, `global-setup.mjs` for optional local Compose. |
| **`docker-compose.yml`** | Postgres service; optional **`full`** profile for api + web images. |
| **`.github/workflows/ci.yml`** | CI: readme check, lint, tests, coverage gate, Playwright. |
| **`_bmad-output/planning-artifacts/`** | PRD, UX, architecture, epics (source of truth for behavior). |
| **`_bmad-output/implementation-artifacts/`** | Story files, `sprint-status.yaml`, retros, `deferred-work.md`. |
| **`docs/`** | This documentation set, QA index, BMad narrative, AI log. |

---

## Prerequisites

- **Node** **20.19+** or **22.12+** (see architecture).
- **Docker** (recommended) for Postgres and optional full-stack Compose.
- **npm** at repo root (`npm install`).

---

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| **`DATABASE_URL`** | `api/.env`, CI, Playwright | PostgreSQL connection string (required for API and API integration tests). |
| **`WEB_ORIGIN`** | `api/.env` | Single browser **Origin** allowed by CORS (string equality; no trailing slash mismatch — see README). |
| **`VITE_API_BASE_URL`** | `web` build / dev | Base URL for browser calls to the API (Compose sets this for static build). |

Copy **`api/.env.example`** → **`api/.env`** and adjust.

---

## Common commands

Run from repository root unless noted:

```bash
npm install
npm run db:migrate -w api     # apply schema
npm run dev:api               # terminal 1
npm run dev:web               # terminal 2
npm run test                  # workspace unit tests
npm run test:e2e              # Playwright (needs Chromium + DB)
npm run lint
npm run check:readme
```

Coverage and CI-style gates: **`npm run test:coverage`**, **`npm run test:coverage:ci`**. See README **Test** and **`docs/qa/index.md`**.

---

## Testing conventions

- **Unit / component:** Vitest in **`api`** and **`web`**.
- **Integration (API):** Vitest + Fastify `inject` + real DB when **`DATABASE_URL`** is set; otherwise those suites may skip.
- **E2E:** Playwright under **`tests/e2e/`**; **`npm run dev:e2e`** starts API + web for the harness.

Story-driven scenario IDs (for traceability to **`epics.md`**) are summarized in the root **`CONTRIBUTING.md`**:

- **`US-n.m.*`** — unit tests for story *n.m*
- **`IS-n.m.*`** — integration
- **`ES-n.m.*`** — E2E

---

## API and OpenAPI

- Base path: **`/api/v1/todos`** (list, create, patch `done`, delete).
- **OpenAPI UI:** **`/documentation`** on the API host.
- **JSON:** **`/documentation/json`**.

Error envelope: **`{ "error": { "code", "message", "requestId"?, "details"? } }`**. Full behavior is in README **API contract** and OpenAPI.

---

## Continuous integration

GitHub Actions on **`main`**: readme headings, lint, API + web tests, Vitest coverage gate with Postgres service, Playwright + axe list flows. See README **Continuous integration** and **`.github/workflows/ci.yml`**.

---

## BMad and documentation map

Product and delivery artifacts:

1. **Planning** — `_bmad-output/planning-artifacts/` (`prd.md`, `ux-design-specification.md`, `architecture.md`, `epics.md`, readiness reports).
2. **Implementation tracking** — `_bmad-output/implementation-artifacts/sprint-status.yaml` and per-story `*.md` files.
3. **Human-facing summaries** — `docs/bmad-implementation-narrative.md`, `docs/ai-integration-log.md`, `docs/qa/index.md`.
4. **AI assistant rules** — `_bmad-output/project-context.md`.

Sprint workflow skills (if using Cursor/BMad) live under **`.claude/skills/`** in this repo; see BMad help catalog in **`_bmad/_config/bmad-help.csv`**.

---

## Deferred and follow-up work

Known technical follow-ups that are **not** blocking the core loop are listed in **`_bmad-output/implementation-artifacts/deferred-work.md`**.

---

## User-facing behavior

For non-developer instructions (adding todos, errors, keyboard), see the **[User guide](USER_GUIDE.md)**.
