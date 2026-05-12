---
story_key: 1-3-get-api-v1-todos-with-openapi-and-error-envelope
story_id: "1.3"
epic: 1
status: done
---

# Story 1.3: GET /api/v1/todos with OpenAPI and error envelope

Status: done

<!-- Optional: run validate-create-story (`bmad-create-story` · validate) before `bmad-dev-story`. -->

## Story

As a **user of the API**,
I want **a versioned JSON list endpoint with documented contract and consistent errors**,
So that **the client and QA can rely on stable shapes**.

## Acceptance Criteria

1. **Given** Story 1.2 complete  
   **When** `GET /api/v1/todos` is called  
   **Then** the response body is a **JSON array** of todos sorted by **`createdAt` descending** (newest first), each item using **camelCase** fields **`id`**, **`text`**, **`done`**, **`createdAt`** (ISO 8601 UTC with `Z`).

2. **Empty list**  
   **When** the database has no todos  
   **Then** `GET /api/v1/todos` returns **`200`** and **`[]`**.

3. **Error envelope**  
   **When** any handled failure occurs for this flow (validation elsewhere in the same route module, repository/service failure for GET)  
   **Then** the response body matches **`{ "error": { "code": string, "message": string, "requestId"?: string, "details"?: unknown } }`** with HTTP status appropriate to the class (**4xx** vs **5xx**).  
   **And** for **5xx** paths tied to GET list failures, **`requestId`** is present and matches **`request.id`** from Fastify (not a random surrogate when the request context exists).

4. **OpenAPI**  
   **When** the API runs with Swagger enabled (default `buildApp`)  
   **Then** **OpenAPI 3** documents **`GET /api/v1/todos`** including **200** response schema (array of todo objects with the field names above) and the **shared error** shape where applicable.  
   **And** contributors can open the **Swagger UI** and/or **raw JSON document** route exposed by `@fastify/swagger` / `@fastify/swagger-ui` in dev (verify exact path—commonly under the `/documentation` prefix).

5. **README — API contract**  
   **When** reading the root **`README.md`** **API contract** section  
   **Then** it states where the **OpenAPI UI** lives and where the **machine-readable OpenAPI JSON** can be fetched in dev, and that **`GET /api/v1/todos`** returns an **unwrapped array** (no `{ "data": ... }` wrapper), aligned with architecture **Format Patterns**.

**Traces:** FR-03; architecture **API & Communication Patterns**, **Format Patterns**; NFR-06 (initial linkage—full NFR-06 hardening continues in Story **1.5**).

## Tasks / Subtasks

- [x] **OpenAPI for GET list** (AC: 4, 5)  
  - [x] Add Fastify route **`schema`** (and tags/summary as appropriate) for **`GET /api/v1/todos`** so generated OpenAPI lists **200** content type **`application/json`** with **array** of todo DTO.  
  - [x] Optionally define a **reusable** `Error` / problem component in OpenAPI config or route `response` schemas so **4xx/5xx** bodies stay documented consistently (POST/PATCH/DELETE already return the envelope—extend docs without breaking handlers).

- [x] **Error envelope audit for GET** (AC: 3)  
  - [x] Confirm **`GET /api/v1/todos`** failure path uses **`sendError`** (or equivalent) with **`requestId: String(request.id)`**—not `sendError`’s random default when `request.id` exists. [Source: `api/src/routes/todos.ts`, `api/src/lib/errors.ts`]  
  - [x] Align **`app.setErrorHandler`** in `api/src/app.ts` with architecture: map **Fastify validation / serializer** errors to **4xx** + envelope where possible instead of always **500** `INTERNAL`, if those errors can surface after OpenAPI/schema tightening.

- [x] **Tests — unit `US-1.3.*`** (AC: 1, 3)  
  - [x] **US-1.3.a:** With a **mocked `TodoRepository`** (or `TodoService` under test) returning **two** rows with different `createdAt`, assert **`listTodos()`** / HTTP handler JSON uses **camelCase** keys and order is **`createdAt` descending**. Prefer **no real DB** for this case.  
  - [x] **US-1.3.b:** Assert **Zod** validation failure for a body-bearing route (existing **POST** path is fine) produces **`{ error: { code, message, … } }`** including **`details`** shape you document (e.g. **`flatten()`**)—unit or focused route test, not only integration.

- [x] **Tests — integration `IS-1.3.*`** (AC: 1, 2, 3) — *requires `DATABASE_URL` + Postgres; follow existing `describe.skipIf` pattern* [Source: `api/src/todos.integration.test.ts`]  
  - [x] **IS-1.3.a:** Seed **two** rows (use repository, SQL insert, or POST—if POST, ensure timestamps differ e.g. small delay or explicit `created_at` via SQL) **When** `inject GET /api/v1/todos` **Then** **200**, length **2**, order **newest first**, keys **camelCase**.  
  - [x] **IS-1.3.b:** **Given** DB unreachable (e.g. invalid port in `DATABASE_URL` for a **one-off** `buildApp` instance, or pool failure strategy you choose without flaking parallel workers) **When** `GET /api/v1/todos` **Then** **5xx** with stable **`error`** JSON and **`requestId`** present; assert server logs receive the correlation id if practical.

- [x] **E2E `ES-1.3.*`**  
  - [x] **Not required** per epics until browser consumes API (**1.4**); optional **`curl`** / Playwright **`request`** smoke against running API—document in Dev Agent Record if added.

- [x] **README** (AC: 5)  
  - [x] Extend **API contract** with the **OpenAPI JSON** URL (discovered from running app or `@fastify/swagger-ui` docs) and one line on **success shape** for GET (array, camelCase).

## Dev Notes

### Epic context

- **Epic 1** delivers a trustworthy **read path**: **1.2** = persistence; **1.3** = **HTTP + OpenAPI + error contract** for **`GET /api/v1/todos`**; **1.4** = web list shell consuming this API. Do not punt required GET/OpenAPI/test work to **1.4**. [Source: `_bmad-output/planning-artifacts/epics.md` — Stories 1.3–1.4]

### Brownfield inventory (extend, do not regress)

| Area | Current state | Implication for 1.3 |
|------|----------------|---------------------|
| `GET /api/v1/todos` | Implemented in `api/src/routes/todos.ts`; returns `service.listTodos()`; **try/catch** → **`sendError` 500** | Harden **OpenAPI**, **tests**, and **error-handler** alignment; verify **requestId** uses **`request.id`**. |
| DTO mapping | `mapTodoToDto` in `api/src/lib/mapTodo.ts` — **camelCase** + ISO **`Z`** | Keep; AC **1** is satisfied if DB ordering + mapping stay correct. |
| Repository order | `TodoRepository.list()` uses **`orderBy(desc(todos.createdAt))`** | Preserve; integration test proves end-to-end. |
| OpenAPI plugins | `@fastify/swagger` + `@fastify/swagger-ui` registered in `api/src/app.ts`; UI prefix **`/documentation`** | Add **route schemas** so spec is not empty for todos; document **JSON** route in README. |
| Other verbs | **POST/PATCH/DELETE** already registered | **Out of scope** for *new* features, but **must not break**; extending **shared** error/todo **components** in OpenAPI is encouraged. |
| Global `setErrorHandler` | Always **500** + envelope | May need **smarter mapping** once routes declare **`schema`** (serializer/validation errors). |
| README | **API contract** mentions UI + routes | Add **machine-readable** spec location + GET response shape note. |

### Architecture compliance (must follow)

| Topic | Requirement |
|--------|--------------|
| Paths | **`/api/v1/todos`** collection; member **`/api/v1/todos/:id`** (OpenAPI param **`id`**). [Source: `architecture.md` — API naming] |
| JSON fields | **camelCase** at HTTP boundary; **no** `{ data: ... }` wrapper for GET list. |
| Errors | **`{ "error": { "code", "message", "requestId"?, "details"? } }`**; status reflects **4xx** vs **5xx**. |
| Dates | **ISO 8601** UTC **`…Z`**. |
| OpenAPI | **`@fastify/swagger`** (+ UI or Scalar); **link from README** **API contract**; optional committed **`openapi/openapi.json`** in repo or CI—architecture allows **either** committed artifact **or** documented served path. [Source: `architecture.md` — Structure Patterns, NFR-06] |
| Process | Central **`onError`** + mapper from Zod/Fastify errors to **`error.code`**. [Source: `architecture.md` — Process Patterns] |

### Previous story intelligence (1.2)

- **Migrations-only** schema path: `runMigrations` in `buildApp`; **`initSchema` / `ensureTodosTable` removed**. Do not reintroduce runtime DDL.  
- **`resolveDatabaseUrl()`** trims and rejects blank/whitespace-only **`DATABASE_URL`**—integration tests should keep using real resolved URL. [Source: `api/src/db/resolve-database-url.ts`, `1-2-local-postgresql-and-drizzle-schema-for-todos.md`]  
- **`drizzle.config.ts`** outputs to **`api/src/db/migrations/`**; Vitest integration file **`api/src/todos.integration.test.ts`** uses **`describe.skipIf(!databaseUrl)`** and **`DELETE FROM todos`** in **`beforeEach`**.  
- Review note: parallel Vitest workers + shared DB may flake—prefer **serial** `describe` or **transaction** isolation if **IS-1.3.\*** becomes unstable.

### Read-before-change (UPDATE files)

Read completely before editing: **`api/src/app.ts`**, **`api/src/routes/todos.ts`**, **`api/src/lib/errors.ts`**, **`README.md`**, **`api/src/todos.integration.test.ts`**. Understand current **logging**, **swagger registration order**, and **CORS/helmet** relative to routes (do not break startup).

### Scope boundaries

- **In scope:** **`GET /api/v1/todos`** contract, **OpenAPI** documentation for that operation (and shared schemas as needed), **error envelope** consistency for GET and global handler improvements that affect it, **unit + integration tests** per epic IDs, **README API contract** updates.  
- **Out of scope:** **Web** UI list shell (**1.4**), full **NFR-06** CI/README polish (**1.5**), **E2E** browser tests unless optional smoke is trivial.

### Implementation readiness / quality note

- Readiness report suggested an explicit **OpenAPI-first** handoff to **1.4**—after this story, README should make it obvious where the **JSON spec** is so the client story can pin types or fixtures. [Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-03.md`]

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.3, acceptance + test scenarios]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Format Patterns, API naming, Process Patterns, Project Structure]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR-03, NFR-06]  
- [Source: `api/src/services/todo.service.ts`, `api/src/repositories/todo.repository.ts`, `api/src/lib/mapTodo.ts`, `api/src/schemas/todo.zod.ts`]

## Change Log

- 2026-05-12: Closed code-review decisions — single `WEB_ORIGIN` (`resolveWebOrigin`), Helmet CSP relaxed for Swagger UI inline scripts, POST OpenAPI `text` aligned with Zod (removed `maxLength`), README CORS note; sprint status **done**.
- 2026-05-05: Implemented OpenAPI route schemas (todos + shared error envelope), Fastify validation/serialization error mapping in `setErrorHandler`, unit tests (service list mapping, Zod flatten, GET 5xx envelope), integration tests (IS-1.3.a ordering, OpenAPI JSON route), README API contract updates.

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Cursor)

### Debug Log References

### Completion Notes List

- Added **`api/src/lib/openapi-schemas.ts`** for shared JSON Schema fragments used in route `schema` blocks and Swagger.
- **`registerTodoRoutes`**: OpenAPI **`tags`**, **`summary`**, request/response schemas for **GET/POST/PATCH/DELETE**; **GET** documents **200** array of todo DTO and **500** error envelope.
- **`buildApp` `setErrorHandler`**: **400** + envelope when Fastify exposes a **`validation`** payload (array or other shape); **500** envelope for **`FST_ERR_RESPONSE_SERIALIZATION`**; default **500** `INTERNAL` otherwise.
- **CORS `WEB_ORIGIN`:** **`resolveWebOrigin`** in **`api/src/http/resolve-web-origin.ts`** — single origin, rejects comma-separated values; documented in **`README.md`** and **`api/.env.example`**.
- **Helmet / Swagger UI:** **`@fastify/helmet`** registered with **`contentSecurityPolicy.directives`** overriding **`scriptSrc`**, **`connectSrc`**, **`workerSrc`**, **`imgSrc`** so **`/documentation`** can load Swagger’s inline scripts and fetch **`/documentation/json`**.
- **POST OpenAPI vs Zod:** **`createTodoBodyOpenApi.text`** omits **`maxLength`**; description states the **Unicode code-point** cap is enforced at runtime by Zod (avoids JSON Schema string-length vs code-point drift).
- **IS-1.3.b (5xx envelope + `requestId`):** **`todos-get-error.unit.test.ts`** (mocked `listTodos`). **Product decision (2026-05-12):** accept unit-only coverage; no separate DB-down integration test required for this story.
- **ES-1.3** not added (explicitly optional per epic); integration suite still **`skipIf`** without **`DATABASE_URL`**.

### File List

- `api/src/app.ts`
- `api/src/lib/openapi-schemas.ts`
- `api/src/routes/todos.ts`
- `api/src/services/todo.service.test.ts`
- `api/src/schemas/todo.zod.test.ts`
- `api/src/routes/todos-get-error.unit.test.ts`
- `api/src/http/resolve-web-origin.ts`
- `api/src/http/resolve-web-origin.test.ts`
- `api/src/todos.integration.test.ts`
- `README.md`
- `api/.env.example`
- `_bmad-output/implementation-artifacts/1-3-get-api-v1-todos-with-openapi-and-error-envelope.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

Code review (2026-05-04). Layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor. Edge output was wrapped in extra markup; JSON was parsed successfully.

- [x] [Review][Decision] CORS and `WEB_ORIGIN` strategy — **Resolved (2026-05-12):** Single origin only — `resolveWebOrigin()` rejects comma-separated values; default `http://127.0.0.1:5173` when unset; README + `.env.example` updated.

- [x] [Review][Decision] Helmet vs Swagger UI — **Resolved (2026-05-12):** Tune Helmet `contentSecurityPolicy` in `buildApp` (`scriptSrc` + `connectSrc` + `workerSrc` + `imgSrc`) so Swagger UI under `/documentation` loads.

- [x] [Review][Decision] POST OpenAPI `maxLength` vs Zod Unicode cap — **Resolved (2026-05-12):** Removed OpenAPI `maxLength` on POST `text`; description documents runtime Zod Unicode code-point enforcement.

- [x] [Review][Decision] IS-1.3.b test shape — **Resolved (2026-05-12):** Accept unit-only coverage (`todos-get-error.unit.test.ts`); no additional DB-unreachable integration scenario required for this story.

- [x] [Review][Patch] Close pool if `runMigrations` throws after `createPool` — `api/src/app.ts` (after pool creation, before `onClose` registers) — Edge: leaked connections until process exit if migration fails mid-startup.

- [x] [Review][Patch] Map non-array Fastify `validation` to 400 envelope — `api/src/app.ts` (`readFastifyValidation`) — **Resolved:** any defined `validation` value is returned as `details` on **400** `VALIDATION` (previously only arrays were treated as validation errors).

- [x] [Review][Patch] Add `additionalProperties: false` to POST `createTodoBodyOpenApi` — `api/src/routes/todos.ts` — Matches PATCH contract strictness; reduces silent acceptance of extra JSON fields at documentation vs runtime layers.

- [x] [Review][Patch] Clarify README migration wording — `README.md` — Reduce ambiguity about owning schema lifecycle when both `npm run db:migrate -w api` and startup migrations apply.

- [x] [Review][Patch] Reword Dev Agent Record IS-1.3.b line — This file, Dev Agent Record — Avoid implying the integration-style IS-1.3.b scenario from the story is fully satisfied by the unit test alone until Decision above is resolved.

- [x] [Review][Defer] Unbounded `GET /api/v1/todos` list (no pagination) [`api/src/routes/todos.ts`] — deferred, pre-existing product backlog; not required by Story 1.3 ACs.

- [x] [Review][Defer] `buildApp` requires `DATABASE_URL` and runs migrations on boot [`api/src/app.ts`] — deferred, pre-existing architectural choice for this API slice.

- [x] [Review][Defer] Broad 500 `INTERNAL` mapping for non-validation failures [`api/src/app.ts`] — deferred, pre-existing; finer-grained codes are out of story scope.

- [x] [Review][Defer] Parallel JSON Schema / Zod / TypeScript maintenance drift risk [`api/src/lib/openapi-schemas.ts`, `api/src/routes/todos.ts`] — deferred, pre-existing technical debt; consider `zod-to-json-schema` or similar in a later story.

- [x] [Review][Defer] Integration suite skipped without `DATABASE_URL` [`api/src/todos.integration.test.ts`] — deferred, pre-existing test harness tradeoff; documented via `describe.skipIf`.

- [x] [Review][Defer] `sendError` falls back to `randomUUID()` when `requestId` omitted [`api/src/lib/errors.ts`] — deferred, pre-existing; routes under review pass `rid(request)` for GET failures.

### Re-review (2026-05-12)

Spec: this file. Diff basis: `git diff HEAD` on `api/`, `README.md`, plus full read of handlers against ACs. Layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor (single consolidated pass).

- **Prior `[Review][Patch]` rows:** Confirmed in tree — `buildApp` ends the pool if `runMigrations` throws; `readFastifyValidation` forwards any non-undefined `validation` shape to the **400** envelope; POST `createTodoBodyOpenApi` sets `additionalProperties: false`; README documents shared Drizzle migrator for CLI vs startup.
- **AC 1–5:** No regressions observed; implementation still matches acceptance criteria for the reviewed paths.
- **`[Review][Decision]` rows:** Closed same day with explicit product/tech choices (single `WEB_ORIGIN`, CSP tuned for Swagger, OpenAPI aligned with Zod, IS-1.3.b unit-only).
- **New findings:** None material. **Dismissed:** theoretical `validation: null` yielding `details: null` (unlikely Fastify shape; cosmetic if it ever occurred).

---

**Story completion note:** Ultimate context engine analysis completed — comprehensive developer guide created.
