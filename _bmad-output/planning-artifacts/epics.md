---
stepsCompleted:
  - step-01-requirements-extraction
  - step-02-epic-design
  - step-03-stories
  - step-04-final-validation
inputDocuments:
  - "./prd.md"
  - "./architecture.md"
  - "./ux-design-specification.md"
  - "./product-brief-todo-app.md"
workflowNotes: "CE completed in a single session; formal step menus waived to deliver the artifact. Per-story Test scenarios (unit/integration/E2E) added for QA traceability. Edit this file if you adjust scope."
---

# lets-do-it - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **lets-do-it**, decomposing requirements from the PRD, UX design specification, and architecture into implementable stories. V1 is an unauthenticated personal todo web app with a split **Fastify API** + **Vite React** client, **PostgreSQL** via **Drizzle**, **TanStack Query**, and **REST + OpenAPI** under `/api/v1/todos`.

## Test strategy (unit · integration · E2E)

Test expectations are **first-class**: every story below includes a **Test scenarios** block alongside acceptance criteria so dev and QA share the same contract.

| Level | Meaning in this backlog | Default tooling |
|-------|-------------------------|-------------------|
| **Unit** | One module or component in isolation; external I/O mocked or faked | **Vitest** — `api`: Node env; `web`: jsdom + **Testing Library** |
| **Integration** | Two or more real layers (e.g. HTTP handler + DB, or React tree + MSW `fetch`) without a full browser driver | **Vitest** — Fastify `inject`, test database / **testcontainers**, or **MSW** for the client |
| **E2E** | Browser exercises a running **web + api** (and DB when required) as a user would | **Playwright** under `tests/e2e/` |

**Scenario IDs** (use in test titles or tags for traceability):

- **`US-n.m.*`** — unit for Story *n.m*
- **`IS-n.m.*`** — integration for Story *n.m*
- **`ES-n.m.*`** — E2E for Story *n.m*

**Non-goals:** E2E does not replace unit tests for validation edge cases; unit tests do not replace E2E for cross-origin, routing, or real network timing.

## Requirements Inventory

### Functional Requirements

FR-01: User can **create** a todo with **non-empty** text (reject empty/whitespace-only with 4xx + message; valid create returns 201 with `id`, `text`, `done`, `createdAt`).

FR-02: Text length **≤ 500** Unicode code points (configurable constant); submission beyond max returns 4xx; DB never stores beyond limit.

FR-03: User can **list** all todos (GET returns array; stable sort: **`createdAt` descending** unless changed by explicit future FR).

FR-04: User can **mark** todo completed (PATCH sets `done=true`; persisted; reflected on reload).

FR-05: User can **mark** todo active again (sets `done=false`; persisted).

FR-06: User can **delete** todo by id (DELETE removes row; subsequent GET does not return it; 404 on repeat delete acceptable if documented).

FR-07: User sees **empty state** when zero todos (dedicated empty UI, not blank table).

FR-08: User sees **loading** indicator during initial fetch (shown until success or error).

FR-09: User sees **error** UI on failed fetch or mutation (human-readable message; retry or reload path).

FR-10: **Completed** items visually distinct from active (strikethrough **or** muted style + `aria` / `data-state` for assistive tech).

### NonFunctional Requirements

NFR-01: API CRUD **P95 ≤ 200 ms** processing under baseline load (single user, ≤ 500 todos).

NFR-02: UI reflects successful mutations **≤ 1 s P95** after server OK under normal conditions.

NFR-03: Concurrent requests: no data loss for **single-user** sequential ops (last-write-wins acceptable on same record if documented).

NFR-04: **HTTPS** required in non-local production.

NFR-05: **Secrets** not committed; configuration via env (secret scan in CI recommended).

NFR-06: Root **README** on main branch **must** contain explicit **Run**, **Test**, and **API contract** blocks (link or path to OpenAPI or equivalent); verified on release candidates.

NFR-07: Default branch CI **must** run automated a11y checks (e.g. axe) on the **main list view** (add/complete/delete paths exercised); **zero critical** violations on the checked snapshot.

### Additional Requirements

- **Starters:** Scaffold **`api`** with `npm init fastify@latest` (TypeScript preferred) and **`web`** with `npm create vite@latest web -- --template react-ts`; align layout with architecture tree (`api/`, `web/` at repo root).
- **Database:** PostgreSQL 16+ or 17+; **Drizzle ORM** + `pg`; UUID primary keys; table **`todos`**: `id`, `text` (immutable after insert), `done`, `created_at` (+ optional `updated_at`); index supporting **`created_at DESC`** list default.
- **API:** REST JSON under **`/api/v1/todos`**; **GET** list, **POST** create, **PATCH** `done` only (reject text mutation with **400**), **DELETE** by id; **camelCase** JSON at HTTP boundary; **snake_case** DB columns; map at boundary per architecture.
- **Errors:** Stable JSON envelope `{ "error": { "code", "message", "requestId"?, "details"? } }`; correct HTTP status classes.
- **Docs:** `@fastify/swagger` (+ UI or Scalar) producing **OpenAPI 3**; committed or generated artifact linked from README.
- **Validation:** **Zod** (or Fastify type provider) at HTTP boundary; shared max text constant.
- **Security baseline:** `@fastify/helmet`, CORS allowlist via env (e.g. `WEB_ORIGIN`), `DATABASE_URL` in `.env.example` only.
- **Client stack:** React + **Tailwind** + **Radix**; **TanStack Query v5** for server state; **`fetch`** wrapper in `apiClient`; query key factory; **invalidate** on mutations per patterns doc.
- **Logging:** Pino + request id on responses.
- **Dev UX:** Vite dev **proxy** or `VITE_API_BASE_URL` for `/api/v1`; `docker-compose.yml` at repo root for Postgres.
- **CI:** GitHub Actions (or equivalent): lint, Vitest (`api` + `web`), Playwright **`tests/e2e`**, axe/a11y job aligned with NFR-07.
- **SEO shell:** Default **`noindex`** + stable **`<title>`** in `index.html` (or equivalent) when publicly reachable.
- **Future auth:** Schema and module boundaries must admit a future **`user_id`** (or equivalent) without breaking the public V1 contract.

### UX Design Requirements

UX-DR1: Implement **Direction A — Classic calm** tokens (zinc neutrals + single blue accent, comfortable spacing, `rounded-md` chrome) in Tailwind theme.

UX-DR2: Provide **`ListShell` / app frame** with semantic **`h1`**, single-column layout, max-width ~40rem on large screens, 16px horizontal safe area on mobile.

UX-DR3: Implement **`EmptyState`** for zero todos: short headline + one primary add affordance; not a blank table (FR-07).

UX-DR4: Implement explicit **initial loading** pattern (skeleton or spinner) for first GET until success or error (FR-08).

UX-DR5: Implement **`ErrorBanner`** (or equivalent) for list load failure: human-readable copy + **Retry**; `role="alert"` where specified; timeout messaging for slow/failed network (UJ-6).

UX-DR6: Implement **`AddComposer`**: associated label, Enter submits, non-empty client validation with inline/`aria-describedby` error; submitting state disables input + shows pending indicator; `aria-live="polite"` for validation errors.

UX-DR7: Implement **`TodoRow`**: leading done control, title, **Delete** with **visible text label** (no icon-only delete); accessible name **“Delete {title}”**; states: default, hover, focus, done (muted/strike), pending, inline error slot.

UX-DR8: **Completed** rows use agreed visual treatment (muted + strikethrough or equivalent) and assistive tech state (`aria-checked` synced to `done`) (FR-10).

UX-DR9: **Focus order** and visible **focus rings** on all interactive controls; logical tab order: composer → list top → down rows.

UX-DR10: Respect **`prefers-reduced-motion`** for non-essential row transitions.

UX-DR11: List semantics: prefer **`ul`/`li`** (or accessible table pattern) for the todo list container.

UX-DR12: **Sticky composer** (top or bottom) per chosen breakpoint strategy; verify mobile keyboard overlap on a real device or emulator (document result in README or story notes).

UX-DR13: **Retry contract**: failed GET/POST/PATCH/DELETE exposes **Retry** that repeats the same operation where feasible (safe GET; mutations per UX).

UX-DR14: **Contrast** targets WCAG 2.1 AA for text, controls, error, and destructive colors used on the list view.

UX-DR15: Document **OpenAPI + client** error mapping so UI shows server `message` and devs can trace `requestId` in local logs only.

### FR Coverage Map

FR-01: Epic 2 — Create todo API and composer.

FR-02: Epic 2 — Validation on create (client + server).

FR-03: Epic 1 — GET list ordering and integration with UI list.

FR-04: Epic 3 — PATCH complete.

FR-05: Epic 3 — PATCH uncomplete.

FR-06: Epic 2 — DELETE API and UI.

FR-07: Epic 1 — Empty state on zero todos; reinforced in Epic 2 after create/delete flows.

FR-08: Epic 1 — Initial loading state wired to TanStack Query.

FR-09: Epic 1–3 — Load errors in Epic 1; mutation and row-level errors in Epics 2–3.

FR-10: Epic 3 — Done vs active styling and semantics on `TodoRow`.

### NFR / UX-DR Coverage (summary)

NFR-01, NFR-02, NFR-03: Epic 3 — instrumentation, tests, and documentation hooks.

NFR-04, NFR-05: Ongoing in Epics 1–3 — env examples, helmet/CORS, README/CI notes.

NFR-06: Epic 1 — README blocks + OpenAPI linkage; maintained in later stories when API changes.

NFR-07: Epic 1 (baseline), Epic 3 (full list-path coverage + CI gate).

UX-DR1–UX-DR15: Epics 1–3 as mapped per stories below (tokens/shell early; row/composer/delete/toggle/a11y/retry throughout).

## Epic List

### Epic 1: Open the app and trust what the server shows

After this epic, someone can run the stack locally, open the web UI, see honest **loading**, **empty**, and **error** states for the initial fetch, and view the todo list returned by **`GET /api/v1/todos`** in **`createdAt` descending** order. README documents **Run**, **Test**, and **API contract**; baseline automated a11y runs on the list shell.

**FRs covered:** FR-03, FR-07, FR-08, FR-09 (initial load path), partial FR-09 foundation for mutations later.

**NFRs / architecture:** NFR-06 (initial), NFR-07 (baseline), starters, Postgres + Drizzle schema, OpenAPI registration, error envelope, CORS/proxy, noindex/title.

### Epic 2: Add and remove todos with clear, accessible controls

Users can create todos with validated text and delete todos with a **labeled** control; server rules enforce **immutable text** after create on the API side for future PATCH stories. List updates after mutations via TanStack Query invalidation.

**FRs covered:** FR-01, FR-02, FR-06, FR-09 (mutation failures), reinforces FR-07 after deletes.

**UX-DRs:** UX-DR6, UX-DR7 (delete portion), UX-DR13 (mutation retry where applicable), UX-DR14.

### Epic 3: Mark progress and ship the full core loop with quality gates

Users can toggle **done** with accessible, visually distinct states; mutation loading and errors match UX patterns. Automated tests cover the **SC-01** scripted core loop and CI enforces **axe** on the main list view with add/complete/delete paths.

**FRs covered:** FR-04, FR-05, FR-09 (PATCH errors), FR-10.

**NFRs:** NFR-01–NFR-03 (documented measurement hooks), NFR-07 (full), remaining NFR-06 polish when routes change.

**UX-DRs:** UX-DR7 (toggle), UX-DR8–UX-DR12, UX-DR13 refinement.

---

## Epic 1: Open the app and trust what the server shows

Deliver a runnable **api + web** baseline, **Postgres** persistence, **read** path for todos, and a **list shell** that implements empty, loading, and error UX for the initial fetch—plus README and baseline a11y automation.

### Story 1.1: Scaffold API and web from approved starters

As a **developer**,
I want **Fastify (`api`) and Vite React TS (`web`) scaffolds with a root workspace layout**,
So that **the rest of the team can run two packages that match the architecture document**.

**Acceptance Criteria:**

**Given** a clean branch following `architecture.md` starter evaluation  
**When** the scaffold commands are run and dependencies install successfully  
**Then** `api/` and `web/` exist with expected generator layouts (adjust minimally to match the architecture directory tree)  
**And** root `package.json` uses **npm workspaces** (`api`, `web`) or an explicitly documented equivalent so both packages are addressable from the repo root  
**And** `web` dev server can start and render a placeholder app shell without calling the API yet

**Traces:** Architecture “Starter Template Evaluation”; NFR-06 prerequisite (repo structure).

**Test scenarios**

- **Unit — `US-1.1.*` (api)**  
  - **US-1.1.a** Given `buildApp()` **When** `GET /health` **Then** status `200` and body `{ ok: true }` (smoke; guards regressions while routes evolve).

- **Unit — `US-1.1.*` (web)**  
  - **US-1.1.b** Given default `App` **When** rendered **Then** primary starter heading (“Get started” or agreed copy) is visible (guarantees test harness + RTL work).

- **Integration — `IS-1.1.*`**  
  - **IS-1.1.a** Given root `npm install` **When** `npm run test --workspaces --if-present` **Then** all workspace test scripts exit `0` (proves wiring, not product features).

- **E2E — `ES-1.1.*`**  
  - **ES-1.1.a** Given Playwright starts Vite per `playwright.config.ts` **When** user opens `/` **Then** starter shell renders without console errors (baseline “app serves”).

### Story 1.2: Local PostgreSQL and Drizzle schema for todos

As a **developer**,
I want **Docker Compose Postgres and a Drizzle-managed `todos` table**,
So that **the API can persist todos with migrations as the single schema evolution path**.

**Acceptance Criteria:**

**Given** Story 1.1 complete  
**When** `docker-compose.yml` defines a `postgres` service and `DATABASE_URL` is documented in `api/.env.example`  
**Then** Drizzle schema defines `todos` with `id` (UUID), `text`, `done`, `created_at` (+ optional `updated_at`) per architecture  
**And** a generated migration creates the table and an index aligned to **`created_at DESC`** list reads  
**And** `drizzle-kit` migrate/generate commands are documented in README **Run** or linked section

**Traces:** Architecture “Data Architecture”; Additional Requirements (Postgres + Drizzle).

**Test scenarios**

- **Unit — `US-1.2.*`**  
  - **US-1.2.a** Given Drizzle schema for `todos` **When** inspected **Then** columns match architecture (`id`, `text`, `done`, `created_at`, optional `updated_at`) and types are correct (no DB required if types exported from schema file).

- **Integration — `IS-1.2.*`**  
  - **IS-1.2.a** Given Docker Compose Postgres up and `DATABASE_URL` set **When** migrations applied **Then** `\d todos` (or SQL `information_schema`) shows table + index on `created_at` for list ordering.  
  - **IS-1.2.b** Given empty DB **When** repository “list” query runs **Then** returns `[]` without error.

- **E2E — `ES-1.2.*`**  
  - **ES-1.2.a** *(optional / deferred)* Not required for DB-only story unless CI spins Compose—if CI starts Postgres, assert health script exits `0` after `docker compose up -d`.

### Story 1.3: GET /api/v1/todos with OpenAPI and error envelope

As a **user of the API**,
I want **a versioned JSON list endpoint with documented contract and consistent errors**,
So that **the client and QA can rely on stable shapes**.

**Acceptance Criteria:**

**Given** Story 1.2 complete  
**When** `GET /api/v1/todos` is called  
**Then** response is a JSON array of todos sorted by **`createdAt` descending** using **camelCase** fields (`id`, `text`, `done`, `createdAt`)  
**And** empty database returns `[]` with **200**  
**And** errors map to `{ "error": { "code", "message", "requestId"? } }` with appropriate **4xx/5xx**  
**And** OpenAPI is registered and exposes document or JSON route in dev, noted in README **API contract** block

**Traces:** FR-03; Architecture “API & Communication Patterns”, “Format Patterns”.

**Test scenarios**

- **Unit — `US-1.3.*` (api)**  
  - **US-1.3.a** Given route registration **When** `GET /api/v1/todos` with mocked repository returning two rows **Then** JSON uses **camelCase** keys and sort is `createdAt` descending.  
  - **US-1.3.b** Given Zod/OpenAPI serializer for error **When** validation fails **Then** envelope matches `{ error: { code, message, … } }`.

- **Integration — `IS-1.3.*` (api)**  
  - **IS-1.3.a** Given real DB with seeded rows **When** `inject GET /api/v1/todos` **Then** `200` and array length/order match DB.  
  - **IS-1.3.b** Given DB unreachable **When** same request **Then** `5xx` with stable error JSON and logged `requestId` if configured.

- **E2E — `ES-1.3.*`**  
  - **ES-1.3.a** Not required until browser consumes API (covered in **1.4** with UI); optional contract test via `curl`/Playwright `request` fixture against running API.

### Story 1.4: Web list shell with loading, empty, and fetch error states

As a **todo user**,
I want **the first screen to show loading, then either an inviting empty state or my todos, or a clear error with retry**,
So that **I never stare at a blank page wondering if the app is broken**.

**Acceptance Criteria:**

**Given** Story 1.3 complete and `apiClient` + TanStack Query are configured with dev proxy or `VITE_API_BASE_URL`  
**When** the app mounts  
**Then** **FR-08** loading UI displays until the initial query settles  
**And** on success with zero items, **FR-07** empty state appears with a primary add affordance (composer may be embedded or adjacent per UX)  
**And** on success with items, todos render in server order (newest first)  
**And** on failure, **FR-09** inline **ErrorBanner** (or equivalent) shows human-readable message plus **Retry** that refetches (UX-DR5, UX-DR13)  
**And** Tailwind + Radix dependencies are installed to support following stories (UX-DR1 baseline)

**Traces:** FR-03, FR-07, FR-08, FR-09; UX-DR2–UX-DR5, UX-DR11, UX-DR14.

**Test scenarios**

- **Unit — `US-1.4.*` (web)**  
  - **US-1.4.a** Given MSW returns empty array **When** list shell mounts **Then** empty state region/heading visible (FR-07).  
  - **US-1.4.b** Given MSW pending forever **When** mount **Then** loading skeleton/spinner visible (FR-08).  
  - **US-1.4.c** Given MSW returns 500 **When** mount **Then** error banner + Retry control visible (`role="alert"` where spec requires).

- **Integration — `IS-1.4.*` (web)**  
  - **IS-1.4.a** Given MSW returns two todos **When** query settles **Then** rows render in server order (newest first) with correct text.  
  - **IS-1.4.b** Given first request fails then succeeds on Retry **When** user activates Retry **Then** list refetches and error clears.

- **E2E — `ES-1.4.*`**  
  - **ES-1.4.a** Given api + web running with proxy/base URL **When** open `/` with empty DB **Then** empty state + add affordance visible after load.  
  - **ES-1.4.b** Given api stopped **When** open `/` **Then** error path visible and recoverable (retry or reload per UX).

### Story 1.5: README Run / Test / API contract and root CI skeleton

As a **contributor**,
I want **README sections and a minimal CI pipeline**,
So that **NFR-06 is satisfied early and stays enforced**.

**Acceptance Criteria:**

**Given** Stories 1.1–1.3 complete  
**When** reading root `README.md`  
**Then** it contains clearly labeled **Run**, **Test**, and **API contract** sections (headings or linked sub-docs) describing how to start Postgres, API, and web, how to run package tests, and where OpenAPI lives  
**And** a CI workflow exists that installs dependencies and runs **lint** (if configured) plus **placeholder or real** `npm test` for `api` and `web` without failing main if tests are still minimal—**must** be honest about what is enforced  
**And** any skipped jobs are explicitly marked `TODO` only if unavoidable; prefer passing no-op tests over fake green

**Traces:** NFR-06; Architecture “README / CI”.

**Test scenarios**

- **Unit — `US-1.5.*`**  
  - **US-1.5.a** Given markdown/README parser or simple script **When** README checked **Then** three headings/blocks exist: **Run**, **Test**, **API contract** (can be automated in CI with `grep`/markdownlint custom rule).

- **Integration — `IS-1.5.*`**  
  - **IS-1.5.a** Given fresh clone **When** documented install + `npm test` + `npm run test:e2e` executed per README **Then** commands match CI workflow steps (single source of truth).  
  - **IS-1.5.b** Given CI workflow file **When** dry-run or `act` (optional) **Then** jobs reference same `npm` scripts as README.

- **E2E — `ES-1.5.*`**  
  - **ES-1.5.a** Not user-facing; optional smoke: “CI workflow YAML parses” as lint task—no browser.

### Story 1.6: Baseline accessibility checks for list shell

As a **user relying on assistive tech**,
I want **the list shell to meet basic automated a11y rules**,
So that **we do not accumulate WCAG debt before features land**.

**Acceptance Criteria:**

**Given** Story 1.4 complete  
**When** Vitest + Testing Library (+ vitest-axe or jest-axe) runs against the list shell in its GET-only states  
**Then** tests cover empty, populated (seeded via mock server or stubbed fetch), and error banner snapshot  
**And** **zero critical** axe violations for those snapshots (NFR-07 baseline scope for this story)  
**And** `index.html` includes **noindex** and stable **`<title>`** per PRD/UX (UX-DR2 SEO note)

**Traces:** NFR-07; PRD SEO subsection; UX-DR14.

**Test scenarios**

- **Unit — `US-1.6.*` (web)**  
  - **US-1.6.a** Given list shell in empty state **When** axe runs **Then** zero **critical** violations.  
  - **US-1.6.b** Given populated list (mock data) **When** axe runs **Then** zero **critical** violations.  
  - **US-1.6.c** Given error banner visible **When** axe runs **Then** zero **critical** violations (contrast + roles).

- **Integration — `IS-1.6.*` (web)**  
  - **IS-1.6.a** Given keyboard-only navigation **When** tab through composer → list **Then** focus order matches visual order (spot-check automation via `userEvent.tab()`).

- **E2E — `ES-1.6.*`**  
  - **ES-1.6.a** Given running app **When** Playwright visits list **Then** automated axe pass on same DOM states as unit snapshots (duplicate intentionally for CI signal).

---

## Epic 2: Add and remove todos with clear, accessible controls

### Story 2.1: POST /api/v1/todos with validation and immutable text rule

As a **todo user**,
I want **to create a todo with text that the server validates and stores safely**,
So that **bad input never corrupts my list**.

**Acceptance Criteria:**

**Given** Story 1.3 complete  
**When** `POST /api/v1/todos` is called with valid JSON body `{ "text": "…" }`  
**Then** response is **201** with `{ id, text, done, createdAt }` in **camelCase** and persisted row matches  
**And** empty or whitespace-only text returns **4xx** with stable error envelope (FR-01)  
**And** text beyond **500 Unicode code points** returns **4xx** and is never stored (FR-02)  
**And** service layer rejects any attempt to mutate `text` on non-create paths (prepares for PATCH)  
**And** OpenAPI documents the create contract

**Traces:** FR-01, FR-02; Architecture validation and PATCH semantics preamble.

**Test scenarios**

- **Unit — `US-2.1.*` (api)**  
  - **US-2.1.a** Given Zod schema **When** body `{ text: "" }` **Then** validation error with correct `code`.  
  - **US-2.1.b** Given 501 code points string **When** validate **Then** rejected before DB write.

- **Integration — `IS-2.1.*` (api)**  
  - **IS-2.1.a** Given empty DB **When** `POST` with valid text **Then** `201` and row persisted with immutable `text`.  
  - **IS-2.1.b** Given duplicate edge (if any idempotency policy) **When** two rapid POSTs **Then** behavior matches documented policy (default: two rows).

- **E2E — `ES-2.1.*`**  
  - **ES-2.1.a** Deferred to **2.2** / **3.3** for user-visible create; optional API-only Playwright `request.post` smoke if desired.

### Story 2.2: AddComposer wired to create mutation

As a **todo user**,
I want **a simple field to add a todo with inline validation and clear pending state**,
So that **adding feels fast and honest**.

**Acceptance Criteria:**

**Given** Story 2.1 complete  
**When** I type text and submit via button or Enter  
**Then** client blocks empty/whitespace with inline error (`aria-live="polite"`, `aria-describedby`) per UX-DR6  
**And** while creating, composer shows submitting state (disabled + pending indicator)  
**And** on success, list invalidates/refetches and new item appears at top per **createdAt desc**  
**And** on API error, inline or banner error with retry path (FR-09, UX-DR13)  
**And** focus behavior matches UX spec (default returns to composer for rapid entry—document if different)

**Traces:** FR-01, FR-02, FR-09; UX-DR6, UX-DR9, UX-DR12–UX-DR14.

**Test scenarios**

- **Unit — `US-2.2.*` (web)**  
  - **US-2.2.a** Given empty input **When** submit **Then** inline validation + `aria-live` update.  
  - **US-2.2.b** Given MSW `201` **When** submit **Then** composer clears and invalidates list query (spy on `invalidateQueries`).

- **Integration — `IS-2.2.*` (web)**  
  - **IS-2.2.a** Given MSW POST failure **When** submit **Then** error UI + retry affordance; composer re-enabled.

- **E2E — `ES-2.2.*`**  
  - **ES-2.2.a** Given running stack **When** user adds first todo **Then** row appears at top after server OK (SC-01 fragment).

### Story 2.3: DELETE /api/v1/todos/:id

As a **todo user**,
I want **to remove a todo permanently**,
So that **mistakes leave the list**.

**Acceptance Criteria:**

**Given** an existing todo id  
**When** `DELETE /api/v1/todos/:id` is called  
**Then** the row is removed and subsequent GET does not include it (FR-06)  
**And** deleting a missing id yields **404** with documented behavior in OpenAPI/README  
**And** errors use the shared envelope

**Traces:** FR-06; Architecture DELETE semantics.

**Test scenarios**

- **Unit — `US-2.3.*` (api)**  
  - **US-2.3.a** Given unknown id **When** `DELETE` **Then** `404` + envelope.

- **Integration — `IS-2.3.*` (api)**  
  - **IS-2.3.a** Given existing row **When** `DELETE` then `GET` **Then** row absent.

- **E2E — `ES-2.3.*`**  
  - **ES-2.3.a** Covered with **2.4** (UI triggers delete).

### Story 2.4: TodoRow delete control with accessible labeling

As a **todo user**,
I want **a delete action that is obviously destructive and screen-reader friendly**,
So that **I do not confuse delete with archive**.

**Acceptance Criteria:**

**Given** Stories 1.4 and 2.2 (list rendering exists)  
**When** a row renders for each todo  
**Then** delete is not icon-only—shows visible **Delete** text or icon+text per UX-DR7  
**And** accessible name is **“Delete {title}”**  
**And** mutation shows pending state on the row and surfaces errors inline or via shared error pattern (FR-09)  
**And** successful delete removes row and restores **FR-07** empty state when last item is removed

**Traces:** FR-06, FR-07, FR-09; UX-DR7, UX-DR13, UX-DR14.

**Test scenarios**

- **Unit — `US-2.4.*` (web)**  
  - **US-2.4.a** Given row **When** inspect delete control **Then** accessible name includes todo title (“Delete {title}”).  
  - **US-2.4.b** Given MSW delete failure **When** click delete **Then** row remains + error surfaced.

- **Integration — `IS-2.4.*` (web)**  
  - **IS-2.4.a** Given MSW delete success **When** delete last item **Then** empty state returns (FR-07).

- **E2E — `ES-2.4.*`**  
  - **ES-2.4.a** Given list with item **When** delete **Then** row removed and list count updates.

---

## Epic 3: Mark progress and ship the full core loop with quality gates

### Story 3.1: PATCH /api/v1/todos/:id for done-only updates

As a **todo user**,
I want **to toggle completion without changing text**,
So that **my tasks reflect progress accurately**.

**Acceptance Criteria:**

**Given** Stories 2.1–2.3 complete  
**When** `PATCH /api/v1/todos/:id` is called with `{ "done": true|false }` only  
**Then** persisted `done` updates and response returns updated todo (FR-04, FR-05)  
**And** body attempting `text` change returns **400** with clear validation error (architecture immutability rule)  
**And** OpenAPI updated; service/repository tests cover toggle and rejection paths

**Traces:** FR-04, FR-05; Architecture PATCH semantics.

**Test scenarios**

- **Unit — `US-3.1.*` (api)**  
  - **US-3.1.a** Given body `{ done: true }` only **When** schema parses **Then** ok; with `{ text: "x" }` **Then** `400`.

- **Integration — `IS-3.1.*` (api)**  
  - **IS-3.1.a** Given row `done=false` **When** `PATCH` `done:true` **Then** persisted and response matches.  
  - **IS-3.1.b** Given same row **When** toggle back **Then** `done:false`.

- **E2E — `ES-3.1.*`**  
  - **ES-3.1.a** Covered in **3.2** / **3.3** (browser toggle).

### Story 3.2: Accessible done toggle with completed styling

As a **todo user**,
I want **a checkbox/toggle that shows done vs active clearly and works with keyboard and screen readers**,
So that **I can scan and update tasks quickly**.

**Acceptance Criteria:**

**Given** Story 3.1 complete  
**When** I activate the done control on a row  
**Then** PATCH mutation runs with pending + error handling consistent with Epic 2 patterns  
**And** **FR-10** visual treatment (muted/strikethrough or agreed spec) applies when `done` is true  
**And** `aria-checked` reflects `done`; focus ring visible (UX-DR8, UX-DR9)  
**And** `prefers-reduced-motion` honored for non-essential transitions (UX-DR10)

**Traces:** FR-04, FR-05, FR-09, FR-10; UX-DR7–UX-DR11.

**Test scenarios**

- **Unit — `US-3.2.*` (web)**  
  - **US-3.2.a** Given `done=true` **When** render row **Then** muted/strike classes applied per design tokens.  
  - **US-3.2.b** Given toggle **When** `aria-checked` updated **Then** matches `done`.

- **Integration — `IS-3.2.*` (web)**  
  - **IS-3.2.a** Given MSW PATCH failure **When** toggle **Then** prior state restored + error shown.

- **E2E — `ES-3.2.*`**  
  - **ES-3.2.a** Given item **When** keyboard Space on checkbox **Then** state toggles after server OK.

### Story 3.3: End-to-end smoke for SC-01 core loop

As a **product owner**,
I want **an automated script covering open → add → complete → delete → empty**,
So that **we can rerun the unaided core loop cheaply**.

**Acceptance Criteria:**

**Given** Epics 1–3 UI/API features integrated locally  
**When** Playwright test `tests/e2e/todo.spec.ts` runs against dev servers (documented command)  
**Then** it performs: open app → add one todo → mark complete → delete → assert empty state  
**And** failure output includes screenshots/trace optional but recommended  
**And** README **Test** documents how to run e2e including starting Postgres/API/web

**Traces:** SC-01 (PRD Success Criteria); Architecture QA integration.

**Test scenarios**

- **Unit — `US-3.3.*`**  
  - **US-3.3.a** Not primary—SC-01 is inherently E2E; keep thin helpers (page objects) unit-tested if extracted.

- **Integration — `IS-3.3.*`**  
  - **IS-3.3.a** Optional: Playwright `request` API checks for data setup teardown between runs.

- **E2E — `ES-3.3.*` (primary)**  
  - **ES-3.3.a** **SC-01 scripted path:** open → add → complete → delete → empty (assert empty state).  
  - **ES-3.3.b** **SC-02 hint:** after add, **reload** page **Then** item still present (extend same spec when persistence ready).

### Story 3.4: CI matrix — unit, e2e, and axe gate on list view

As a **maintainer**,
I want **CI to enforce tests and critical a11y violations on the main list flows**,
So that **NFR-06 and NFR-07 stay true on main**.

**Acceptance Criteria:**

**Given** Stories 1.5–1.6, 2.x, 3.1–3.3 complete  
**When** CI runs on a PR touching relevant paths  
**Then** it runs **`api` + `web` unit/component tests**, **Playwright e2e**, and an **axe** job that exercises **add / complete / delete** on the list view  
**And** **zero critical** axe violations per NFR-07 definition used in Story 1.6 (extended to full flows)  
**And** README **Test** matches CI commands (single source of truth)  
**And** document or ticket hooks for NFR-01/NFR-02 measurement (logs/timers) are added where feasible without vendor lock-in

**Traces:** NFR-01–NFR-07; PRD Success Criteria SC-03/SC-04 alignment via documentation or lightweight timing.

**Test scenarios**

- **Unit — `US-3.4.*`**  
  - **US-3.4.a** Lint/test scripts referenced from workflow YAML exist in `package.json` (static test of repo hygiene).

- **Integration — `IS-3.4.*`**  
  - **IS-3.4.a** Given CI docker image **When** `npm ci` + `npm test` **Then** same exit codes as local.  
  - **IS-3.4.b** Given Playwright in CI **When** `npx playwright install --with-deps` **Then** E2E job green.

- **E2E — `ES-3.4.*`**  
  - **ES-3.4.a** Full **add → complete → delete** on real stack with axe assertion **zero critical** on list view (NFR-07).  
  - **ES-3.4.b** (Perf smoke / optional) Capture server timing headers or client marks for NFR-01/NFR-02 documentation threshold—not a hard gate unless agreed.

---

## Validation summary (Step 4)

- **Test coverage intent:** Each story defines **Test scenarios** (unit / integration / E2E) with scenario IDs `US-*`, `IS-*`, `ES-*` for mapping to automated tests and CI.
- **FR coverage:** FR-01–FR-10 each appear in at least one story acceptance block or epic mapping above.
- **Starter template:** Story **1.1** explicitly scaffolds from Fastify + Vite `react-ts` per architecture.
- **Tables created when needed:** `todos` arrives in **1.2** when persistence is introduced—not before.
- **Story ordering:** Within each epic, later stories depend only on earlier ones; Epic 2 assumes Epic 1 read path; Epic 3 assumes Epic 2 row/composer/delete.
- **Epic independence:** Epic 1 delivers a truthful read-only experience; Epic 2 adds create/delete; Epic 3 completes the PRD core loop with toggle and quality gates.
- **File churn:** Epics deliberately follow vertical slices; some shared files (e.g. `TodoRow`) evolve across Epics 2–3 to avoid duplicate components—acceptable with explicit story sequence.

---

**Workflow status:** Planning complete; **test strategy** is embedded per story above. Implementation tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`. Next BMad execution steps: **`bmad-create-story`** / **`bmad-dev-story`** / **`bmad-code-review`** as stories progress.
