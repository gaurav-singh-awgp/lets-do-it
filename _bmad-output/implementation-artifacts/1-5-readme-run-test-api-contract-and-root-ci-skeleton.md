---

## story_key: 1-5-readme-run-test-api-contract-and-root-ci-skeleton

story_id: "1.5"
epic: 1
status: done

# Story 1.5: README Run / Test / API contract and root CI skeleton

Status: done

Ultimate context engine analysis completed - comprehensive developer guide created

## Story

As a **contributor**,
I want **README sections and a minimal CI pipeline**,
So that **NFR-06 is satisfied early and stays enforced**.

## Acceptance Criteria

1. **README — Run, Test, API contract (NFR-06)**  
   **Given** Stories 1.1–1.4 are complete (read path + list shell shipped)  
   **When** a reader opens root `README.md`  
   **Then** it contains clearly labeled **Run**, **Test**, and **API contract** sections (headings or linked sub-docs) that explain:
   - **Run:** Postgres via Docker Compose, `api/.env` / migrations, starting **api** and **web** (ports, `WEB_ORIGIN`, Drizzle commands as today).  
   - **Test:** how to run **api** Vitest, **web** Vitest, and **Playwright** from the repo root, including **prerequisites for e2e** (Docker for Postgres — `tests/e2e/global-setup.ts` runs `docker compose up -d`; default `DATABASE_URL` for Playwright is documented in `playwright.config.ts`).  
   - **API contract:** where OpenAPI lives in dev (`/documentation`, `/documentation/json`), bare array shape for `GET /api/v1/todos`, error envelope — consistent with current API.  
   **And** if anything in README is **aspirational** (e.g. a command not yet run in CI), it is labeled honestly or fixed in the same story.

2. **Root CI workflow (architecture “README / CI”)**  
   **When** CI runs on the default branch (pull requests and/or push — your choice, document it)  
   **Then** a workflow file exists under `.github/workflows/` (e.g. `ci.yml`) that:
   - Installs dependencies with **`npm ci`** at the **repository root** (npm workspaces: `api`, `web`).  
   - Runs **lint** for packages that define it (**`web`** has `"lint": "eslint ."`; **`api`** has **no** `lint` script today — do **not** fail the job on a missing api lint; either run `npm run lint -w web` only or add a thin root `lint` script that delegates to web only).  
   - Runs **real** tests: `npm run test:api` and `npm run test:web` (or equivalent workspace-safe invocations that match README **Test**).  
   - **E2E:** runs `npm run test:e2e` **only if** the job can provide Postgres (e.g. **Docker Compose service** in the job, or **GitHub Actions service container** for Postgres with `DATABASE_URL` passed to Playwright). If e2e cannot be made reliable in CI in this story, document the gap in README **and** in workflow comments with a **tracked TODO** — epic prefers “passing no-op” over fake green; **prefer** making e2e green with a real DB service.  
   **And** workflow steps use the **same npm script names** as README (single source of truth per **IS-1.5.a**).

3. **Honesty about enforcement (epic AC)**  
   **And** the README or CI job summary states what is **gated** (e.g. “CI runs unit tests for api + web, lint on web, e2e with Postgres”) — no silent skips without explanation.

**Traces:** NFR-06; Architecture **README / CI** and **QA integration — Project Setup**; `_bmad-output/planning-artifacts/epics.md` — Story 1.5.

## Tasks / Subtasks

- [x] **Inventory README vs NFR-06** (AC: 1)  
  - [x] Confirm **Run** / **Test** / **API contract** headings (or equivalent) exist and stay accurate after any CI-related script changes.  
  - [x] Align **Test** copy with `playwright.config.ts`: `webServer` runs `npm run dev:e2e`; global setup runs `docker compose up -d`; document that e2e expects Postgres reachable at default `DATABASE_URL` unless overridden.

- [x] **Add GitHub Actions CI** (AC: 2, 3)  
  - [x] Create `.github/workflows/ci.yml` (or split jobs: `lint` + `unit` + `e2e` if clearer).  
  - [x] Pin **Node** to LTS consistent with README (Node **20.19+** or **22.12+** per architecture).  
  - [x] Cache `npm` appropriately; use `npm ci`.  
  - [x] Install Playwright browsers in the e2e job (`npx playwright install --with-deps chromium` or official Playwright action) if e2e is in scope.  
  - [x] Provide Postgres for e2e (Compose in job, or `services:` block with `postgres:17-alpine` and env matching `api/.env.example` / `playwright.config.ts` default).

- [x] **Optional guardrail — US-1.5.a** (epics test scenario)  
  - [x] Add a small CI step or script that asserts README contains **Run**, **Test**, and **API contract** (e.g. `grep -E` or a 10-line Node script). Keeps NFR-06 from regressing silently.

- [x] **Verify IS-1.5.a / IS-1.5.b** (AC: 2)  
  - [x] From a clean clone locally, run the exact commands documented in README; ensure they match the workflow file line-for-line intent (`npm run test`, `npm run test:e2e`, etc.).

### Review Findings

_Code review run 2026-05-12 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 1 patch, 1 deferred, 2 dismissed._

- [x] [Review][Patch] README guard uses substring match — `"## Run"` satisfied by `## Running` [`scripts/check-readme-sections.mjs:12`]
- [x] [Review][Defer] `global-setup.mjs` `docker compose up -d` silently fails in CI (port 5432 already bound by service container) — works correctly but relies on error suppression [`tests/e2e/global-setup.mjs:8`] — deferred, low risk in practice; consider adding `if (process.env.CI) return;` guard in a later story

## Dev Notes

### Epic context

- **Epic 1:** 1.2 persistence → 1.3 GET + OpenAPI → 1.4 web list shell → **1.5 README + CI** → 1.6 baseline axe + `noindex`. This story **does not** own full NFR-07 axe CI matrix (that is **Story 3.4**); it owns **NFR-06** and a **minimal honest CI skeleton**. [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1]

### Brownfield inventory — READ before editing

| File / area | Current state | Implication for 1.5 |
|-------------|----------------|---------------------|
| `README.md` | Already has **Run**, **Test**, **API contract** with Compose, migrations, dev servers, Vitest commands, Playwright, OpenAPI URLs | **Verify and tighten** e2e prerequisites (Docker, `DATABASE_URL`, `npx playwright install`) so README ↔ CI stay aligned. |
| `package.json` (root) | `test`, `test:api`, `test:web`, `test:e2e`, `test:all`, `dev:e2e` | CI must call these names (or document any alias). |
| `api/package.json` | `test`: vitest; **no `lint` script** | CI: run api tests; do not require api lint unless you add a scoped eslint config in this story (optional, not required by epic). |
| `web/package.json` | `test`, **`lint`: eslint .** | CI should run `npm run lint -w web`. |
| `playwright.config.ts` | `globalSetup` → `docker compose up -d`; `webServer` → `npm run dev:e2e`; default `DATABASE_URL` postgres://todo:todo@127.0.0.1:5432/todos | E2E job needs **Docker** (privileged) **or** replace global setup with service-container health — if you change behavior, update README and config together. |
| `.github/workflows/` | **Missing** (no CI yet) | Add `ci.yml` per architecture tree. |

**Read-before-change list:**

```
README.md
package.json
api/package.json
web/package.json
playwright.config.ts
tests/e2e/global-setup.ts
docker-compose.yml
api/.env.example
```

### Technical requirements (dev agent guardrails)

| Topic | Requirement |
|-------|-------------|
| NFR-06 | Root README **must** keep explicit **Run**, **Test**, **API contract**; link or inline paths to OpenAPI as today. |
| Single source of truth | CI workflow **npm** script invocations must match README **Test** (IS-1.5.a). |
| Lint | Run **web** ESLint; **api** has no lint — do not fail CI expecting `npm run lint -w api`. |
| E2E | Playwright needs **api + web + DB** via `dev:e2e` + Compose; mirror that in CI or document honestly why e2e is `workflow_dispatch`-only / skipped with TODO. |
| Secrets | No real secrets in workflow; use CI secrets only if you add deployment later (out of scope). |

### Architecture compliance

| Topic | Source |
|-------|--------|
| Expected tree includes `.github/workflows/ci.yml` | `_bmad-output/planning-artifacts/architecture.md` — Project Structure & Boundaries |
| README / CI section: install → lint → api test → web test → Playwright; axe extended in later stories | `architecture.md` — **README / CI**, **QA integration — Project Setup** |
| Node version band | `architecture.md` + current `README.md` Run section |

### Library / framework requirements

- **No new runtime dependencies** for this story unless a tiny dev-only README guard script is added.  
- **GitHub Actions** YAML: use maintained actions (`actions/checkout`, `actions/setup-node`).

### File structure requirements

**New (expected):**

```
.github/workflows/ci.yml    # primary deliverable
```

**Update (expected):**

```
README.md                     # only if gaps vs AC or CI alignment
```

Optional:

```
scripts/check-readme-sections.mjs   # if implementing US-1.5.a in-repo
```

**Do not** move OpenAPI registration or route code — out of scope unless README links break.

### Testing requirements

Map to epics **Test scenarios**:

| ID | Intent | Automation hint |
|----|--------|-----------------|
| **US-1.5.a** | README contains **Run**, **Test**, **API contract** | `grep`, markdown check, or small script in CI |
| **IS-1.5.a** | Fresh clone: documented install + `npm test` + e2e path matches reality | Manual verification checklist in Dev Agent Record |
| **IS-1.5.b** | Workflow references same scripts as README | Diff review: README code blocks vs `ci.yml` |
| **ES-1.5.a** | Optional: YAML parses (actionlint / `yamllint`) | Optional devDependency or CI step |

### Previous story intelligence (1.4)

- **README:** Story 1.4 explicitly deferred full Run/Test/API polish to **1.5**; list shell, MSW, Tailwind, E2E `load-error.spec.ts` are done.  
- **E2E:** `tests/e2e/load-error.spec.ts` and `todos.spec.ts` exist; 1.4 notes mentioned `global-setup` / `exports` issues in some environments — if CI hits this, fix or document in `deferred-work.md`.  
- **API tests:** One known **pre-existing** failure around PATCH + AJV `removeAdditional` was deferred to **Story 3.1** — **CI must not go green while `npm run test -w api` fails**. Either fix the single test in 1.5 scope (small, if agreed) or **exclude** that test only with an explicit `describe.skip` tied to a **deferred-work** ticket (epic says prefer honest enforcement over fake green). Default: **make api test suite pass** in CI (fix or skip one test with comment + deferred-work link).  
- **Patterns:** npm workspaces, `npm run test -w api|web`, Playwright at root — preserve. [Source: `_bmad-output/implementation-artifacts/1-4-web-list-shell-with-loading-empty-and-fetch-error-states.md`]

### Git intelligence summary

- Recent commit: **Story 1.4** (`ee3dafb`) — web list shell, MSW, Playwright load-error, API CORS/error tweaks.  
- Prior: initial scaffold (`2e37281`). Expect CI + README edits to be a **focused** commit series.

### Latest tech information

- **GitHub Actions:** `actions/setup-node@v4` with `cache: 'npm'` at repo root where `package-lock.json` lives.  
- **Playwright in CI:** Official pattern is `npx playwright install --with-deps` plus OS deps; reuse [Playwright CI doc](https://playwright.dev/docs/ci) for Ubuntu.  
- **Postgres in CI:** Either `services:` postgres image with health check and `DATABASE_URL` env for `playwright test`, or run `docker compose` if `DOCKER_HOST` / privileged runner is available on your org’s runners.

### Project context reference

- `_bmad-output/project-context.md` exists but sections are still sparse — follow **architecture.md** and this story as the source of truth for 1.5.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.5 AC + test scenarios US/IS/ES-1.5.*]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — README / CI, QA integration, project tree]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — NFR-06]  
- [Source: `README.md`, `package.json`, `playwright.config.ts`, `tests/e2e/global-setup.ts`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Added `.github/workflows/ci.yml`: `npm ci` → `check:readme` → `lint` → `test:api` → `test:web` → Playwright Chromium install → `test:e2e`, with Postgres **17** service and job-level `DATABASE_URL` / `WEB_ORIGIN` matching local defaults.
- Root **`package.json`**: scripts **`check:readme`**, **`lint`** (delegates to `web` only).
- **`scripts/check-readme-sections.mjs`**: US-1.5.a guard for `## Run`, `## Test`, `## API contract`.
- **`README.md`**: E2E wiring (`dev:e2e`, `global-setup.mjs`, default `DATABASE_URL`), lint/check commands, **Continuous integration** subsection documenting CI gates (explicit that axe full-matrix is later).
- **`api/src/app.ts`**: Fastify **`ajv.customOptions.removeAdditional: false`** so PATCH bodies are not stripped before validation — fixes **`PATCH rejects extra keys`** integration expectation (AJV `additionalProperties: false` now returns **400**).
- **`tests/e2e/global-setup.ts`** → **`global-setup.mjs`**: ESM file so Playwright no longer hits **`ReferenceError: exports is not defined`** when loading global setup; **`playwright.config.ts`** updated.
- Verified locally: `npm run check:readme`, `npm run lint`, `npm run test:web`, `DATABASE_URL=… npm run test:api` (26 tests), `npx playwright install chromium` + `CI=1 DATABASE_URL=… npm run test:e2e` (7 tests).

### File List

- `.github/workflows/ci.yml`
- `README.md`
- `package.json`
- `scripts/check-readme-sections.mjs`
- `api/src/app.ts`
- `playwright.config.ts`
- `tests/e2e/global-setup.mjs`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-5-readme-run-test-api-contract-and-root-ci-skeleton.md`

## Change Log

- **2026-05-12:** Story context created by `bmad-create-story` — status `ready-for-dev`.
- **2026-05-12:** Implemented README + CI + global setup fix + Fastify AJV tweak — status `review`.
- **2026-05-12:** Code review complete — P1 patch applied (regex heading guard); status `done`.
