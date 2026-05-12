---

## story_key: 3-3-end-to-end-smoke-for-sc-01-core-loop

story_id: "3.3"

epic: 3

status: done

---

# Story 3.3: End-to-End Smoke for SC-01 Core Loop

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created. -->

## Story

As a **product owner**,
I want **an automated script covering open -> add -> complete -> delete -> empty**,
So that **we can rerun the unaided core loop cheaply**.

## Acceptance Criteria

1. **SC-01 scripted journey in Playwright (primary)**
   **Given** Epics 1-3 features are integrated and runnable
   **When** `tests/e2e/todos.spec.ts` is executed
   **Then** it performs the single scripted path: open app -> add one todo -> toggle complete -> delete -> assert empty state
   **And** this path maps directly to PRD SC-01 owner script.
   **Traces:** PRD SC-01; epics Story 3.3 AC.

2. **Persistence confidence extension (SC-02 hint)**
   **Given** a todo is created in the SC-01 flow
   **When** page is reloaded before completion/delete
   **Then** the created item remains visible after reload.
   **Traces:** epics ES-3.3.b; PRD SC-02.

3. **Failure evidence for CI diagnosis**
   **Given** the core loop test fails in CI
   **When** Playwright reports the failure
   **Then** trace/screenshot artifacts are available per project config (`trace: on-first-retry` already set)
   **And** README Test section clearly states how to run the E2E suite locally.
   **Traces:** architecture QA integration; NFR-06 docs maintainability.

4. **Scope discipline**
   **Given** known pre-existing instability in non-core E2E files
   **When** implementing Story 3.3
   **Then** changes are limited to SC-01 core loop coverage and related docs
   **And** pre-existing B1/B2 infra debt (`a11y-list-shell.spec.ts`, `load-error.spec.ts`, global setup guard) is not silently broadened in this story.
   **Traces:** epic 2 retro action items; deferred-work continuity.

5. **Automated test IDs present (AC1-4)**
   - **ES-3.3.a:** open -> add -> complete -> delete -> empty in one test body
   - **ES-3.3.b:** reload after add preserves item before remaining steps
   - Existing story-ID tests in `todos.spec.ts` continue passing

## Tasks / Subtasks

- [x] **Brownfield audit for Story 3.3** (AC: 1-4)
  - [x] Confirm current `tests/e2e/todos.spec.ts` already has split tests for create/complete/delete and identify the gap (single scripted flow)
  - [x] Confirm `playwright.config.ts` evidence settings (`trace`) and reuse strategy
  - [x] Confirm README `## Test` documents `npm run test:e2e`
  - [x] Confirm known unrelated failures in `a11y-list-shell.spec.ts` and `load-error.spec.ts` are tracked and out of scope for this story

- [x] **Implement ES-3.3.a core loop smoke test** (AC: 1, 5)
  - [x] Add a dedicated Playwright test titled `ES-3.3.a` in `tests/e2e/todos.spec.ts`
  - [x] In one test body: open -> add -> verify visible -> complete -> verify checked/styled -> delete -> verify empty state
  - [x] Keep selectors anchored to row-specific locators to avoid global false-pass assertions

- [x] **Implement ES-3.3.b reload durability check** (AC: 2, 5)
  - [x] Add companion `ES-3.3.b` to perform reload after add and verify item still present
  - [x] Ensure this check happens before delete so SC-02 hint is meaningful

- [x] **README E2E clarity pass (minimal)** (AC: 3)
  - [x] Verify README Test section explicitly reflects `npm run test:e2e` and webServer behavior
  - [x] No README text changes were required; existing instructions already satisfied AC3

- [x] **Regression**
  - [x] `npm run test:e2e -- tests/e2e/todos.spec.ts` passes (8/8)
  - [x] `npm run test:web` remains green (29/29)

## Dev Notes

### Story foundation from epics

Story 3.3 is intentionally test-heavy and ties directly to PRD SC-01. The key deliverable is not new API/UI functionality; it is a robust, repeatable smoke journey that reflects real user behavior and can be rerun in CI.

From `epics.md` Story 3.3:
- Primary target: **ES-3.3.a** scripted core path.
- Secondary extension: **ES-3.3.b** reload/persistence confidence.
- This story should not absorb Epic 3.4 CI-axe gate scope.

### Brownfield intelligence from Story 3.2

Recent work already strengthened `todos.spec.ts` with row-scoped done assertions and PATCH-call verification (`ES-3.2.a`). Reuse those patterns instead of introducing new global selectors.

Do not regress these hardened patterns:
- Row-scoped locators for checkbox and done text.
- Explicit network intent checks where meaningful.

### Current state of files to be UPDATED (read completely before coding)

1. **`tests/e2e/todos.spec.ts`**
   - Current state: contains separate tests for `empty state`, `create todo`, `complete todo`, `delete todo`, `ES-3.2.a`, and create-error path.
   - Story 3.3 change: add or refactor into a single explicit SC-01 scripted smoke path (`ES-3.3.a`) plus reload check (`ES-3.3.b`).
   - Must preserve: existing cleanup in `beforeEach`, stable role-based selectors, and existing Story 2/3 test IDs unless intentionally consolidated with equivalent coverage.

2. **`README.md`**
   - Current state: Test section already includes Playwright invocation and E2E wiring notes.
   - Story 3.3 change: only minimal updates if ambiguity remains around how to run the SC-01 smoke path.
   - Must preserve: NFR-06 required structure (`Run`, `Test`, `API contract`) and existing command correctness.

3. **`playwright.config.ts`** (likely read-only)
   - Current state: `trace: "on-first-retry"`, `webServer` uses `npm run dev:e2e`, retries in CI only.
   - Story 3.3 change: generally none required unless failure evidence AC cannot be met otherwise.
   - Must preserve: existing project runner assumptions and CI behavior.

### Architecture compliance guardrails

| Topic | Requirement | Source |
|------|-------------|--------|
| E2E location | Keep smoke tests under `tests/e2e/` | architecture QA integration |
| Script parity | README Test commands must match executable scripts | NFR-06 + architecture README/CI |
| A11y/CI boundary | NFR-07 full gate belongs to Story 3.4, not 3.3 | epics 3.4 scope |
| Selector stability | Prefer role/text + row-scoped locators over broad class globals | Story 3.2 learnings + UX clarity |
| Core-loop truthfulness | Test should mirror PRD SC-01 exactly in order | PRD SC-01 |

### Known constraints and pre-existing risks

- `npm run test:e2e` currently shows pre-existing failures in:
  - `tests/e2e/a11y-list-shell.spec.ts`
  - `tests/e2e/load-error.spec.ts`
- These are tracked debt items (retro B1/B2) and should not be reframed as Story 3.3 regressions.
- For Story 3.3 completion, prioritize explicit verification of `tests/e2e/todos.spec.ts` coverage and behavior.

### Git intelligence summary

Recent commit pattern for this area:
- `fb29314` test(web): close Story 3.2 review gaps
- `8e2f89d` test(api): harden story 3.1 PATCH coverage after code review
- `3e70c85` test(web): finalize story 2.4 delete coverage and review fixes

Practical implication: maintain the existing high-signal style (story-ID test naming, scoped assertions, mutation/result verification).

### Latest technical information (web research)

- Playwright release notes indicate newer versions beyond the repo-pinned `@playwright/test ^1.55.0` are available in 2026, but this story should **not** include dependency upgrades unless explicitly requested.
- Current best-practice alignment already present in repo:
  - `trace: "on-first-retry"` for CI-friendly diagnostics.
  - serial-friendly deterministic test style for stateful flows.
- Optional enhancement (only if needed and low-risk): `screenshot: "only-on-failure"` / `video: "retain-on-failure"` can improve diagnostics but belongs more naturally to Story 3.4 CI hardening.

### Definition of done for this story

Story 3.3 is done when:
1. A single, explicit SC-01 smoke path exists and is reliable (`ES-3.3.a`).
2. Reload durability check is covered (`ES-3.3.b`).
3. README Test instructions remain accurate and clear for E2E execution.
4. No unintended scope expansion into unrelated E2E debt or CI matrix redesign.

### Project context reference

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.3)
- `_bmad-output/planning-artifacts/prd.md` (SC-01, SC-02, NFR-06)
- `_bmad-output/planning-artifacts/architecture.md` (QA integration, test placement, README parity)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (core loop, failure/retry UX intent)
- `_bmad-output/implementation-artifacts/3-2-accessible-done-toggle-with-completed-styling.md` (carry-forward testing patterns)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5

### Debug Log References

_(none)_

### Completion Notes List

- Implemented `ES-3.3.a` in `tests/e2e/todos.spec.ts` as a single SC-01 scripted flow: open -> add -> complete -> delete -> empty.
- Implemented `ES-3.3.b` companion test to reload after add and verify persistence before complete/delete steps.
- Reused row-scoped locators to avoid global false-pass behavior and preserve Story 3.2 test hardening patterns.
- Verified Playwright diagnostics requirements were already satisfied by existing `playwright.config.ts` (`trace: "on-first-retry"`).
- Verified README E2E instructions already matched executable commands; no README edit required.
- Validation results: `npm run test:e2e -- tests/e2e/todos.spec.ts` passed (8/8), and `npm run test:web` passed (29/29).
- Pre-existing failures in `a11y-list-shell.spec.ts` and `load-error.spec.ts` were not touched, consistent with Story 3.3 scope discipline.


### File List

- `tests/e2e/todos.spec.ts`


### Review Findings

- [x] **P-1 (patch)** `ES-3.3.b` was missing `toHaveCount(0)` assertion on the deleted item text before `todo-empty` check — applied to match sibling test pattern.
- [ ] **BH-2 (defer)** `ES-3.3.a` could additionally assert `todo-empty` count 0 right after add — low risk, future pass.
- [ ] **BH-3 (defer)** `ES-3.3.b` title doesn't explicitly mention SC-02 — cosmetic naming inconsistency.
- [ ] **EC-3 (defer)** `page.locator("li")` is unscoped vs. `getByRole("list", ...)` pattern in "create todo" test — deferred until layout grows.
- [ ] **AA AC3 nuance (defer)** No explicit `screenshot: "only-on-failure"` config; trace-on-retry already satisfies AC3 — belongs in Story 3.4.
- ~~EC-1 dismissed~~: pre-existing `fullyParallel` + shared DB issue, tracked as retro B1/B2.
- ~~EC-2 dismissed~~: pre-existing `API_BASE_URL` alignment issue.
- ~~AA AC4 dismissed~~: `sprint-status.yaml` is expected BMad process artifact.

## Change Log

- 2026-05-12: Story 3.3 context created by `bmad-create-story` - status `ready-for-dev`.
- 2026-05-12: Story 3.3 implementation complete by `bmad-dev-story` - status `review`; added ES-3.3.a and ES-3.3.b in `tests/e2e/todos.spec.ts`.
- 2026-05-12: Story 3.3 code review complete by `bmad-code-review` - status `done`; 1 patch applied (ES-3.3.b missing toHaveCount(0) after delete), 4 deferred, 3 dismissed.
