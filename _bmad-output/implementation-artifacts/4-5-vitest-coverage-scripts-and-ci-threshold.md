---

## story_key: 4-5-vitest-coverage-scripts-and-ci-threshold

story_id: "4.5"

epic: 4

status: done

---

# Story 4.5: Vitest coverage — scripts and optional CI threshold

Status: done

## Tasks / Subtasks

- [x] **`@vitest/coverage-v8`** in **`api`** and **`web`**; Vitest **`coverage`** blocks with v8, **html/lcov**, justified **`exclude`** (tests, migrations, **`server.ts`**, **`main.tsx`**, **`vite-env.d.ts`**, MSW test helpers).  
- [x] **`CI_COVERAGE_GATE=1`** enables thresholds (lines/statements/functions **70%**, branches **60%**).  
- [x] Root **`npm run test:coverage`** / **`test:coverage:ci`**.  
- [x] **`.github/workflows/ci.yml`** — coverage step after **`test:web`** with **`DATABASE_URL`** (job env) + **`CI_COVERAGE_GATE`**.  
- [x] **`api/src/app.ts`** — **`coerceTypes: false`** so AJV does not coerce **`done: 1`** to boolean (integration test + contract).  
- [x] **README** Test + CI bullets for coverage.  
- [x] **`sprint-status.yaml`**.

## Dev Agent Record

### Completion Notes List

- Reports: **`api/coverage/`**, **`web/coverage/`** (see `.gitignore` **`coverage/`**).

### File List

- `package.json`, `package-lock.json`  
- `api/package.json`, `api/vitest.config.ts`, `api/src/app.ts`  
- `web/package.json`, `web/vitest.config.ts`, `web/eslint.config.js` (ignore **`coverage/`** for lint)  
- `.github/workflows/ci.yml`  
- `README.md`  
- `_bmad-output/implementation-artifacts/4-5-vitest-coverage-scripts-and-ci-threshold.md`  
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-05-14: Implemented; status **done**.

### Review Findings

✅ Self-review — NFR-09 gate runs in CI with Postgres-backed **`api`** integration.
