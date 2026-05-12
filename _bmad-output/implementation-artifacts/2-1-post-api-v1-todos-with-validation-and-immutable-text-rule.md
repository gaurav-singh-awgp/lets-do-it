---

## story_key: 2-1-post-api-v1-todos-with-validation-and-immutable-text-rule

story_id: "2.1"
epic: 2
status: done

# Story 2.1: POST /api/v1/todos with validation and immutable text rule

Status: done

Ultimate context engine analysis completed - comprehensive developer guide created

## Story

As a **todo user**,
I want **to create a todo with text that the server validates and stores safely**,
So that **bad input never corrupts my list**.

## Acceptance Criteria

1. **Happy path — 201 + camelCase DTO**  
   **Given** Story 1.3 complete and DB reachable  
   **When** `POST /api/v1/todos` is called with JSON `{ "text": "…" }` where `text` is non-empty after trim and within the Unicode code-point cap  
   **Then** response is **201** with body `{ id, text, done, createdAt }` in **camelCase** and the persisted row matches `text` and `done: false`  
   **Traces:** FR-01 baseline; epics Story 2.1.

2. **Empty / whitespace — 4xx + envelope**  
   **When** `text` is empty or whitespace-only (after trim)  
   **Then** response is **4xx** with stable error envelope `{ error: { code, message, requestId?, details? } }` with **`code: "VALIDATION"`** (or equivalent documented in OpenAPI for create failures)  
   **Traces:** FR-01.

3. **Length cap — 500 Unicode code points**  
   **When** `text` exceeds **500 Unicode code points** (not UTF-16 `.length`; use spread / iterator semantics per `countUnicodeCodePoints`)  
   **Then** response is **4xx** and **no row** is inserted  
   **Traces:** FR-02.

4. **Immutable text on non-create paths**  
   **And** the service layer does not expose a path to mutate `text` after create (PATCH accepts **`done` only** via `patchTodoBodySchema.strict()`; repository `updateDone` must not touch `text`)  
   **Traces:** epics Story 2.1; architecture PATCH semantics.

5. **OpenAPI documents create**  
   **And** registered OpenAPI for `POST /api/v1/todos` includes request body schema and **201** / **400** / **500** responses consistent with runtime behavior  
   **Traces:** Story 2.1 AC.

## Tasks / Subtasks

- [x] **Brownfield audit vs AC** (AC: 1–5)
  - [x] Confirmed `POST` in `todos.ts` matches AC1–5; `TodoService` / `TodoRepository` have no text mutation on PATCH path beyond existing `updateDone`.

- [x] **Unit tests — US-2.1.a / US-2.1.b** (AC: 2, 3)
  - [x] **`todo.zod.test.ts`:** Renamed describe to **US-2.1.a**; added whitespace-only rejection; added **US-2.1.b** block with `501` code-point `"x".repeat(501)` and spread-length assertion.

- [x] **Integration tests — IS-2.1.a / IS-2.1.b** (AC: 1, 3, partial 4)
  - [x] **IS-2.1.a:** `SELECT text, done FROM todos WHERE id = $1` after **201** POST.
  - [x] **IS-2.1.b:** Two POSTs then GET asserts length **2** and **Second** before **First** (newest-first).

- [x] **Integration — oversize body** (AC: 3)
  - [x] POST `501`×`x` → **400**; `count(*)` from `todos` is **0** after `beforeEach` clear + failed insert.

- [x] **README / API contract** (AC: 5, NFR-06 alignment)
  - [x] Added **`POST /api/v1/todos`** paragraph under **API contract** (body, **201**, **400** / `VALIDATION`, Unicode cap).

- [x] **Regression guard** (AC: 4)
  - [x] **`PATCH rejects extra keys (immutable text)`** still **400**; full `npm run test:api` green (31 tests).

### Review Findings

- [x] [Review][Patch] IS-2.1.b ordering assertion can be flaky when timestamps tie [api/src/todos.integration.test.ts:104] — resolved by asserting two created items exist without brittle tie-order dependency.
- [x] [Review][Patch] OpenAPI JSON test narrows path type to `get` only but asserts `post` [api/src/todos.integration.test.ts:275] — resolved by widening asserted path type to include `post`.
- [x] [Review][Patch] Boundary coverage gap: no explicit acceptance test at exactly 500 Unicode code points [api/src/schemas/todo.zod.test.ts:30] — resolved by adding a passing 500-code-point unit test.
- [x] [Review][Patch] Sprint tracker `last_updated` regresses backward in current diff [_bmad-output/implementation-artifacts/sprint-status.yaml:38] — resolved by updating to a forward timestamp.
- [x] [Review][Defer] Global `noindex` in web shell may be undesirable for production SEO [web/index.html:7] — deferred, pre-existing
- [x] [Review][Defer] Unit/E2E use different `axe-core` versions and may diverge in violations [package-lock.json:171] — deferred, pre-existing
- [x] [Review][Defer] Story 2.1 diff includes unrelated dependency/web/artifact churn outside expected file scope [package-lock.json:1] — deferred, pre-existing

## Dev Notes

### Epic context

- **Epic 2:** add/remove todos with accessible controls. **2.1** is API-only create + validation + immutability groundwork; **2.2** wires the web composer; **2.3–2.4** delete API + UI. [Source: `epics.md` — Epic 2]

### Critical brownfield reality (read first)

**Much of Story 2.1 is already implemented on `main`** (POST route, Zod `createTodoBodySchema`, OpenAPI body, integration smoke for POST). Treat this story primarily as:

- **Verification** against epics AC1–5  
- **Test gap closure** (US-2.1.b, IS-2.1.a/b explicit, oversize POST integration)  
- **Documentation / labeling** cleanup (README, test describe names)

Do **not** rip out working POST behavior to “rewrite” the story from scratch.

### Brownfield inventory — files to read before editing

| File | Current state | Story 2.1 implication |
|------|----------------|---------------------|
| `api/src/routes/todos.ts` | `POST /api/v1/todos` with `createTodoBodyOpenApi`, Zod parse, **201** / Zod→**400** / **500** | Verify OpenAPI vs runtime; extend tests only if AC gaps. |
| `api/src/schemas/todo.zod.ts` | `textField` trim + min(1) + refine ≤ `MAX_TODO_TEXT_CODE_POINTS` (500) | US-2.1.b targets this refine. |
| `api/src/lib/constants.ts` | `MAX_TODO_TEXT_CODE_POINTS`, `countUnicodeCodePoints` | Use for test fixtures. |
| `api/src/services/todo.service.ts` | `createTodo` → `repo.insert({ text, done: false })`; `patchTodo` → `updateDone` only | Satisfies “no text mutation on non-create” if PATCH schema stays strict. |
| `api/src/repositories/todo.repository.ts` | `insert`, `updateDone` (no `updateText`) | Preserve; do not add silent text updates. |
| `api/src/todos.integration.test.ts` | POST create + empty `text` **400** + PATCH immutability test | Add IS-2.1.a/b + oversize POST; align test titles with epic IDs. |
| `api/src/schemas/todo.zod.test.ts` | Only empty-text case; mislabeled `US-1.3.b` | Add 501 code-point case; fix describe label → **US-2.1.a**. |
| `README.md` | API contract emphasizes GET + error envelope | Add POST one-liner if missing. |

### Technical requirements (dev agent guardrails)

| Topic | Requirement |
|-------|-------------|
| Error envelope | **400** validation → `sendError(..., "VALIDATION", ..., { details: zodFlatten })` — match existing GET validation style. |
| Unicode cap | **500 code points**, not `String.length` for astral plane; tests must construct strings whose **spread length** is 501. |
| PATCH immutability | `patchTodoBodySchema` is **`.strict()`** — extra keys (e.g. `text`) → **400**; integration test already expects **400** for `{ done: true, text: "nope" }`. |
| Fastify AJV | `buildApp` uses AJV settings that must **not** strip `text` before Zod on PATCH (regression from Story 1.3/1.5); do not revert `removeAdditional` behavior without re-reading `api/src/app.ts`. |

### Architecture compliance

| Topic | Source |
|-------|--------|
| Versioned JSON under `/api/v1` | `architecture.md` — API patterns |
| OpenAPI + error envelope | `architecture.md`, Story 1.3 |
| Vitest integration with `inject` + optional Postgres | `architecture.md` — QA integration |

### Library / framework requirements

- **Fastify 5.x**, **Zod 4.x** (project already on these) — no dependency churn unless security advisory forces it.  
- Tests: **Vitest** + `app.inject` per existing `todos.integration.test.ts`.

### File structure requirements

**Update (expected):**

```
api/src/schemas/todo.zod.test.ts
api/src/todos.integration.test.ts
README.md (optional, if API contract gap)
```

**Read-only unless gaps found:**

```
api/src/routes/todos.ts
api/src/services/todo.service.ts
api/src/schemas/todo.zod.ts
```

### Testing requirements

| ID | Intent | Where |
|----|--------|--------|
| **US-2.1.a** | Empty / whitespace `text` → validation error | `todo.zod.test.ts` |
| **US-2.1.b** | 501 code points → rejected | `todo.zod.test.ts` |
| **IS-2.1.a** | POST → DB row matches | `todos.integration.test.ts` |
| **IS-2.1.b** | Two POSTs → two rows | `todos.integration.test.ts` |
| **ES-2.1.a** | Optional Playwright `request.post` | Deferred per epic; out of scope unless you add an explicit optional task |

### Previous story intelligence (Epic 1 closure — 1.6)

- **Epic 1 is `done`** in `sprint-status.yaml`; list shell, CI, baseline a11y shipped.  
- **POST is already used** by Playwright `todos.spec.ts` and integration tests — keep **201** behavior stable for e2e.  
- **Immutability + AJV:** deferred-work and Story 1.3 notes discuss `removeAdditional: false` — **never** reintroduce stripping that makes PATCH accept smuggled `text`. [Source: `deferred-work.md`, prior story artifacts]

### Git intelligence summary

- **`f095142`** — Story 1.6: a11y tests + story file.  
- **`c4d4077`** — CI + README guard.  
- Expect Story 2.1 to be a **small, test-forward** delta unless audit finds AC gaps.

### Latest tech information

- **Zod 4** `.strict()` on object schemas rejects unknown keys — correct tool for PATCH immutability.  
- **Unicode length in tests:** `const s = "x".repeat(501)` is 501 code points; for emoji/grapheme edge cases prefer explicit `[...]s.length` assertion in the test helper comment.

### Project context reference

- `_bmad-output/project-context.md` is still sparse — follow **`architecture.md`**, **`epics.md`**, **`prd.md`**, and this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 2.1]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — validation, QA]  
- [Source: `api/src/routes/todos.ts`, `api/src/schemas/todo.zod.ts`, `api/src/todos.integration.test.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Cursor)

### Debug Log References

### Completion Notes List

- Brownfield audit: POST + Zod + OpenAPI already matched story intent; no route/service code changes required.
- Added **US-2.1.a** (empty, whitespace) and **US-2.1.b** (501 code points) unit coverage in `todo.zod.test.ts`.
- Added **IS-2.1.a**, **IS-2.1.b**, and oversize POST integration tests in `todos.integration.test.ts`; extended OpenAPI JSON test to assert **`post`** is defined on `/api/v1/todos`.
- Documented **POST** in `README.md` **API contract** section.
- Regression: `npm run test:api` (31 tests) and `npm run test:web` (18 tests) and `npm run lint` all pass.

### File List

- `api/src/schemas/todo.zod.test.ts`
- `api/src/todos.integration.test.ts`
- `README.md`
- `_bmad-output/implementation-artifacts/2-1-post-api-v1-todos-with-validation-and-immutable-text-rule.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-05-12:** Story context created by `bmad-create-story` — status `ready-for-dev`.
- **2026-05-12:** Implemented test + README gaps per story; `bmad-dev-story` complete — status `review`.

---

### Clarifications / open questions (non-blocking)

1. If product later requires **idempotent POST** (dedupe), that is a new epic/story — default remains **two rows** for two POSTs (IS-2.1.b).  
2. If OpenAPI generator clients are added later, ensure **POST body** `minLength` / description stays aligned with Zod trim semantics.
