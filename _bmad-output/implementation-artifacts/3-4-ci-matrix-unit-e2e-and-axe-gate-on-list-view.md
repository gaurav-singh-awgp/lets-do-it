---

## story_key: 3-4-ci-matrix-unit-e2e-and-axe-gate-on-list-view

story_id: "3.4"

epic: 3

status: done

---

# Story 3.4: CI Matrix — Unit, E2E, and Axe Gate on List View

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created. -->

## Story

As a **maintainer**,
I want **CI to enforce tests and critical a11y violations on the main list flows**,
So that **NFR-06 and NFR-07 stay true on main**.

## Acceptance Criteria

1. **Full CI gate: unit + E2E + axe (AC1)**
   **Given** Stories 1.5–1.6, 2.x, 3.1–3.3 complete
   **When** CI runs on a PR touching relevant paths
   **Then** it runs `api` + `web` unit/component tests, Playwright E2E, and an axe job that exercises **add → complete → delete** on the list view
   **And** zero critical axe violations per NFR-07 definition used in Story 1.6 (extended to full flows)
   **And** README **Test** section matches CI commands (single source of truth, NFR-06)
   **And** document or ticket hooks for NFR-01/NFR-02 measurement (logs/timers) added where feasible without vendor lock-in.
   **Traces:** NFR-01–NFR-07; PRD SC-03/SC-04 alignment via documentation or lightweight timing.

2. **ES-3.4.a: Full flow axe assertion (AC2)**
   **Given** the live app stack is running
   **When** `tests/e2e/a11y-list-shell.spec.ts` is executed
   **Then** a single test (`ES-3.4.a`) performs add → complete → delete with axe assertion for zero critical violations at each DOM transition
   **And** this test is reachable from `npm run test:e2e` (included in CI by default)
   **Traces:** NFR-07; ES-3.4.a per epics.

3. **B1: CI-safe global setup (AC3)**
   **Given** CI runs with Postgres already provided by Actions `services:`
   **When** Playwright global setup runs
   **Then** `docker compose up -d` is skipped when `process.env.CI` is truthy, preventing silent error swallowing
   **Traces:** deferred-work `global-setup.mjs` item; retro action B1.

4. **B2: Vitest integration isolation explicit (AC4)**
   **Given** API integration tests use a shared Postgres database
   **When** Vitest runs the API test suite
   **Then** `api/vitest.config.ts` explicitly documents its isolation policy (serial pool or `maxConcurrency: 1`) to prevent cross-test DB interference
   **Traces:** deferred-work `1-2-local-postgresql…` item; retro action B2.

5. **CI workflow named axe step (AC5)**
   **Given** `.github/workflows/ci.yml` runs end-to-end tests
   **When** E2E tests complete
   **Then** the workflow has a discrete named step that identifies the axe gate is included, matching README CI documentation
   **Traces:** NFR-07 CI gate requirement; NFR-06 README parity.

6. **Scope discipline (AC6)**
   **Given** several deferred items exist in `deferred-work.md`
   **When** implementing Story 3.4
   **Then** changes are limited to CI workflow, global setup guard, Vitest isolation docs, axe full-flow test, and README CI section
   **And** axe version alignment (jest-axe vs @axe-core/playwright), perf smoke (ES-3.4.b), CORS hardening, OpenAPI drift, and TOCTOU fixes are NOT absorbed without explicit scope expansion.
   **Traces:** deferred-work; epic 2 retro; Story 3.3 scope discipline precedent.

## Tasks / Subtasks

- [x] **B1: Add CI guard to `tests/e2e/global-setup.mjs`** (AC: 3)
  - [x] Add `if (process.env.CI) return;` at the top of `globalSetup()` before the `try { execSync("docker compose up -d") }` block
  - [x] Preserve existing catch block and comment for non-CI environments
  - [x] Verify: in CI context (`CI=true`) the function returns immediately; in local dev it still attempts Compose

- [x] **B2: Document Vitest integration isolation in `api/vitest.config.ts`** (AC: 4)
  - [x] Add `pool: "forks"` with `poolOptions: { forks: { singleFork: true } }` (or equivalent `maxForks: 1`) to the `test` block to serialize DB-backed integration tests
  - [x] Add inline comment explaining why: shared Postgres — serial execution prevents cross-test row interference
  - [x] Verify `npm run test:api` still passes with isolation constraint applied

- [x] **Implement ES-3.4.a: Full add → complete → delete axe test** (AC: 2, 5)
  - [x] Add `ES-3.4.a` to `tests/e2e/a11y-list-shell.spec.ts` as a new test inside the existing `describe` block
  - [x] Use `clearTodos` in the test (or rely on describe-level `beforeEach` already present)
  - [x] Sequence: `page.goto("/")` → fill + Add → `AxeBuilder.analyze()` → toggle done → `AxeBuilder.analyze()` → delete → `AxeBuilder.analyze()` → assert `todo-empty`
  - [x] Call `assertNoCriticalViolations()` (already defined in file) at each axe checkpoint
  - [x] Use row-scoped locators consistent with `todos.spec.ts` patterns (ES-3.2.a, ES-3.3.a)

- [x] **Update `.github/workflows/ci.yml`** (AC: 1, 5)
  - [x] Rename the existing `End-to-end tests` step to `End-to-end tests (incl. axe/NFR-07 gate)` to make CI intent explicit
  - [x] Add inline comment block above the E2E step linking to NFR-06 / NFR-07 requirement
  - [x] No structural changes to job ordering or matrix required (axe runs inside `npm run test:e2e`)

- [x] **Update `playwright.config.ts` isolation comment** (AC: 4)
  - [x] Add `workers: 1` (or comment documenting retro B2 rationale) to keep tests stable until formal shard strategy is designed
  - [x] Note: current config has `fullyParallel: true` with no `workers` — retro B2 called for `workers: 1` comment to guide dev agents

- [x] **Update README CI section** (AC: 1, NFR-06)
  - [x] Verify the `## Test` and `## Continuous integration` (or equivalent) sections match workflow commands
  - [x] Add a note that the E2E step includes the axe/NFR-07 gate
  - [x] Keep the three required blocks: **Run**, **Test**, **API contract** (as verified by `check:readme`)

- [x] **Regression**
  - [x] `npm run test:api` passes (with isolation constraint)
  - [x] `npm run test:web` passes (29/29)
  - [x] `npm run test:e2e -- tests/e2e/a11y-list-shell.spec.ts` passes (5/5 including ES-3.4.a)
  - [x] `npm run test:e2e -- tests/e2e/todos.spec.ts` still passes (8/8)

## Dev Notes

### Story foundation from epics

Story 3.4 is the CI hardening capstone for Epic 3. The deliverables are:
1. A reliable CI workflow that actually gates on axe violations (NFR-07 extension from Story 1.6 to full flows).
2. Infrastructure fixes (B1, B2) that have been deferred through Stories 3.1–3.3 and are now the right owner.
3. Documentation parity — README CI section must stay truthful after changes.

There is **no new API or UI feature** in this story. All changes are: test infrastructure, CI config, and documentation.

### Brownfield audit — files being updated

#### 1. `tests/e2e/global-setup.mjs` (UPDATE — B1)

Current state (complete):
```js
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default async function globalSetup() {
  try {
    execSync("docker compose up -d", { cwd: root, stdio: "ignore" });
  } catch {
    // Docker may be unavailable; tests still run if Postgres is already up.
  }
}
```

What changes: add `if (process.env.CI) return;` BEFORE the try block.
What to preserve: catch block and comment for non-CI environments.

#### 2. `api/vitest.config.ts` (UPDATE — B2)

Current state (complete):
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: false,
  },
});
```

What changes: Add pool/isolation constraint. The minimal approach is:
```ts
pool: "forks",
poolOptions: { forks: { singleFork: true } },
```
This serializes all test files through one fork, preventing cross-test DB row interference.
Alternatively: `maxWorkers: 1` / `minWorkers: 1`.
Verify vitest version supports the chosen option (`package.json` has `"vitest": "^3.1.3"`).

#### 3. `tests/e2e/a11y-list-shell.spec.ts` (UPDATE — ES-3.4.a)

Current state: 4 tests under `describe("ES-1.6.a — axe on list shell (GET states)")`:
- empty state, populated list, load-error banner, composer client validation
- All use `beforeEach` → `clearTodos(request)`
- All use `assertNoCriticalViolations()` helper

The file comment at line 7–8 explicitly says:
> "Story 3.4 will extend this to full add/complete/delete paths (NFR-07 full CI matrix)."

What changes: Add a new test `ES-3.4.a` to the same describe block. Do NOT change existing tests.

Pattern to follow from `todos.spec.ts` (ES-3.3.a) for row-scoped locators:
```ts
const row = page.locator("li").filter({ hasText: "ES-3.4.a axe todo" });
await row.getByRole("checkbox", { name: /toggle done for es-3\.4\.a axe todo/i }).click();
```

Each `AxeBuilder.analyze()` call should be scoped to avoid false positives from route-intercepted states. The simplest and most reliable approach is full-page analysis at each step — consistent with existing tests.

#### 4. `.github/workflows/ci.yml` (UPDATE — minor)

Current E2E step:
```yaml
- name: End-to-end tests
  run: npm run test:e2e
```

What changes: rename for explicitness:
```yaml
- name: End-to-end tests (incl. axe / NFR-07 gate)
  run: npm run test:e2e
```

The command stays the same — `npm run test:e2e` runs all specs including `a11y-list-shell.spec.ts` which has the axe gate. No structural changes to the job matrix needed.

#### 5. `playwright.config.ts` (UPDATE — workers comment)

Current: no `workers` field. Retro B2 requires a comment here.

Add `workers: 1` to prevent cross-spec parallel interference on shared DB:
```ts
workers: process.env.CI ? 1 : undefined,
```
Or simply add a comment above `fullyParallel` explaining the retro decision. Prefer `workers: 1` unconditionally (safe for serial test suite; tests run fast enough).

#### 6. `README.md` (UPDATE — minimal)

Current README has an `## Continuous integration` section that states:
> "Full-flow axe gates are not in .github/workflows/ci.yml yet (Story 3.4)."

That placeholder must be removed and replaced with the truthful post-3.4 statement. Verify `## Run`, `## Test`, and `## API contract` headings remain present (required by `check:readme`).

### Architecture compliance guardrails

| Topic | Requirement | Source |
|-------|-------------|--------|
| CI shape | lint → api tests → web tests → Playwright E2E → axe | architecture.md QA integration |
| Axe tool | `@axe-core/playwright` for E2E layer (already installed) | architecture.md; deferred-work axe-version note |
| Test placement | E2E under `tests/e2e/`; no new top-level test dirs | architecture.md |
| NFR-07 gate | Zero critical violations on add/complete/delete paths | prd.md NFR-07 |
| NFR-06 gate | README Test section = CI commands (single source of truth) | prd.md NFR-06 |
| `workers: 1` | Playwright retro B2 — serial until shard strategy designed | epic-2-retro; deferred-work 1-2 item |
| Scope | No API feature, no UI feature, no dependency upgrades | epic 3.4 story scope |

### Known constraints and out-of-scope items

**Explicitly OUT of scope for Story 3.4:**
- Axe version alignment (`jest-axe` vs `@axe-core/playwright`) — deferred-work; separate pass
- ES-3.4.b perf smoke — epics mark it as "optional, not a hard gate unless agreed"; skip unless user explicitly agrees
- `load-error.spec.ts` stabilization beyond what B1/B2 fixes — tracked separately
- CORS hardening, OpenAPI drift, TOCTOU fixes, aria-busy delete-pending — separate deferred items
- Adding `screenshot: "only-on-failure"` to `playwright.config.ts` — Story 3.3 deferral; include here if low-risk (one line)

**Known risk: `load-error.spec.ts` and `a11y-list-shell.spec.ts` may still fail** in some environments due to Playwright parallel worker contention. B1 + B2 + `workers: 1` should resolve the CI-side failures. If local runs still show intermittent failures after these fixes, that is a separate debt item.

### Git intelligence summary

Recent commits:
- `b43567b` test(e2e): close Story 3.3 review gaps and mark done
- `fb29314` test(web): close Story 3.2 review gaps
- `30946be` docs: add Epic 2 retrospective and mark it done in sprint tracking
- `8e2f89d` test(api): harden story 3.1 PATCH coverage after code review
- `3e70c85` test(web): finalize story 2.4 delete coverage and review fixes

Convention: `test(e2e):`, `test(api):`, `test(web):`, `feat(api):`, `docs:` prefixes. CI and infra changes should use `ci:` or `chore:`.

### Latest technical information

- **Vitest 3.1.x pool API:** `poolOptions.forks.singleFork: true` serializes via single fork process. Alternatively `pool: "vmThreads"` with `poolOptions.vmThreads.singleThread: true`. Verify against `api/package.json` vitest version before choosing.
- **`@axe-core/playwright` 4.x:** `new AxeBuilder({ page }).analyze()` returns `{ violations, passes, ... }`. Full-page analysis is default. Filter with `.include()` or `.exclude()` if needed.
- **GitHub Actions Postgres `services:`:** The service container is already running on `127.0.0.1:5432` when steps start. `docker compose up -d` would attempt to bind the same port and fail silently (B1 guard prevents this).
- **`workers: 1` in Playwright:** Setting `workers: 1` forces all test files to run sequentially on a single worker, eliminating cross-file DB contention. Safe for this repo's test suite size (~10 test files, ~30s total E2E runtime).
- **`screenshot: "only-on-failure"`:** One-line addition to `playwright.config.ts` `use` block. Low risk. Can be included as a bonus improvement.

### Definition of done for this story

Story 3.4 is done when:
1. `global-setup.mjs` skips `docker compose` in CI (B1 — no more silent swallow risk).
2. `api/vitest.config.ts` explicitly enforces serial DB tests (B2 — isolated integration tests).
3. `a11y-list-shell.spec.ts` includes `ES-3.4.a` covering add → complete → delete with axe at each step.
4. CI workflow names the axe gate step explicitly.
5. `playwright.config.ts` has `workers: 1` (or documented rationale) per retro B2.
6. README CI section no longer has the "Story 3.4 TODO" placeholder.
7. `npm run test:e2e -- tests/e2e/a11y-list-shell.spec.ts` passes (all 5 tests including ES-3.4.a).

### Project context reference

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.4)
- `_bmad-output/planning-artifacts/prd.md` (NFR-06, NFR-07, SC-03, SC-04)
- `_bmad-output/planning-artifacts/architecture.md` (CI pipeline, QA integration, test placement)
- `_bmad-output/implementation-artifacts/deferred-work.md` (B1, B2, axe-version, Vitest isolation items)
- `_bmad-output/implementation-artifacts/epic-2-retro-2026-05-12.md` (retro action items B1–B3)
- `_bmad-output/implementation-artifacts/3-3-end-to-end-smoke-for-sc-01-core-loop.md` (carry-forward patterns: row-scoped locators, scope discipline)

### Review Findings

- [x] [Review][Patch] README `CI=1` timeout tip now conflicts with CI global-setup guard [`README.md`] — resolved by documenting that `CI=1` also skips Compose and requires Postgres to already be running or `DATABASE_URL` to be reachable.
- [x] [Review][Patch] NFR-01/NFR-02 measurement hook is missing [`README.md`] — resolved by adding a vendor-neutral README note that performance measurements are not CI hard-gated in Story 3.4 and are tracked as future ES-3.4.b/backlog perf smoke work.
- [x] [Review][Defer] `fullyParallel: true` with `workers: 1` is potentially confusing future-maintenance config [`playwright.config.ts`] — deferred, current behavior is serial because workers is 1; revisit when a per-worker DB isolation strategy exists.
- [x] [Review][Defer] CI retries can hide flaky axe-gate failures [`playwright.config.ts`, `tests/e2e/a11y-list-shell.spec.ts`] — deferred, current repo uses CI retries globally for E2E stability; consider zero retries or retry-rate reporting for axe specs if flakiness appears.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_(none)_

### Completion Notes List

- Applied B1: `tests/e2e/global-setup.mjs` now exits early when `process.env.CI` is truthy, preventing silent `docker compose` failure against the Actions Postgres service.
- Applied B2: `api/vitest.config.ts` now uses `pool: "forks"` + `singleFork: true` to serialize DB-backed integration tests; `npm run test:api` passes (24 unit tests, 19 integration skipped without `DATABASE_URL`).
- Implemented `ES-3.4.a` in `tests/e2e/a11y-list-shell.spec.ts`: add → complete → delete with `AxeBuilder.analyze()` at each DOM transition, `assertNoCriticalViolations()` at each step. All 5 axe tests pass.
- Added `workers: 1` to `playwright.config.ts` with retro B2 rationale comment.
- Renamed CI workflow E2E step to `End-to-end tests (incl. axe / NFR-07 gate)` with explanatory comment.
- Updated README CI section: removed "Story 3.4 TODO" placeholder; now accurately describes axe gate. Updated E2E wiring note to mention CI guard.
- Validation: `test:api` ✓, `test:web` 29/29 ✓, `a11y-list-shell.spec.ts` 5/5 ✓, `todos.spec.ts` 8/8 ✓.
- Resolved code-review patches: documented the `CI=1`/Postgres caveat and added the NFR-01/NFR-02 future perf-smoke hook to README. `npm run check:readme` passes.

### File List

- `tests/e2e/global-setup.mjs`
- `api/vitest.config.ts`
- `tests/e2e/a11y-list-shell.spec.ts`
- `.github/workflows/ci.yml`
- `playwright.config.ts`
- `README.md`

## Change Log

- 2026-05-12: Story 3.4 context created by `bmad-create-story` - status `ready-for-dev`.
- 2026-05-12: Story 3.4 implementation complete by `bmad-dev-story` - status `review`; B1 global-setup CI guard, B2 Vitest serial forks, ES-3.4.a axe full-flow test, workers:1, CI step rename, README CI update.
- 2026-05-12: Story 3.4 code-review patches applied; README now documents `CI=1` Postgres caveat and NFR-01/NFR-02 future perf-smoke hook.
