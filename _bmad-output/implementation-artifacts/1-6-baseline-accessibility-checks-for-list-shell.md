---

## story_key: 1-6-baseline-accessibility-checks-for-list-shell

story_id: "1.6"
epic: 1
status: review

# Story 1.6: Baseline accessibility checks for list shell

Status: review

Ultimate context engine analysis completed - comprehensive developer guide created

## Story

As a **user relying on assistive tech**,
I want **the list shell to meet basic automated a11y rules**,
So that **we do not accumulate WCAG debt before features land**.

## Acceptance Criteria

1. **Unit-level axe on list shell (GET outcome states)**
   **Given** Story 1.4 list shell is implemented (TanStack Query + MSW in tests)
   **When** Vitest + Testing Library run with **vitest-axe** or **jest-axe** (epic allows either) against `TodoApp` (or an equivalent wrapper that mounts the real list shell)
   **Then** automated axe runs cover at least these settled DOM states:
   - **Empty** — successful `GET /api/v1/todos` returns `[]` (default MSW or explicit handler).
   - **Populated** — successful GET returns one or more todos (mock/fixture data).
   - **Load error** — initial GET fails so **load** `ErrorBanner` is visible (same pattern as `US-1.4.c` / `IS-1.4.b` failure before retry).
   **And** assertions enforce **zero violations with `impact === "critical"`** only (NFR-07 baseline wording in epics — do **not** silently tighten to "zero serious" without PM/architecture agreement).
   **Traces:** NFR-07 baseline; epics Story 1.6 AC.

2. **SEO / document hygiene (PRD + epic)**
   **When** the app's HTML shell is served
   **Then** `web/index.html` includes a **default `noindex`** robots policy (e.g. `<meta name="robots" content="noindex, nofollow">` or equivalent that satisfies PRD "default noindex")
   **And** `<title>` remains **stable and descriptive** (current `Todos — lets-do-it` is acceptable unless UX spec names a different string — if you change it, keep it short and unique per PRD).

3. **Keyboard spot-check (integration-style, web)**
   **Given** populated list state (MSW returns todos)
   **When** tests simulate **Tab** from the composer through the list region
   **Then** focus order is sane (composer field → primary actions → list items / controls) — implement with `@testing-library/user-event` `tab()` and explicit expectations on `document.activeElement` or accessible names (epics **IS-1.6.a**).

4. **E2E duplicate signal (Playwright + axe)**
   **Given** api + web + DB per existing Playwright setup (`npm run dev:e2e`, `playwright.config.ts`, `tests/e2e/global-setup.mjs`)
   **When** Playwright visits `/` in the **same three classes of UI state** as unit coverage (empty DB, list with todos seeded via API, forced GET failure with error banner visible)
   **Then** **@axe-core/playwright** (or maintained equivalent) reports **zero critical** violations on each checked snapshot (epics **ES-1.6.a** — intentional duplicate of unit signal for CI).

5. **CI stays honest**
   **And** existing root CI (`.github/workflows/ci.yml`) continues to pass with **no silent skips**: new checks run under current **`npm run test:web`** and/or **`npm run test:e2e`** (preferred) so README **Test** / **Continuous integration** copy stays true without inventing a skipped "axe job".

**Traces:** NFR-07; PRD SEO subsection; UX-DR14; `_bmad-output/planning-artifacts/epics.md` — Story 1.6.

## Tasks / Subtasks

- [x] **Dependencies & test harness** (AC: 1, 5)
  - [x] Added **`jest-axe@10`** to `web` devDependencies — chosen for stability; `configureAxe` used directly (no `expect.extend` needed) with critical-only filtering.
  - [x] Added **`@axe-core/playwright@4`** to root `devDependencies`.
  - [x] No changes needed to `web/src/setupTests.ts` — jest-axe used standalone.

- [x] **Unit axe tests — US-1.6.a–c** (AC: 1)
  - [x] Created `web/src/features/todos/TodoApp.a11y.test.tsx`.
  - [x] Each state: `render` + `waitFor` stable UI → `runAxe(container)` → filter `impact === "critical"`.
  - [x] Local `assertNoCriticalViolations(container)` helper throws descriptive error on any critical violation.
  - [x] Reused MSW patterns from `TodoApp.test.tsx` (`server.use`, `http.get("*/api/v1/todos", …)`).

- [x] **Keyboard — IS-1.6.a** (AC: 3)
  - [x] In populated MSW state, tabbed via `userEvent.tab()` through `#todo-new` → first row checkbox → first row delete → second row checkbox. Add button is `disabled` when text is empty (correct per `AddTodoForm` logic) and is excluded from tab order — documented in test comments.

- [x] **`index.html` — noindex** (AC: 2)
  - [x] Added `<meta name="robots" content="noindex, nofollow" />` to `web/index.html`; `<title>` and charset unchanged.

- [x] **Playwright axe — ES-1.6.a** (AC: 4, 5)
  - [x] Created `tests/e2e/a11y-list-shell.spec.ts` using `AxeBuilder` from `@axe-core/playwright`.
  - [x] Three states covered: empty (`clearTodos` helper), populated (POST via `request.post`), GET-error (`page.route` intercept before `goto`).

- [x] **README alignment (only if needed)** (AC: 5)
  - [x] No README change required — new tests ride under existing `npm run test:web` and `npm run test:e2e` already documented and gated in CI.

### Review Findings

- [ ] [Review][Patch] `last_updated` moved backwards in sprint tracker [_bmad-output/implementation-artifacts/sprint-status.yaml:38]
- [ ] [Review][Patch] Untracked Story 1.6 implementation files are omitted from `git diff HEAD` review scope [web/src/features/todos/TodoApp.a11y.test.tsx:1]
- [ ] [Review][Patch] Ephemeral test run artifact is tracked in working tree [test-results/.last-run.json:1]
- [ ] [Review][Patch] Unrelated Story 1.3/project-context edits are mixed into this Story 1.6 review scope [_bmad-output/implementation-artifacts/1-3-get-api-v1-todos-with-openapi-and-error-envelope.md:1]
- [x] [Review][Defer] Unit/E2E use different axe-core versions may yield inconsistent violation outcomes [package-lock.json:171] — deferred, pre-existing

## Dev Notes

### Epic context

- **Epic 1** delivers read-path trust + list UX + README (1.5) + **baseline a11y** (this story). **Story 3.4** owns the **full** NFR-07 CI matrix (add/complete/delete axe paths); **1.6** is **baseline** on the list shell states that exist today. [Source: `epics.md` — Epic 1, Story 1.6, Story 3.4]

### Brownfield inventory — READ before editing

| File / area | Current state | Implication for 1.6 |
|-------------|----------------|---------------------|
| `web/index.html` | `<title>` set; **no** `noindex` meta | **Must add** robots noindex per AC2 / PRD. |
| `web/package.json` | Vitest 3 + RTL + MSW; **no** axe helper | Add `vitest-axe` or `jest-axe`. |
| `web/src/setupTests.ts` | MSW lifecycle + jest-dom | Extend for axe matcher if needed. |
| `web/src/features/todos/TodoApp.tsx` | Full shell: load error banner, **mutations** (create/patch/delete), list | Epic unit scope is **GET outcome states** — drive tests with MSW so the **initial list query** produces empty / populated / error; mutations may be idle. Do **not** remove mutation wiring (downstream epics depend on it). |
| `web/src/features/todos/TodoApp.test.tsx` | Strong MSW coverage for 1.4 | **Reuse** `renderWithClient` / handler patterns; prefer **new** `*.a11y.test.tsx` to avoid bloating behavior tests. |
| `web/src/components/ErrorBanner.tsx` | `role="alert"`, retry button | Good baseline; axe should catch contrast/label regressions. |
| `web/src/components/EmptyState.tsx` | `aria-labelledby` + heading | Verify heading level stays valid in full page context. |
| `package.json` (root) | Playwright 1.55; no `@axe-core/playwright` | Add devDependency; CI already runs `npm run test:e2e`. |
| `.github/workflows/ci.yml` | `test:web` → `test:e2e` | No new job required if axe rides on those scripts. |

**Read-before-change list:**

```
web/index.html
web/package.json
web/src/setupTests.ts
web/src/features/todos/TodoApp.tsx
web/src/features/todos/TodoApp.test.tsx
package.json
tests/e2e/todos.spec.ts
tests/e2e/load-error.spec.ts
playwright.config.ts
.github/workflows/ci.yml
```

### Technical requirements (dev agent guardrails)

| Topic | Requirement |
|-------|-------------|
| NFR-07 (baseline) | **Zero critical** axe violations on defined snapshots — match epic, not a stricter internal bar. |
| GET-only wording | Means **list data from `GET /api/v1/todos`** outcomes (empty / data / error), not "remove mutation UI." |
| SEO | PRD V1: default **noindex** + stable `<title>` [`prd.md` — SEO and indexing]. |
| CI honesty | From **1.5**: no fake green; axe tests must run in default CI path. [Source: `1-5-readme-run-test-api-contract-and-root-ci-skeleton.md`] |
| Stack | Vitest + jsdom + RTL per `web/vitest.config.ts`; Playwright at root per `architecture.md` **QA integration**. |

### Architecture compliance

| Topic | Source |
|-------|--------|
| Co-located `*.test.tsx` + root `tests/e2e/` | `architecture.md` — Project Structure, QA integration |
| Web unit stack: Vitest + Testing Library + jest-axe / vitest-axe | `architecture.md` — Starter evaluation, QA table |
| CI: lint → api test → web test → Playwright; axe extended later for full flows | `architecture.md` — README / CI; **1.6** inserts baseline into **web** + **e2e** steps already present |

### Library / framework requirements

- **`jest-axe@10`** — chosen over `vitest-axe` for broader compatibility; Vite/Vitest handles CJS interop transparently.
- **`@axe-core/playwright@4`** for E2E scans — `AxeBuilder` with default full-page scan; critical-only filtering applied in assertion helper.
- Peer compatibility verified: `vitest@^3` / `@playwright/test@^1.55`.

### File structure requirements

**New (expected):**

```
web/src/features/todos/TodoApp.a11y.test.tsx
tests/e2e/a11y-list-shell.spec.ts
```

**Update (expected):**

```
web/index.html
web/package.json
package.json                                   # root devDependency @axe-core/playwright
```

### Testing requirements

Map to epics **Test scenarios**:

| ID | Intent | Automation |
|----|--------|--------------|
| **US-1.6.a** | Empty state | MSW `[]` → axe → 0 critical |
| **US-1.6.b** | Populated | MSW JSON array → axe → 0 critical |
| **US-1.6.c** | Error banner | MSW 500 + envelope → axe → 0 critical |
| **IS-1.6.a** | Keyboard order | `userEvent.tab()` + active element / role checks |
| **ES-1.6.a** | Playwright duplicate | `@axe-core/playwright` on empty / populated / error routes |

### Previous story intelligence (1.5)

- **CI** runs `npm run test:web` and `npm run test:e2e` with Postgres service; **extend** those commands rather than adding skipped jobs.
- **Global setup** is **`tests/e2e/global-setup.mjs`** (ESM); story 1.5 artifact still mentions `.ts` in one legacy bullet — trust **repo** as source of truth.
- **README guard** `scripts/check-readme-sections.mjs` checks `## Run`, `## Test`, `## API contract` — if you add new top-level scripts, keep headings accurate.
- **Mutations** already exist in `TodoApp`; e2e `todos.spec.ts` exercises create/complete/delete — **1.6** Playwright axe can still target **list shell snapshots** without contradicting epic **GET-only** unit scope.

### Git intelligence summary

- **`c4d4077`** — Story 1.5: CI, README guard, global-setup.mjs, AJV tweak.
- **`ee3dafb`** — Story 1.4: list shell, MSW, Playwright. Expect 1.6 to be a **focused test + HTML meta** change set.

### Latest tech information

- **@axe-core/playwright:** `AxeBuilder({ page }).analyze()` — returns typed `AxeResults`; `violations[].impact` is `'critical' | 'serious' | 'moderate' | 'minor' | null`.
- **jest-axe:** `configureAxe(opts)` returns an async `axe(element)` runner; color-contrast rules disabled in opts for jsdom compatibility.
- **Critical-only filtering:** `violations.filter((v) => v.impact === "critical")` — matches NFR-07 baseline scope.

### Project context reference

- `_bmad-output/project-context.md` is still a stub — follow **`architecture.md`**, **`prd.md`**, **`epics.md`**, and this story.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.6, NFR-07 mapping]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — QA integration, A11y testing row, CI tree]
- [Source: `_bmad-output/planning-artifacts/prd.md` — NFR-07, SEO and indexing]
- [Source: `web/src/features/todos/TodoApp.tsx`, `TodoApp.test.tsx`, `tests/e2e/load-error.spec.ts`, `tests/e2e/todos.spec.ts`]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Cursor)

### Debug Log References

- Keyboard test IS-1.6.a: initial assertion expected `Add` button accessible name — fixed after discovering the button is `disabled` when text is empty, correctly excluding it from tab order per HTML spec. The test was updated to reflect actual (correct) focus sequence.

### Completion Notes List

- **`jest-axe@10`** added to `web` devDependencies; **`@axe-core/playwright@4`** added to root devDependencies. No `setupTests.ts` changes needed since we use `configureAxe` directly without the matcher extension.
- Created `web/src/features/todos/TodoApp.a11y.test.tsx` with 4 tests: US-1.6.a (empty), US-1.6.b (populated), US-1.6.c (error banner), IS-1.6.a (keyboard tab order). All pass: 18/18 web unit tests green.
- Created `tests/e2e/a11y-list-shell.spec.ts` with 3 Playwright axe tests mirroring the 3 unit states using `AxeBuilder` and the `assertNoCriticalViolations` helper.
- Added `<meta name="robots" content="noindex, nofollow" />` to `web/index.html` per PRD V1 SEO requirement.
- Lint: 0 errors, 0 warnings after removing an unnecessary `eslint-disable` directive.
- No README change needed — axe tests are under existing `test:web` / `test:e2e` scripts already documented and CI-gated.

### File List

- `web/src/features/todos/TodoApp.a11y.test.tsx` (new)
- `tests/e2e/a11y-list-shell.spec.ts` (new)
- `web/index.html` (updated — added `noindex` meta)
- `web/package.json` (updated — `jest-axe` devDependency)
- `package.json` (updated — `@axe-core/playwright` devDependency)
- `_bmad-output/implementation-artifacts/1-6-baseline-accessibility-checks-for-list-shell.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-05-12:** Story context created by `bmad-create-story` — status `ready-for-dev`.
- **2026-05-12:** Implementation complete by `bmad-dev-story` (Claude Sonnet 4.6) — all ACs satisfied, 4 unit a11y tests + 3 Playwright axe tests + noindex meta — status `review`.

---

### Clarifications / open questions (non-blocking)

1. If product later wants **"zero serious"** as well as critical, that is a **PRD/epic change** — out of scope for 1.6 unless explicitly directed.
2. If `@axe-core/playwright` and **mobile** projects are added later, revisit `AxeBuilder` scopes — single desktop Chromium is enough for 1.6.
