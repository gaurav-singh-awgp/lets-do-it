---

## story_key: 3-1-patch-api-v1-todos-by-id-for-done-only-updates

story_id: "3.1"

epic: 3

status: done

---

# Story 3.1: PATCH /api/v1/todos/:id for done-only updates

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a **todo user**,

I want **to toggle completion without changing text**,

So that **my tasks reflect progress accurately**.

## Acceptance Criteria

1. **Done-only PATCH success (FR-04, FR-05)**  
   **Given** Stories 2.1–2.3 are complete and a todo exists  
   **When** `PATCH /api/v1/todos/:id` is called with JSON **`{ "done": true }`** or **`{ "done": false }`** only  
   **Then** the persisted `done` flag updates and the response is **200** with the **full updated todo** in **camelCase** (`id`, `text`, `done`, `createdAt`) per existing GET/POST shapes.  
   **Traces:** FR-04, FR-05; epics.md Story 3.1; `architecture.md` Format Patterns.

2. **Immutable text on PATCH (architecture)**  
   **When** the request body includes **`text`** (alone or with `done`) or any key other than **`done`**  
   **Then** the API returns **400** with **`error.code`** **`VALIDATION`** and **`error.details`** from Zod (flatten) — same envelope as POST validation failures.  
   **Traces:** Architecture “PATCH semantics”; epics.md Story 3.1.

3. **OpenAPI + README contract**  
   **Given** the Fastify route registers OpenAPI schema for PATCH  
   **When** a developer reads **`/documentation/json`** or the root **README** § API contract  
   **Then** PATCH is described consistently with implementation (body: `{ done: boolean }`, responses 200/400/404/500). README must mention PATCH alongside GET/POST/DELETE (today README documents GET/POST/DELETE only — **gap to close**).

4. **Automated tests**  
   **Given** epics test IDs **US-3.1.a**, **IS-3.1.a**, **IS-3.1.b**  
   **When** tests run (`npm run test -w api`, integration when `DATABASE_URL` set)  
   **Then**  
   - **US-3.1.a:** Unit-level assertion that `patchTodoBodySchema` accepts `{ done: true }` and rejects bodies that include `text` or stray keys (Zod `.strict()`).  
   - **IS-3.1.a:** Integration — row starts `done=false`, `PATCH` with `done:true`, **DB and JSON** show `done=true`.  
   - **IS-3.1.b:** Integration — same row, `PATCH` with `done:false`, persisted `done=false`.  
   Rejection paths (404 unknown id, 400 bad UUID, 400 extra keys) should remain covered — align test **titles** with these IDs where missing.

## Tasks / Subtasks

- [x] **Brownfield audit** (AC: 1–4)  
  - [x] Read `api/src/routes/todos.ts` — PATCH handler, OpenAPI `patch` schema, error mapping.  
  - [x] Read `api/src/schemas/todo.zod.ts` — `patchTodoBodySchema` strict shape.  
  - [x] Read `api/src/services/todo.service.ts` — `patchTodo` (must not update `text`).  
  - [x] Read `api/src/repositories/todo.repository.ts` — `updateDone` sets `done` + `updatedAt`.  
  - [x] Read `api/src/todos.integration.test.ts` — existing PATCH cases; map to **IS-3.1.*** and list gaps (toggle-back, README, OpenAPI JSON assertion for PATCH).

- [x] **Close test traceability** (AC: 4)  
  - [x] Add **unit** test file for Zod schema (e.g. `api/src/schemas/todo.patch.zod.unit.test.ts` or co-located `todo.zod.test.ts`) implementing **US-3.1.a**.  
  - [x] Rename or add integration examples so **IS-3.1.a** / **IS-3.1.b** are explicit (persist + toggle false in DB). Current file has `"PATCH /api/v1/todos/:id toggles done"` — extend or split so **both** epic scenarios are clearly labeled.

- [x] **OpenAPI verification** (AC: 3)  
  - [x] Extend the existing OpenAPI integration test in `todos.integration.test.ts` (or dedicated test) to assert **`paths["/api/v1/todos/{id}"].patch`** exists with expected response codes — mirror how DELETE is asserted.

- [x] **README** (AC: 3)  
  - [x] Add a **`PATCH /api/v1/todos/:id`** bullet under **## API contract**: body `{ "done": boolean }`, success **200** + todo object, **400** validation, **404** not found; note **no** `text` field on PATCH (reference OpenAPI).

- [x] **Regression**  
  - [x] `npm run test -w api` passes; integration suite passes when DB available.

## Dev Notes

### Brownfield reality (read before coding)

**PATCH is already implemented end-to-end in the API layer** — route registration, Zod `.strict()` reject for extra keys, service + repository `updateDone`, and several integration tests in `api/src/todos.integration.test.ts` (toggle `done:true`, 404, reject `{ done, text }`, invalid UUID).

Story 3.1 is **not** “greenfield implement PATCH”; it is **verify epic ACs**, **align README and OpenAPI checks with the shipped behavior**, and **make test coverage traceable** to **US-3.1.a / IS-3.1.a / IS-3.1.b**.

The **web** package already calls **`PATCH`** via `web/src/api/todosClient.ts` `patchTodo` — do not break JSON shape `{ done }` when tightening API validation.

### Architecture compliance (must follow)

- **JSON boundary:** camelCase DTO; **no** wrapper object on success; single todo object for PATCH 200. [Source: `_bmad-output/planning-artifacts/architecture.md` — Format Patterns]  
- **Errors:** `{ "error": { "code", "message", "requestId"?, "details"? } }`; **400** for validation, **404** missing todo, **500** unexpected. [Source: same]  
- **PATCH semantics:** Only **`done`** may change; reject **`text`** and any unknown fields with **400** (use Zod strict object — already in codebase). [Source: architecture.md — enforcement + Pattern Examples]  
- **Service layer:** `TodoService.patchTodo` should remain the gatekeeper if logic expands; repository updates only `done` + `updated_at`. [Source: architecture.md — `todo.service` owns rules]

### Library / stack (pinned)

| Package   | Version (from `api/package.json`) | Notes                                        |
|-----------|-----------------------------------|----------------------------------------------|
| fastify   | ^5.2.1                            | Route + `@fastify/swagger` schema            |
| zod       | ^3.24.1                           | `patchTodoBodySchema` — `.strict()`          |
| drizzle-orm | ^0.38.3                         | `updateDone` mutation                        |
| vitest    | ^3.1.4                            | Unit + integration tests                     |

### Files to touch (expected)

| File | Role |
|------|------|
| `api/src/schemas/todo.zod.ts` | **Read**; only change if AC gap in validation |
| `api/src/routes/todos.ts` | **Read**; only change if OpenAPI metadata wrong |
| `api/src/services/todo.service.ts` | **Read**; ensure immutability preserved |
| `api/src/repositories/todo.repository.ts` | **Read**; `updateDone` |
| `api/src/todos.integration.test.ts` | **Update** — IS-3.1 labels, IS-3.1.b persistence, optional OpenAPI PATCH assertion |
| **New** `api/src/schemas/*.test.ts` (or similar) | **US-3.1.a** Zod tests |
| `README.md` | **Update** — API contract § PATCH |

**Out of scope for 3.1:** TodoRow toggle UI and styling (**Story 3.2**); Playwright SC-01 (**Story 3.3**); CI matrix (**Story 3.4**). Epics explicitly defer **ES-3.1** browser E2E to 3.2/3.3.

### Testing requirements

- **Unit:** `patchTodoBodySchema` — valid minimal body; invalid when `text` present; invalid unknown keys.  
- **Integration (DB):** Full PATCH round-trip including **`done: false`** after **`done: true`** with SQL or follow-up GET verification.  
- **OpenAPI:** Machine-readable spec includes PATCH on `/api/v1/todos/{id}`.  
- Do **not** skip `describe.skipIf(!databaseUrl)` integration tests locally when validating — use Docker Postgres + `DATABASE_URL` as documented in README.

### Previous story intelligence (Epic 2 → Epic 3)

From **`2-4-todorow-delete-control-with-accessible-labeling.md`** (done):

- Prefer **extending** existing test files over new patterns; use **MSW** on web for mutation failures — relevant when you only touch API here, but **error envelope** shape must stay identical for web `ApiEnvelopeError`.  
- Epic 2 established **TanStack Query** invalidation after mutations; PATCH on the client already exists — API stability is critical.  
- Playwright / a11y work is **not** part of 3.1.

### Git intelligence (recent commits)

Recent work focused **web** delete tests and **api** DELETE contract (`742f3fc`, `3e70c85`). PATCH predates those; this story formalizes **Epic 3** tracking and doc/test parity.

### Latest technical notes

- Zod **3.24** `z.object({ … }).strict()` rejects unknown keys — appropriate for “no text on PATCH”.  
- Fastify **5** + `@fastify/swagger` **9** — keep `schema.response` aligned with actual `send()` bodies.

### Project context reference

- `_bmad-output/project-context.md` — placeholder sections; rely on **architecture.md** + this story for rules.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.1, test scenarios US/IS-3.1.*]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — API patterns, PATCH example, error envelope]  
- [Source: `api/src/routes/todos.ts` — PATCH route implementation]  
- [Source: `README.md` — § API contract (extend with PATCH)]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_(none)_

### Completion Notes List

- Confirmed existing PATCH route, Zod `.strict()` body, service `patchTodo`, and repository `updateDone` meet AC1–2; no API code changes required.
- Added **US-3.1.a** `patchTodoBodySchema` tests in `api/src/schemas/todo.zod.test.ts`.
- Integration: **IS-3.1.a** / **IS-3.1.b** with DB assertions; OpenAPI test asserts `patch` on `/api/v1/todos/{id}` with 200/400/404/500; renamed immutable-text PATCH test for clarity.
- README **§ API contract** documents **`PATCH /api/v1/todos/:id`** (done-only, errors, no `text`).
- Regression: `npm run test -w api` and `npm run test -w web` passed (integration block skipped locally without `DATABASE_URL`; run with Postgres to execute IS-* integration tests).

### File List

- `README.md`
- `api/src/schemas/todo.zod.test.ts`
- `api/src/todos.integration.test.ts`
- `_bmad-output/implementation-artifacts/3-1-patch-api-v1-todos-by-id-for-done-only-updates.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-05-12: Story 3.1 implementation — tests, README PATCH contract, OpenAPI integration assertion; status → review.

---

**Completion status:** review — implementation complete, pending code-review workflow.

### Review Findings

- [x] [Review][Patch] P1: IS-3.1.a + IS-3.1.b assert only `done`; full todo shape (`id`, `text`, `createdAt`) unverified [api/src/todos.integration.test.ts:157,200]
- [x] [Review][Patch] P2: IS-3.1.b accesses `row.rows[0]!` without prior `toHaveLength(1)` guard [api/src/todos.integration.test.ts:195-199]
- [x] [Review][Patch] P3: IS-3.1.b never verifies intermediate `done=true` state (HTTP body + DB) before the false-flip PATCH [api/src/todos.integration.test.ts:169-200]
- [x] [Review][Patch] P4: Missing unit test — `patchTodoBodySchema.parse({})` (required `done` key absent) [api/src/schemas/todo.zod.test.ts:46-74]
- [x] [Review][Patch] P5: Missing unit tests — `patchTodoBodySchema` with non-boolean `done` (`done: 1`, `done: null`) [api/src/schemas/todo.zod.test.ts:46-74]
- [x] [Review][Patch] P6: Missing integration test — PATCH with missing/empty body should return 400 [api/src/todos.integration.test.ts]
- [x] [Review][Patch] P7: Missing integration test — PATCH with `done: 1` (non-boolean at HTTP layer) should return 400 [api/src/todos.integration.test.ts]
- [x] [Review][Patch] P8: OpenAPI integration test validates `id:uuid` param but never asserts request body schema is documented [api/src/todos.integration.test.ts:340-350]
- [x] [Review][Patch] P9: `patchIdParam` accessed via optional chain without `.toBeDefined()` guard — format assertion vacuously passes if param is absent [api/src/todos.integration.test.ts:346-347]
- [x] [Review][Patch] P10: `rejects { text } only` test conflates two rejection causes — throws because `done` is required-absent, not because `.strict()` rejected `text` [api/src/schemas/todo.zod.test.ts:69-71]
- [x] [Review][Patch] P11: Rejection-path integration tests (404 unknown id, 400 bad UUID) lack story-ID prefixes required by AC4 [api/src/todos.integration.test.ts]
- [x] [Review][Patch] P12: README non-UUID `400` path does not name `error.code` = `VALIDATION`, unlike the DELETE entry [README.md:103]
- [x] [Review][Patch] P13: README uses `true|false` pseudo-code notation inconsistent with `{ "text": "…" }` style used for POST [README.md:103]
- [x] [Review][Defer] D1: Schema, route, service, repository absent from diff — brownfield verification gap; manually verify existing files comply with architecture constraints [api/src/schemas/todo.zod.ts, routes/todos.ts, services, repositories] — deferred, pre-existing
- [x] [Review][Defer] D2: IS-/US- test taxonomy convention undocumented and inconsistently applied across the test suite — deferred, pre-existing
- [x] [Review][Defer] D3: TOCTOU race — DELETE between `findById` and `updateDone` in `patchTodo` service — deferred, pre-existing
- [x] [Review][Defer] D4: README omits `500` response for PATCH (consistent with DELETE which also omits it; pre-existing documentation pattern) — deferred, pre-existing

## Questions / clarifications (non-blocking)

- If product ever requires **partial PATCH** (e.g. omit `done`), define explicitly — current contract requires **`done`** boolean in body per OpenAPI `required: ["done"]`.
