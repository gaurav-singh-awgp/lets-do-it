---

## story_key: 2-3-delete-api-v1-todos-by-id

story_id: "2.3"
epic: 2
status: done

---

# Story 2.3: DELETE /api/v1/todos/:id

Status: done

Ultimate context engine analysis completed — comprehensive developer guide for API verification, contract docs, and epic-aligned tests.

## Story

As a **todo user**,
I want **to remove a todo permanently**,
So that **mistakes leave the list**.

## Acceptance Criteria

1. **Happy path — hard delete (FR-06)**  
   **Given** a todo row exists with id `id`  
   **When** `DELETE /api/v1/todos/:id` is called with a valid UUID  
   **Then** response status is **204** with **no JSON body**  
   **And** a subsequent **`GET /api/v1/todos`** does **not** include that todo.  
   **Traces:** FR-06; `epics.md` Story 2.3.

2. **Unknown id — 404 + envelope**  
   **Given** no row exists for a syntactically valid UUID  
   **When** `DELETE /api/v1/todos/:id`  
   **Then** response is **404** with stable envelope `{ "error": { "code", "message", "requestId"?, "details"? } }` (use **`NOT_FOUND`** for `code` to match existing PATCH-not-found behavior unless product decides otherwise — **stay consistent** across member routes).  
   **Traces:** FR-06; architecture error contract.

3. **Invalid id — 400 + envelope**  
   **Given** `:id` is not a UUID  
   **When** `DELETE`  
   **Then** response is **400** with **`VALIDATION`** (or same code path as PATCH invalid id) and envelope including `requestId`.  
   **Traces:** Story 2.3; parity with `PATCH /api/v1/todos/:id` param validation.

4. **Repeat delete (documented)**  
   **Given** a todo was already deleted successfully  
   **When** `DELETE` is called again with the same id  
   **Then** **404** + envelope is acceptable (per `architecture.md` — *404 on repeat delete acceptable if documented*). Document this in **README** and/or OpenAPI `description` for the **404** response so integrators are not surprised.

5. **OpenAPI + README (NFR-06)**  
   **And** OpenAPI registered for **`DELETE /api/v1/todos/:id`** documents **204**, **400**, **404**, **500** consistently with runtime  
   **And** root **README** `## API contract` section mentions **DELETE** (status codes, no body on 204, 404 semantics including repeat delete if applicable).  
   **Traces:** NFR-06; Story 2.3 AC in epics.

6. **Out of scope**  
   **E2E browser delete** is **Story 2.4** (`ES-2.3.a` explicitly deferred there in epics). **Web** `deleteTodo` client may already exist — **do not** redesign row UI or mutation UX in this story (**2.4** owns accessible delete control and Playwright coverage).

## Tasks / Subtasks

- [x] **Brownfield audit vs AC** (AC: 1–6)  
  - [x] Read `api/src/routes/todos.ts` `DELETE` handler, `TodoService.deleteTodo`, `TodoRepository.deleteById`, `api/src/todos.integration.test.ts` delete cases, `web/src/api/todosClient.ts` `deleteTodo` (read-only unless API contract fix required).  
  - [x] Map each AC to current behavior; list gaps only (likely **README**, **test IDs**, optional **unit** for **US-2.3.a**).

- [x] **README — API contract** (AC: 4, 5)  
  - [x] Add a concise **`DELETE /api/v1/todos/:id`** paragraph: **204** empty body, **404** when missing (and note repeat-delete **404** if that is current behavior), **400** invalid UUID, pointer to OpenAPI for shapes.

- [x] **Tests — epic scenario IDs** (AC: 1–3)  
  - [x] **US-2.3.a** (api **unit**): DB-free unit test in `api/src/routes/todos-delete-error.unit.test.ts`. Fastify `inject` with test-double `TodoService` where `deleteTodo` resolves `false`. Asserts `statusCode === 404`, `error.code === "NOT_FOUND"`, `error.message` truthy, `error.requestId` present.  
  - [x] **IS-2.3.a** (api **integration**): Renamed from `DELETE /api/v1/todos/:id removes todo` → `IS-2.3.a: DELETE existing todo → 204 then GET shows row absent`.  
  - [x] **404 unknown id** (integration today: `DELETE returns 404 for unknown id`): Renamed to `DELETE unknown id — 404 + envelope (regression for AC2)` with strengthened envelope assertions (`error.code`, `error.message`, `error.requestId`).  
  - [x] **Invalid UUID** integration test: renamed to `DELETE invalid id — 400 + VALIDATION envelope (AC3)`.

- [x] **OpenAPI drift check** (AC: 5)  
  - [x] Extended the existing OpenAPI smoke in `api/src/todos.integration.test.ts`: verifies `paths["/api/v1/todos/{id}"].delete` is defined with **204** / **400** / **404** / **500** responses and `id` param `format: uuid`. Updated route schema with `description` documenting repeat-delete 404 behavior.

- [x] **Regression**  
  - [x] `npm run test:api` — 17 tests pass (16 integration skipped, no DATABASE_URL in this environment, consistent with prior stories).  
  - [x] POST / PATCH tests and Story 2.1 immutable-text expectations untouched.

### Review Findings

- [x] [Review][Decision] README adds PATCH contract text alongside DELETE — **Resolved (2026-05-12):** option **2** — removed the PATCH paragraph from README `## API contract` to keep strict Story 2.3 scope; PATCH remains documented in OpenAPI.

- [x] [Review][Patch] `sprint-status.yaml` `last_updated` regressed — **Resolved:** set `last_updated` to `2026-05-13T14:00:00Z` (monotonic after prior `2026-05-13T02:10:00Z`).

### Story validation report (VS)

**Date:** 2026-05-12  
**Checklist:** `.claude/skills/bmad-create-story/checklist.md`  
**Verdict:** **Ready for dev** — aligns with `epics.md` Story 2.3 (AC + **US-2.3.a** / **IS-2.3.a** / **ES-2.3.a** deferral to 2.4). Brownfield inventory matches repo (`DELETE` + tests + **`NOT_FOUND`** on 404).  
**Edits from this VS pass:** Clarified epic test-ID rules (no invented **`IS-2.3.b`**), concrete **`NOT_FOUND`** / **`VALIDATION`** assertions, OpenAPI test extension hint, removed stray review placeholder checkbox.

## Dev Notes

### Epic cross-story context

- **2.1** — POST + validation; **2.2** — composer + create mutation. **2.3** — **DELETE API only** (this file). **2.4** — TodoRow delete UX + **`ES-2.3.a`** / **`ES-2.4.a`** style E2E. [Source: `epics.md` — Stories 2.2–2.4]

### Critical brownfield reality (read first)

**`DELETE /api/v1/todos/:id` is already implemented** in `api/src/routes/todos.ts` with **204** / **400** / **404** / **500**, backed by `TodoService.deleteTodo` → `TodoRepository.deleteById`. **Integration tests** already cover delete-then-empty-list, unknown id, and invalid UUID.

Treat this story primarily as:

- **Verification** against epics AC1–5  
- **Contract documentation** (README + OpenAPI prose)  
- **Test traceability** (epic IDs **US-2.3.a**, **IS-2.3.a**) and optional **unit** gap closure for **US-2.3.a**

Do **not** rewrite working delete semantics without a failing AC or failing test.

### Brownfield inventory — files to read before editing

| File | Current state | Story 2.3 implication |
|------|----------------|---------------------|
| `api/src/routes/todos.ts` | `app.delete("/api/v1/todos/:id", …)` — Zod UUID parse, `service.deleteTodo`, **204** or **404 NOT_FOUND** or **400 VALIDATION** | Verify OpenAPI block matches runtime; adjust descriptions only unless bug found. |
| `api/src/services/todo.service.ts` | `deleteTodo(id): Promise<boolean>` | Returns `repo.deleteById` result; unit tests may mock this for **US-2.3.a**. |
| `api/src/repositories/todo.repository.ts` | `deleteById` uses `delete().where(eq).returning()`; `result.length > 0` | Standard Drizzle hard delete. |
| `api/src/todos.integration.test.ts` | Three `it` blocks: delete removes row + GET `[]`; **404** unknown UUID; **400** invalid uuid | Rename/tag for **IS-2.3.a**; strengthen envelope assertions on **404** if AC2 gaps. |
| `api/src/lib/errors.ts` + `sendError` | Shared envelope | Ensure **404** delete uses same helper as PATCH not-found. |
| `README.md` | Documents **GET**, **POST**; **no DELETE** paragraph yet | **Required** README update for AC5. |
| `web/src/api/todosClient.ts` | `deleteTodo` — **204** short-circuit, else `buildResponseError` | **Read-only** for 2.3 unless API status/body changes force client tweak. |

### Architecture compliance

| Topic | Source |
|-------|--------|
| DELETE semantics, repeat delete | `architecture.md` — Requirements Overview **Delete (FR-06)** |
| Error envelope | `architecture.md` — JSON error shape across endpoints |
| Member route naming | `/api/v1/todos/:id` — `architecture.md` API naming |

### Testing requirements (epic)

| ID | Intent | Automation hint |
|----|--------|-------------------|
| **US-2.3.a** | Unknown id → **404** + envelope | **Unit** with mocked `TodoService` (see Tasks); do not relabel integration tests as **`US-2.3.a`**. |
| **IS-2.3.a** | Existing row → DELETE → GET row absent | `inject` + Postgres (`describe.skipIf(!databaseUrl)`). |

**E2E:** **ES-2.3.a** deferred to Story **2.4** per epics.

### Previous story intelligence

- **2.1** hardened **OpenAPI vs Zod** and README for **POST** — mirror clarity for **DELETE** (especially **204** no body vs JSON error responses).  
- **2.2** split mutation error UI (create vs patch/delete banners) — **2.3** must not rip out `deleteTodo` or row wiring used by e2e scaffolding; UI polish waits for **2.4**.

### Git / deferred context

- **`deferred-work.md`** has no DELETE-specific row today; if code review surfaces new deferrals, append there with suggested owner (e.g. **3.x** CI).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.3, Test scenarios]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — FR-06, error contract]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR-06]  
- [Source: `_bmad-output/implementation-artifacts/2-1-post-api-v1-todos-with-validation-and-immutable-text-rule.md`]  
- [Source: `_bmad-output/implementation-artifacts/2-2-addcomposer-wired-to-create-mutation.md` — Epic 2 sequencing]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (bmad-dev-story)

### Debug Log References

No blockers or debugging required — implementation was primarily verification and documentation of existing working code.

### Completion Notes List

- **Brownfield verification**: All AC 1–3 runtime behaviors confirmed correct in `api/src/routes/todos.ts` (204/400/404/500 paths, `NOT_FOUND`/`VALIDATION` codes, `requestId` in envelope).
- **US-2.3.a unit test**: Created `api/src/routes/todos-delete-error.unit.test.ts` — DB-free, uses `TodoService` test double where `deleteTodo → false`, asserts 404 + `NOT_FOUND` + `requestId`. Mirrors pattern from `todos-get-error.unit.test.ts`.
- **IS-2.3.a rename**: Integration test `DELETE /api/v1/todos/:id removes todo` renamed to `IS-2.3.a: DELETE existing todo → 204 then GET shows row absent`.
- **404 envelope strengthened**: Integration test for unknown-id delete now asserts `error.code === "NOT_FOUND"`, `error.message` truthy, `error.requestId` truthy (previously only checked `statusCode`).
- **AC3 prefix**: Invalid-UUID test renamed to `DELETE invalid id — 400 + VALIDATION envelope (AC3)`.
- **OpenAPI smoke extended**: The existing `OpenAPI JSON lists GET /api/v1/todos` test updated to also verify `DELETE /api/v1/todos/{id}` is registered with 204/400/404/500 responses and `id` param `format: uuid`.
- **OpenAPI route description**: Added `description` and improved `400`/`404` descriptions on the delete route to document repeat-delete 404 semantics.
- **README**: `## API contract` — DELETE paragraph only (PATCH paragraph removed after code review for strict Story 2.3 scope).
- **Code review (`2026-05-12`)**: README trimmed to DELETE-only under `## API contract`; `sprint-status.yaml` `last_updated` corrected to monotonic timestamp; story and sprint status set to **`done`**.

### File List

- `api/src/routes/todos-delete-error.unit.test.ts` (new)
- `api/src/routes/todos.ts` (modified — OpenAPI description + response descriptions)
- `api/src/todos.integration.test.ts` (modified — IS-2.3.a rename, 404 envelope assertions, AC3 prefix, extended OpenAPI smoke)
- `README.md` (modified — DELETE paragraph in `## API contract`; PATCH paragraph removed after code review)
- `_bmad-output/implementation-artifacts/2-3-delete-api-v1-todos-by-id.md` (this file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status updates)

## Change Log

- **2026-05-12:** Story context created by `bmad-create-story` — status **`ready-for-dev`**.
- **2026-05-12:** Validate Story (**VS**) — checklist review; clarifications applied to Tasks + validation report.
- **2026-05-12:** Implementation complete by `bmad-dev-story` — US-2.3.a unit test, IS-2.3.a rename, 404 envelope strengthening, AC3 prefix, OpenAPI smoke extension, OpenAPI description update, README DELETE paragraph — status **`review`**.
- **2026-05-12:** `bmad-code-review` — decision: remove README PATCH paragraph (strict 2.3 scope); patch: monotonic `sprint-status.yaml` `last_updated` — status **`done`**.
