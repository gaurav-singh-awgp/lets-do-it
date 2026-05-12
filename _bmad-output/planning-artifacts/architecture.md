---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
lastStep: 8
status: complete
completedAt: "2026-05-02"
inputDocuments:
  - "./prd.md"
  - "./product-brief-todo-app.md"
  - "./ux-design-specification.md"
workflowType: architecture
project_name: lets-do-it
user_name: Gauravsingh
date: "2026-05-02"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements**

The PRD defines **10 FRs (FR-01–FR-10)** that imply a small **bounded context** around a single **Todo** resource:

- **Create (FR-01, FR-02):** HTTP create with validation (non-empty text, ≤500 code points); **201** + body with server-issued `id`, timestamps, and flags.
- **Read list (FR-03):** Single collection read with documented ordering (**`createdAt` descending**).
- **Update completion only (FR-04, FR-05):** Idempotent-friendly toggle of `done` without post-create text edit in V1.
- **Delete (FR-06):** Hard delete by id; **404** on repeat delete acceptable if documented.
- **Experience FRs (FR-07–FR-10):** Dedicated **empty**, **loading**, and **error** behaviors for the list surface; **accessible** distinction between completed and active items.

Architecturally, this maps to **one primary aggregate** (the todo list), **thin application services** over a repository, and a **client** that mirrors server state with clear loading/error boundaries—no need for event sourcing or multi-service choreography in V1.

**Non-Functional Requirements**

| Area | PRD driver | Architectural implication |
|------|------------|----------------------------|
| Latency | NFR-01, NFR-02, SC-03/04 | Predictable stack (framework + DB), minimal over-fetching, efficient list read for ≤500 rows; client avoids blocking the main thread on large renders. |
| Integrity | NFR-03 | Single-user sequential consistency; document **last-write-wins** on concurrent PATCH if ever exposed. |
| Security / ops | NFR-04, NFR-05, deployment note | TLS and env-based config in non-local environments; no secrets in repo. |
| Maintainability | NFR-06 | Monorepo or documented multi-package layout with **OpenAPI** (or equivalent) checked in or generated and linked from README. |
| Accessibility | NFR-07, Domain + UX | Semantic list/rows, named controls, axe-gated CI for add/complete/delete paths on the list view. |

**Scale & Complexity**

- **Primary domain:** Full-stack **web** (SPA or MPA per PRD/UX) + **JSON REST-style API** + **server-side persistence**.
- **Complexity level:** **Low** — single tenant implicit, no auth, no real-time fan-out, no multi-region requirement in V1.
- **Estimated architectural components (logical):** **Browser client** (list UI + data client), **HTTP API layer** (routing, validation, error mapping), **persistence adapter** (DB + migrations), **cross-cutting** concerns (logging/metrics for latency, static API description, CI for test + a11y).

### Technical Constraints & Dependencies

- **Stack shape:** PRD allows **SPA or MPA**; UX assumes **responsive** layout and **WCAG 2.1 AA** for primary flows.
- **API surface:** Stable prefix (e.g. `/api/v1/...`); JSON error shape consistent across endpoints.
- **Data:** Server-authoritative store with **documented migrations** for schema changes.
- **Extensibility:** V1 must **not** bake in client-only truth; resource model should admit a future **`user_id`** (or equivalent) without breaking the public API contract when auth ships.
- **SEO / shell:** Default **noindex** + stable **document title** when a public URL exists (PRD + UX)—implementation detail of the chosen client rendering model.
- **No epics/stories artifact** at architecture start; traceability stays **PRD ↔ UX ↔ this document** until CE is run.

### Cross-Cutting Concerns Identified

1. **Error and loading contract** — Shared shape for 4xx/5xx and timeouts; UI patterns (inline row vs banner + Retry) from UX must map to stable API behavior.
2. **Accessibility** — Keyboard order, focus management after add, toggle/delete naming, live regions for critical failures; enforced in CI (NFR-07).
3. **API documentation & developer experience** — README Run/Test/API blocks and machine-readable contract for NFR-06.
4. **Performance observability** — Enough timing visibility to validate NFR-01 in dev/staging (logs or APM hook points).
5. **Future auth** — Boundary between transport/session (future) and core todo domain should stay explicit in module layout.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web** — browser **SPA** (PRD allows MPA; UX targets a **single-page list** with client-side fetch/mutate) plus a **small JSON HTTP API** and **server-side database**, aligned with `./ux-design-specification.md` (React-oriented stack: **Tailwind + Radix** on the client).

### Starter Options Considered

| Option | Fit | Trade-off |
|--------|-----|-----------|
| **Vite + React + TypeScript** (`react-ts`) | Strong match to UX (React, fast HMR, Vitest-friendly); official, high-churn maintained path. | **Tailwind and Radix are not in the template** — add in the first implementation stories after scaffold. |
| **Next.js (App Router)** | One repo for UI + **Route Handlers** as API; good if you want SSR/SEO later. | Heavier runtime and conventions for a **no-SEO todo shell** in V1; still valid if you prefer one deployable. |
| **T3 / tRPC-heavy stacks** | Excellent TypeScript DX. | **Over-aligned with RPC** vs PRD’s explicit **REST + OpenAPI** story; more decisions to map back to JSON resources. |
| **create-fastify** (`npm init fastify`) | Official Fastify bootstrap: plugins/routes layout, aligns with **small JSON API**, Pino logging, test hooks. | Default may be **JS**; team may enable **TypeScript** via project options or a follow-up migration—confirm prompts at generation time. |

**Conclusion:** Use a **deliberate split scaffold**—**Vite `react-ts`** for the client and **`npm init fastify`** for the API—so REST boundaries, OpenAPI, and README “Run API + client” stay obvious (NFR-06). Optional later: fold into a formal monorepo tool (pnpm workspaces, Turborepo) without changing the product architecture.

### Selected Starter: Vite (react-ts) + create-fastify (composite)

**Rationale for Selection**

- Matches **low** PRD complexity: two small surfaces, clear **HTTP** contract.
- Matches UX: **React** + post-init **Tailwind + Radix** (per UX spec).
- Both ecosystems are **actively maintained** (verify package versions at `npm create` / `npm init` run time).
- Avoids locking the API into **tRPC** while still allowing **shared TypeScript types** via a future `packages/shared` if desired.

**Initialization commands**

Run from the repository root (adjust folder names to match your repo layout):

```bash
# HTTP API — official Fastify generator (follow CLI prompts; prefer TypeScript if offered)
npm init fastify@latest api

# SPA client — official Vite + React + TypeScript template
npm create vite@latest web -- --template react-ts
```

Then in each folder: `npm install` (or `pnpm install` / `yarn` if you standardize a package manager). **Node:** use a version compatible with the generated **Vite** baseline (see Vite docs at init time—typically **20.19+** or **22.12+**).

**Architectural decisions provided by starter**

**Language & runtime**

- Client: **TypeScript** + **ESM** via Vite defaults.
- Server: **Node** + Fastify plugin model (routes/plugins folder layout from generator).

**Styling solution**

- **None** in Vite `react-ts` out of the box — **follow-up:** add **Tailwind CSS** (v4 Vite plugin or documented v3 flow) to match UX.

**Build tooling**

- Client: **Vite** (dev server, HMR, Rollup production build).
- Server: Fastify’s generated **dev/start** scripts (exact scripts depend on generator output).

**Testing framework**

- Client: **Vitest** is the usual pairing with Vite (add if not present in template).
- Server: generator often includes **Tap** or **Node test** — keep one style per package; document in README **Test** section (NFR-06).

**Code organization**

- **Physical split:** `web/` (or `client/`) vs `api/` (or `server/`) supports independent versioning of client and API and a clear OpenAPI owner (API package).

**Development experience**

- Hot reload on client; Fastify **restart on change** per generated setup.
- **First story after init:** wire `web` dev server **proxy** or env-based **API base URL** for `/api/v1`, CORS for local dev, and README **Run** covering both processes.

**Note:** Executing these commands (or an equivalent documented scaffold) should be treated as the **first implementation story** before feature FR work.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation)**

- Persistence technology and migration story for the **Todo** entity.
- REST resource layout and **machine-readable API contract** (NFR-06).
- Client **server-state** strategy aligned with loading/error/retry (FR-08, FR-09, UJ-6).

**Important (shape the build)**

- Request/response **validation** library on the API.
- **CORS**, **security headers**, and **environment** configuration pattern.
- **CI** shape: unit/API tests + **axe** on list view (NFR-07).

**Deferred (Growth / post-V1)**

- Authentication, per-user isolation, rate limiting beyond basic abuse protection.
- Redis/caching layer, horizontal scaling, multi-region.
- **Next.js** or SSR if marketing/indexable surfaces ship (PRD Growth).

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | **PostgreSQL** (run **16+ or 17+** in dev/prod; pin exact minor in Docker/infra docs—verify [postgresql.org](https://www.postgresql.org/) at deploy time) | PRD allows SQL; strong migration story; natural path to **multi-user** later without changing engine. |
| **ORM / access** | **Drizzle ORM** + **`pg`** driver | Type-safe schema and SQL-ish migrations; lightweight fit with **Fastify**; `drizzle-kit` for migrations (document `generate` / `migrate` in README). |
| **Primary keys** | **UUID** (v4 or v7 per chosen library) for stable opaque ids | Avoid sequential id leakage if API is ever public; document chosen variant. |
| **Model** | Table **`todos`**: `id`, `text` (immutable after insert), `done`, `created_at`; optional nullable `updated_at` for PATCH auditing | Matches FR-01–FR-06; index on **`created_at DESC`** for list default. |
| **Validation** | **Zod** (or **Fastify type provider** + shared schemas) at HTTP boundary; enforce **500 code-point** rule in shared validator | Single source of truth for 4xx messages (FR-01, FR-02). |
| **Caching** | **None** in V1 | List size ≤500; NFR-01 achievable without Redis. |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Authentication** | **None** in V1 | PRD scope; no session middleware. |
| **Transport** | **HTTPS** in non-local deployments (NFR-04) | Terminate TLS at platform edge or reverse proxy; Fastify behind proxy uses `trustProxy` when documented. |
| **HTTP hardening** | **`@fastify/helmet`** (or equivalent headers plugin) | Baseline security for any accidental public exposure. |
| **CORS** | **Allowlist** via env (e.g. `WEB_ORIGIN`); dev allows Vite origin | SPA calling separate API port. |
| **Secrets** | **Environment only** (NFR-05); `DATABASE_URL` never committed | Aligns with PRD. |
| **Rate limiting** | **Optional** `@fastify/rate-limit` when API is internet-exposed | PRD default is private/local; turn on for public beta. |

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Style** | **REST/JSON** under **`/api/v1/todos`** (collection + `:id` member) | PRD; versioned prefix for evolution. |
| **Methods** | **GET** list, **POST** create, **PATCH** `done` only, **DELETE** by id | Maps to FR-03–FR-06; reject body fields that attempt text mutation with **400**. |
| **Documentation** | **`@fastify/swagger`** + **`@fastify/swagger-ui`** (or **Scalar** UI) generating **OpenAPI 3** JSON at a stable path | NFR-06 “API contract”; export `openapi.json` in repo or CI artifact. |
| **Errors** | Stable JSON envelope, e.g. `{ "error": { "code", "message", "requestId"? } }` with correct **4xx/5xx** | FR-09 and client `ErrorBanner` / inline retry. |
| **Logging** | **Pino** (Fastify default) + **request id** on every response | Debuggability for NFR-01/NFR-02 investigations. |

### Frontend Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **UI stack** | **React** + **Tailwind CSS** + **Radix UI** primitives (per UX spec) | Post–`react-ts` scaffold installs. |
| **Server state** | **TanStack Query (React Query) v5** for list fetch + mutations | First-class **loading/error/retry**, cache invalidation, fits UJ-6; add after Vite scaffold. |
| **Local UI state** | **React `useState`** for composer field; no global client store required in V1 | Keeps surface small. |
| **Routing** | **Single route** `/` for V1 list (optional **React Router** only if you prefer explicit future routes) | PRD/UX single surface. |
| **Data fetching** | **`fetch`** with a thin wrapper for base URL + JSON errors | Fewer deps. |
| **A11y testing** | **Vitest** + **Testing Library** + **jest-axe** / **vitest-axe** in CI for list flows; **Playwright** can duplicate critical paths for NFR-07 confidence | NFR-07 gate; see **QA integration — Project Setup**. |
| **Meta / SEO** | **`noindex`** + stable **`<title>`** via **`index.html`** or small head helper | PRD/UX; no SSR required for V1. |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Local data** | **Docker Compose** service `postgres` + documented **`DATABASE_URL`** | Repeatable dev for NFR-06 Run block. |
| **CI** | **GitHub Actions** (or equivalent): install, **lint**, **Vitest** (`api` + `web`), **Playwright** `tests/e2e`, **axe**/a11y on list view | Supports NFR-06/07; aligns with **QA integration — Project Setup**. |
| **Deploy target** | **Underspecified in V1** — any Node-friendly host + managed Postgres; document **health** in Growth (PRD) | PRD deployment default is local/private demo. |
| **Observability** | Structured logs; optional **OpenTelemetry** hook points later | Enough for P95 debugging without mandating APM vendor. |

### Decision Impact Analysis

**Implementation sequence (suggested)**

1. Scaffold **api** + **web** (Step 3 commands).  
2. Add **Postgres** compose, **Drizzle** schema + migrations, **Todo** repository.  
3. Implement **REST** routes + **Zod** + **OpenAPI** plugin; link spec in README.  
4. Add **web**: Tailwind, Radix, TanStack Query, list UI + states (FR-07–FR-10).  
5. Wire **proxy/env**, **CORS**, README **Run / Test / API contract**, CI jobs.

**Cross-component dependencies**

- OpenAPI and error envelope must match **client** error handling and QA scripts.  
- DB schema and PATCH semantics must match **immutable text** rule.  
- TanStack Query **mutation keys** should align with **retry** UX for idempotent-safe **GET**; document **POST** retry policy to avoid unintended duplicates where applicable.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical conflict points (where agents could diverge):** **12+** — DB/API JSON casing, route paths, error JSON shape, date serialization, test layout, TanStack Query mutation vs query keys, Drizzle table/column names vs API DTOs, logging field names, env var names, file naming for routes vs components.

### Naming Patterns

**Database naming conventions**

- **Tables:** `snake_case`, **plural** — `todos` (not `Todo` / `todo`).  
- **Columns:** `snake_case` — `id`, `text`, `done`, `created_at`, `updated_at`.  
- **Indexes:** `idx_<table>_<columns>` — e.g. `idx_todos_created_at_desc`.  
- **Drizzle TS identifiers:** `camelCase` in TS schema **mapped** to `snake_case` columns explicitly so agents do not mix styles silently.

**API naming conventions**

- **Paths:** plural resource **`/api/v1/todos`**; member **`/api/v1/todos/:id`** (OpenAPI param name: `id`).  
- **JSON body/response fields:** **`camelCase`** in HTTP JSON (matches TS/React ecosystem).  
- **Map at boundary:** DB `snake_case` ↔ API `camelCase` in one place (serializer layer or Drizzle `casing` strategy)—**never** leak DB column names into public JSON without team agreement.  
- **Headers:** standard casing per RFC; custom headers use **`X-`** only if unavoidable.

**Code naming conventions**

- **React components:** `PascalCase` files match export — `TodoRow.tsx` exporting `TodoRow`.  
- **Hooks:** `use` prefix — `useTodosQuery.ts`.  
- **Server files:** **`todo.routes.ts`**, **`todo.service.ts`** under `routes/` / `services/` (one style per package).  
- **Functions:** `camelCase` — `listTodos`, `createTodo`.  
- **Constants:** `SCREAMING_SNAKE` for true constants — `MAX_TODO_TEXT_CODE_POINTS`.

### Structure Patterns

**Project organization**

- **`api/`** — `src/routes/`, `src/services/` or `repositories/`, `src/db/` (schema + client), `src/plugins/`, `src/schemas/` (Zod).  
- **`web/`** — `src/components/`, `src/features/todos/` (optional), `src/lib/` (api client, query keys), `src/App.tsx`.  
- **Tests:** **co-located** `*.test.ts` / `*.test.tsx` next to source for units; **`tests/e2e/`** at repo root for Playwright if used.  
- **OpenAPI artifact:** committed `openapi/openapi.json` **or** documented URL path served in dev—link from README **API contract** (NFR-06).

**File structure patterns**

- **Env:** `.env.example` only in git; real `.env` gitignored in both packages.  
- **Compose:** `docker-compose.yml` at **repo root** with `postgres` service.  
- **Docs:** architecture + PRD paths referenced from root **README**; no duplicate “source of truth” for FR numbers.

### Format Patterns

**API response formats**

- **Success:** **Direct JSON** body — array for `GET /todos`, object for `POST`/`PATCH` single todo — **no** `{ data: ... }` wrapper unless team later standardizes; stay consistent on **all** endpoints.  
- **Errors:** Top-level **`{ "error": { "code": string, "message": string, "requestId"?: string, "details"?: unknown } }`**; HTTP status reflects class (400 validation, 404 missing).  
- **Dates:** **ISO 8601** strings in UTC with **`Z`** suffix — e.g. `"2026-05-02T12:00:00.000Z"`.

**Data exchange formats**

- **Booleans:** JSON `true` / `false` only.  
- **Null:** Omit optional fields or explicit `null`—**pick one** per field in OpenAPI; prefer **omit** for optional response fields.  
- **Lists:** Always JSON **arrays** for `GET /todos`; never single object wrapper.

### Communication Patterns

**Event system patterns**

- **N/A for V1** — no in-process domain event bus; use **direct service calls**. If added later: **`domain.todo.created`** style dot-lowercase names and versioned payloads.

**State management patterns**

- **Server state:** **TanStack Query** only — query key factory in **`src/lib/queryKeys.ts`** (or similar) — e.g. `todoKeys.all`, `todoKeys.detail(id)`.  
- **Mutations:** Use **`onSuccess`** to **`invalidateQueries(todoKeys.all)`** (or precise invalidation)—do not manually patch cache from multiple places without a shared helper.  
- **Immutability:** **Immutable** React state updates; never mutate `data` returned from Query cache in place.

### Process Patterns

**Error handling patterns**

- **API:** Central Fastify **`onError`** + consistent mapper from Zod/Fastify errors to **`error.code`**.  
- **Client:** Parse **`error.message`** for user copy; log **`requestId`** in dev only; **Retry** only for **GET** and **safe** user-confirmed mutation retries per UX.  
- **Boundaries:** Optional React **error boundary** for unexpected render errors; **list fetch errors** use UX **ErrorBanner** pattern, not only `console.error`.

**Loading state patterns**

- **Query keys:** Use **`isPending` / `isFetching`** from TanStack Query; name variables **`isLoadingTodos`** not ambiguous `loading`.  
- **Mutations:** Per-row **`isPending`** from `useMutation` for toggle/delete; disable controls while pending.  
- **Initial page:** Distinguish **skeleton** (no data yet) vs **refetch** (background) per UX spec.

### Enforcement Guidelines

**All AI agents MUST**

- Use the **error JSON** shape and **HTTP status** conventions above for every new route.  
- Keep **todo text immutable** after create in **service layer** tests and API tests.  
- Add or update **OpenAPI** when changing request/response shapes.  
- Put **DB migrations** in Drizzle-managed files only; never hand-edit production DB without a migration.  
- Run **formatter + linter** before merge; CI is source of truth.

**Pattern enforcement**

- **PR checklist:** links to OpenAPI diff + axe job log when UI changes.  
- **Violations:** Fix-forward in PR; update this doc if an exception is agreed.

### Pattern Examples

**Good examples**

- `GET /api/v1/todos` → `[{ "id": "…", "text": "Buy milk", "done": false, "createdAt": "2026-05-02T…Z" }]`  
- `PATCH /api/v1/todos/:id` with body `{ "done": true }` → `200` + updated todo object.  
- Zod rejects `{ "text": "new" }` on PATCH with **400** + validation detail under `error.details`.

**Anti-patterns**

- Mixing **`snake_case`** in JSON and **`camelCase`** in the same response.  
- Returning **500** for known validation failures.  
- **Optimistic** UI update without rollback path when server returns **4xx**.  
- **Icon-only delete** without accessible name (UX + a11y conflict).  
- **New todo** IDs generated on client.

## Project Structure & Boundaries

### Complete Project Directory Structure

Target layout after scaffold + agreed conventions (names may match your generator output; **normalize** to this shape over the first stories):

```text
lets-do-it/
├── README.md                          # NFR-06: Run, Test, API contract (links)
├── .gitignore
├── .env.example                       # DOCUMENTED only; no secrets
├── docker-compose.yml                 # postgres service + published port
├── package.json                       # root: workspaces (recommended) + test:e2e; see QA section
├── playwright.config.ts               # E2E: install @playwright/test at root
├── .github/
│   └── workflows/
│       └── ci.yml                     # lint, Vitest (api + web), Playwright e2e, axe/a11y job
├── openapi/                           # optional: committed OpenAPI snapshot
│   └── openapi.json                   # generated in CI or dev script
├── api/
│   ├── package.json                   # scripts: test = vitest run (see QA section)
│   ├── vitest.config.ts               # Node env; globals off unless team prefers
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── .env.example
│   ├── src/
│   │   ├── app.ts                     # Fastify build + register plugins/routes
│   │   ├── plugins/
│   │   │   ├── swagger.ts             # @fastify/swagger + UI
│   │   │   ├── cors.ts
│   │   │   ├── sensible.ts            # optional @fastify/sensible
│   │   │   └── env.ts                 # @fastify/env schema
│   │   ├── routes/
│   │   │   └── todos.ts               # GET/POST /api/v1/todos, PATCH/DELETE :id
│   │   ├── services/
│   │   │   └── todo.service.ts        # business rules (immutable text, done-only patch)
│   │   ├── repositories/
│   │   │   └── todo.repository.ts     # Drizzle queries
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle table todos
│   │   │   ├── client.ts              # pool + drizzle instance
│   │   │   └── migrations/            # drizzle-kit output (SQL files)
│   │   ├── schemas/
│   │   │   └── todo.zod.ts            # HTTP DTOs + code-point validation
│   │   └── lib/
│   │       ├── errors.ts              # map to { error: { code, message, requestId } }
│   │       └── mapTodo.ts             # DB row → API camelCase
│   └── src/app.test.ts                # example co-located test (adjust to layout)
├── web/
│   ├── package.json                   # scripts: test = vitest run (Vite plugin)
│   ├── vitest.config.ts               # jsdom + @testing-library/react; setupTests.ts
│   ├── vite.config.ts                 # dev proxy → api /api
│   ├── tsconfig.json
│   ├── tailwind.config.ts             # or .js / v4 postcss as chosen
│   ├── index.html                     # title + noindex meta for V1 public deploy
│   ├── .env.example                   # VITE_API_BASE_URL
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    # ListShell + providers (QueryClient)
│       ├── components/
│       │   ├── AddComposer.tsx
│       │   ├── TodoRow.tsx
│       │   ├── EmptyState.tsx
│       │   ├── ErrorBanner.tsx
│       │   └── ListShell.tsx
│       ├── lib/
│       │   ├── apiClient.ts           # fetch wrapper + error parse
│       │   └── queryKeys.ts           # todoKeys.*
│       ├── hooks/
│       │   └── useTodos.ts            # useQuery + useMutation composition (optional)
│       └── styles/
│           └── globals.css            # Tailwind entry
└── tests/
    └── e2e/                           # Playwright — required from Project Setup (smoke CRUD + a11y path)
        └── todo.spec.ts
```

### Architectural Boundaries

**API boundaries**

- **Public HTTP:** only **`/api/v1/todos`** collection and **`/api/v1/todos/:id`** member (plus **`/documentation`** or **`/openapi.json`** for contract in dev).  
- **No auth boundary** in V1 — no middleware stack for sessions/JWT.  
- **Data access:** routes → **service** → **repository** → Drizzle; routes **do not** import `db` directly except through thin wiring if generator disagrees—**converge** on service/repository for testability.

**Component boundaries**

- **`web`:** dumb presentational pieces (`TodoRow`) vs containers/hooks that call TanStack Query (`useTodos` / `App`).  
- **No cross-import** from `api` into `web` or vice versa; shared types live in optional future **`packages/shared`** — until then, **duplicate minimal DTO types** or generate client from OpenAPI (Growth).

**Service boundaries**

- **`todo.service`** owns immutability and “done-only” PATCH rules.  
- **`todo.repository`** owns SQL/Drizzle only.

**Data boundaries**

- **Single schema** `todos`; migrations are the only schema evolution path.  
- **No cache layer** in V1.

### Requirements to Structure Mapping

**FR category → location**

| FRs | Primary location |
|-----|------------------|
| FR-01–FR-06 (CRUD) | `api/src/routes/todos.ts`, `services/todo.service.ts`, `repositories/todo.repository.ts`, `schemas/todo.zod.ts` |
| FR-07–FR-10 (empty/loading/error/done styling) | `web/src/components/*`, `web/src/App.tsx`, `web/src/lib/apiClient.ts` |
| NFR-06 | `README.md`, `openapi/openapi.json` or served spec, CI workflow |
| NFR-07 | `web` tests co-located or `tests/e2e`, CI job |

**Cross-cutting**

| Concern | Location |
|---------|----------|
| Error envelope | `api/src/lib/errors.ts` + client `apiClient.ts` |
| Request id / logging | Fastify defaults + `onResponse` if needed |
| A11y | Radix + row components; tests beside components |

### Integration Points

**Internal communication**

- Browser **`fetch`** to **`VITE_API_BASE_URL`** + `/api/v1/todos`.  
- Vite **proxy** in dev forwards `/api` → `api` server.

**External integrations**

- **PostgreSQL** only in V1; no third-party APIs required.

**Data flow**

1. `GET` list: **web** Query → **api** route → service → repository → DB → camelCase mapping → JSON.  
2. **Mutations:** `POST`/`PATCH`/`DELETE` → service validation → DB → response → Query **invalidate**.

### File Organization Patterns

**Configuration:** root `docker-compose.yml`; per-package `package.json`, `tsconfig.json`, `drizzle.config.ts` (api), `vite.config.ts` (web).  
**Source:** feature-vertical on **server** (todos route + service + repo); **UI** by component role on **client**.  
**Tests:** co-located unit/integration; optional root **`tests/e2e`**.  
**Assets:** static files only if added later under `web/public/`.

### Development Workflow Integration

**Dev:** `docker compose up -d postgres` → `api` `npm run dev` → `web` `npm run dev` (document ports in README).  
**Build:** `web` → static `dist/`; `api` → compiled `dist/` or `build/` per tsconfig.  
**Deploy:** two artifacts or one host running Node for API + static CDN for `web`—document chosen path in README without mandating vendor.

### QA integration — Project Setup component

**Goal:** Establish **test infrastructure in the same milestone as repo scaffold**—not deferred—so NFR-06 (**Test** in README) and NFR-07 (axe on list view) have a home from day one.

| Layer | Tool | Scope |
|-------|------|--------|
| **Web unit / component** | **Vitest** + **@testing-library/react** + **jest-axe** (or **vitest-axe**) | Co-located `*.test.tsx`; list shell, add/toggle/delete, error states. |
| **API unit / integration** | **Vitest** (Node environment) or **`node:test`** if team prefers zero Vitest on server—**default here: Vitest** for one runner story | Route handlers with **injected/mocked DB** or **testcontainers**/compose Postgres for integration tests. |
| **E2E** | **Playwright** | Repo root **`playwright.config.ts`**, specs under **`tests/e2e/`**; run against **dev API + dev web** (or preview build); cover add → complete → delete smoke and feed **a11y** snapshot requirements. |

**`package.json` scripts (required conventions)**

- **`web`:** `"test": "vitest run"`, `"test:watch": "vitest"`, optional `"test:coverage": "vitest run --coverage"`.  
- **`api`:** `"test": "vitest run"`, `"test:watch": "vitest"`.  
- **Root (recommended):** use **npm workspaces** (`"workspaces": ["api", "web"]`) so root can expose:  
  - `"test": "npm run test --workspaces --if-present"` or explicit `"test:web"` / `"test:api"`;  
  - `"test:e2e": "playwright test"`;  
  - `"test:all": "npm run test && npm run test:e2e"` (document ordering: unit first, e2e needs servers up).  

If you **omit** a root workspace, README **Test** must still document the three invocations: `cd web && npm test`, `cd api && npm test`, `npm run test:e2e` from root with Playwright deps installed at root.

**README / CI**

- **README → Test:** how to run **web** Vitest, **api** Vitest, and **Playwright** (including one-liner or `docker compose` + both dev servers for e2e).  
- **CI:** job matrix or sequential steps: install → **lint** → **`api` test** → **`web` test** → **Playwright** (reuse official **Playwright GitHub Action** cache) → **axe** job on **web** as already specified for NFR-07.

**Implementation task breakdown (AI-friendly)**

1. Scaffold `api` + `web` (Starter Template Evaluation).  
2. Add **Vitest** + Testing Library + axe helpers to **`web`**; add **Vitest** to **`api`** with first smoke test (`expect(true)` → replace with route test).  
3. Add **Playwright** at root + **`tests/e2e/todo.spec.ts`** skeleton (pass with `test.skip` until app serves).  
4. Wire **`package.json` scripts** above; verify **`npm test`** paths locally.  
5. Extend CI to run the same commands.

## Deployment & containerization (Epic 4)

**Baseline (Epics 1–3):** Root **`docker-compose.yml`** provides **Postgres** only; **`api`** and **`web`** run on the **host** via Node (documented in README **Run**). This matches fast inner-loop development.

**Target (NFR-08 / Epic 4):** Add **`api/Dockerfile`** and **`web/Dockerfile`** (multi-stage builds, **non-root** runtime user where the base image supports it, minimal attack surface). Extend Compose with **`api`** and **`web`** services:

- **Networking:** Browser talks to **`web`** published port; SPA calls **`api`** using **`VITE_API_BASE_URL`** (or equivalent) pointing at the **host-mapped API port** or reverse-proxy path—document the chosen pattern so CORS (`WEB_ORIGIN`) and client env stay consistent.
- **Secrets:** **`DATABASE_URL`**, **`WEB_ORIGIN`**, and any API secrets are **runtime env** or **Compose `env_file`**, never baked into image layers.
- **Health:** Reuse **`GET /health`** on **api**; **web** image healthcheck performs HTTP **GET /** expecting **200**.
- **Profiles (optional):** e.g. **`postgres`**-only profile for developers who keep current workflow; **`full`** profile builds/runs all three services.

### `api` image (Story 4.1 — shipped)

| Topic | Decision |
|-------|-----------|
| **Build** | From repo root: `docker build -f api/Dockerfile -t lets-do-it-api:local .` |
| **Stages** | **builder:** `node:22-bookworm-slim`, `npm ci -w api`, `npm run build -w api`. **runner:** same base (slim), `wget` + `ca-certificates` for `HEALTHCHECK`, `npm ci -w api --omit=dev`, copy only `api/dist` from builder. |
| **WORKDIR / process** | **`WORKDIR /app/api`**; **`CMD ["node", "dist/server.js"]`** (matches `api/package.json` **`start`**). |
| **User** | **`USER node`** (UID **1000**, official image default). |
| **Port** | **`EXPOSE 3000`**; override with **`PORT`** at runtime. **`HOST`** defaults to **`0.0.0.0`** in `server.ts` if unset. |
| **Runtime env** | **`DATABASE_URL`** (required — migrations run at boot). **`WEB_ORIGIN`** (CORS allowlist; set to your SPA origin). Do not bake secrets into image layers. |
| **Health** | Dockerfile **`HEALTHCHECK`** runs **`/bin/sh -c`** with **`wget`** against **`http://127.0.0.1:${PORT:-3000}/health`** (shell default **3000** when **`PORT`** unset; `$$` in the Dockerfile becomes `$` in the embedded script). **`--start-period=60s`** allows cold migrations. |
| **Verification** | With **`docker compose`** unavailable on some hosts, use a **user-defined bridge network**: Postgres container + API container on the same network; **`DATABASE_URL`** host = Postgres **service name** (e.g. `postgres://todo:todo@<pg-container-name>:5432/todos`). On Docker Desktop, **`host.docker.internal`** also works against a Postgres bound to the host. Linux: **`--add-host=host.docker.internal:host-gateway`** when reaching host-published ports. |

### `web` image (Story 4.2)

| Topic | Decision |
|-------|-----------|
| **Build** | From repo root: `docker build -f web/Dockerfile -t lets-do-it-web:local .` Optional: `--build-arg VITE_API_BASE_URL=<browser-reachable API URL>` (default **`http://127.0.0.1:3000`** baked into the SPA for local demos). |
| **Stages** | **builder:** `node:22-bookworm-slim`, `npm ci -w web` (with **`api/package.json`** present for workspace lockfile), `npm run build -w web` → **`web/dist`**. **runner:** **`nginxinc/nginx-unprivileged:1.27-alpine`**, static files under **`/usr/share/nginx/html`**, config **`web/docker/default.conf`** → **`/etc/nginx/conf.d/default.conf`**. |
| **Port** | **`EXPOSE 8080`** — matches **`listen 8080`** in **`default.conf`** (unprivileged nginx). |
| **SPA routing** | **`try_files $uri $uri/ /index.html`** for client-side routes. |
| **User** | Base image runs **non-root** nginx worker model (no root-bound listener). |
| **Health** | **`HEALTHCHECK`** uses **`wget --spider`** against **`http://127.0.0.1:8080/`** (HTTP **200**). |
| **API from browser** | **`VITE_API_BASE_URL`** is a **build-time** value (see `web/src/api/todosClient.ts`). For Docker Compose in Story 4.3, pick a hostname:port the **host browser** can resolve (often **`http://127.0.0.1:<published-api-port>`**), and align **`WEB_ORIGIN`** on the API with the **web** URL (e.g. **`http://127.0.0.1:<published-web-port>`**). |

**TLS:** Termination at ingress/reverse proxy is acceptable; document that **NFR-04** applies to any internet-facing deployment.

## Architecture Validation Results

### Coherence Validation

**Decision compatibility**

Vite + React (SPA), Fastify, PostgreSQL, Drizzle, Zod, TanStack Query, and Docker Compose are compatible: Node LTS satisfies Vite and Fastify; `pg` + Drizzle is a standard pair; client **fetch** + JSON matches REST decisions; CORS + separate dev ports align with split package layout. No contradictory choices (e.g. no tRPC alongside mandated REST/OpenAPI).

**Pattern consistency**

Naming (`snake_case` DB, `camelCase` JSON), error envelope, and route layout match **Core Architectural Decisions** and **Implementation Patterns**. Structure places OpenAPI and error mapping on the **api** side and Query/cache rules on **web**—aligned.

**Structure alignment**

Directories map to route → service → repository flow, FR/NFR ownership, and README/CI gates. Boundaries prevent illegal cross-imports.

### Requirements Coverage Validation

**Epic/feature coverage**

Epics and stories live in **`_bmad-output/planning-artifacts/epics.md`** (Epics 1–4). Epic 4 covers **container images**, **full-stack Compose**, **coverage reporting**, and **assessor documentation** (NFR-08–NFR-11).

**Functional requirements**

FR-01–FR-10 are supported by API + UI paths and patterns (validation, PATCH semantics, list ordering, empty/loading/error, done styling, a11y testing hooks).

**Non-functional requirements**

NFR-01–NFR-05 addressed by stack choice, logging, HTTPS/secrets discipline, and test/observability hooks. NFR-06 via README + OpenAPI path + CI. NFR-07 via Testing Library + axe/Playwright strategy in **web** + CI. **NFR-08–NFR-11** via Epic 4 deliverables (Docker/Compose, coverage scripts and optional gate, `docs/qa/*`, BMAD/AI narrative).

### Implementation Readiness Validation

**Decision completeness**

Critical stack and integration choices are documented; exact **npm** minors are pinned at scaffold/lockfile time (documented expectation, not a gap in decision space).

**Structure completeness**

Concrete tree and integration points specified; agents can create files without guessing layout.

**Pattern completeness**

Naming, formats, errors, loading, Query invalidation, and anti-patterns are specified with examples.

### Gap Analysis Results

| Priority | Finding |
|----------|---------|
| **Critical** | None identified. |
| **Important** | **Epic 4** (containerization + coverage + assessor docs) is planned in epics—implement via **`bmad-create-story`** starting at **4.1**. |
| **Nice-to-have** | Optional **`packages/shared`** or OpenAPI-generated client; deeper **Playwright** coverage beyond smoke (infra is **required** at setup per **QA integration — Project Setup**). |

### Validation Issues Addressed

No open validation blockers; important gap is informational (CE optional before dev).

### Architecture Completeness Checklist

**Requirements analysis**

- [x] Project context thoroughly analyzed  
- [x] Scale and complexity assessed  
- [x] Technical constraints identified  
- [x] Cross-cutting concerns mapped  

**Architectural decisions**

- [x] Critical decisions documented (runtime versions verified at scaffold/deploy per sections above)  
- [x] Technology stack fully specified  
- [x] Integration patterns defined  
- [x] Performance considerations addressed  

**Implementation patterns**

- [x] Naming conventions established  
- [x] Structure patterns defined  
- [x] Communication patterns specified  
- [x] Process patterns documented  

**Project structure**

- [x] Complete directory structure defined  
- [x] Component boundaries established  
- [x] Integration points mapped  
- [x] Requirements-to-structure mapping complete  

### Architecture Readiness Assessment

**Overall status:** **READY FOR IMPLEMENTATION** (no critical gaps; all checklist items satisfied relative to PRD/UX + this document).

**Confidence level:** **High**

**Key strengths**

- Small bounded context with explicit REST, OpenAPI, and DB boundaries.  
- Patterns reduce agent conflict (JSON shape, casing, PATCH rules).  
- NFR-06/07 traceable to concrete files and CI.

**Areas for future enhancement**

- Auth, rate limiting, health endpoint, shared types package, generated API client.

### Implementation Handoff

**AI agent guidelines**

- Follow **Core Architectural Decisions** and **Implementation Patterns** for any new code.  
- Keep **api** / **web** boundaries; extend via migrations and OpenAPI updates.

**First implementation priority**

1. Run Step 3 scaffolds: `npm init fastify@latest api` and `npm create vite@latest web -- --template react-ts`.  
2. **Project Setup + QA integration:** add **Vitest** (and Testing Library + axe) to **`web`**, **Vitest** to **`api`**, **Playwright** at repo root with **`tests/e2e/`**, and **`package.json` test scripts** per **QA integration — Project Setup component**; document all commands in README **Test** (NFR-06).  
3. Align generated layout with **Project Structure & Boundaries**, then Postgres + Drizzle + first passing **GET /api/v1/todos**.  
4. Point CI at the same **`npm test`** / **`test:e2e`** commands so green main means tests are real, not aspirational.
