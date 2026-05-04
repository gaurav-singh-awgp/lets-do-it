---
story_key: 1-1-scaffold-api-and-web-from-approved-starters
story_id: "1.1"
epic: 1
status: done
---

# Story 1.1: Scaffold API and web from approved starters

Status: done

## Story

As a **developer**,
I want **Fastify (`api`) and Vite React TypeScript (`web`) scaffolds with a root workspace layout**,
So that **the rest of the team can run two packages that match the architecture document**.

## Acceptance Criteria

1. **Given** a clean repo state aligned with [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template Evaluation]  
   **When** official generators are run from the **repository root**  
   **Then** an `api/` folder exists, produced by **`npm init fastify@latest api`**, using **TypeScript** if the generator offers it (prefer TS over plain JS).

2. **When** the client generator runs  
   **Then** a `web/` folder exists, produced by **`npm create vite@latest web -- --template react-ts`** (exact package name `web` per architecture tree).

3. **When** dependencies are installed in each package (`npm install` inside `api/` and `web/`, or one workspace install from root)  
   **Then** both packages resolve without errors and expose their default **dev** scripts from the generator output.

4. **Root workspaces**  
   **Then** the repo root has a `package.json` with **`"workspaces": ["api", "web"]`** (or an equivalent documented in Dev Notes if you must use `pnpm`/`yarn`—default per architecture is **npm**).

5. **Web smoke**  
   **When** `npm run dev` (or the template’s documented dev command) is run from `web/`  
   **Then** the default Vite React app renders in the browser (placeholder UI is fine). **No** requirement to call the API in this story.

6. **API smoke**  
   **When** the Fastify dev/start command documented in `api/package.json` is run  
   **Then** the server starts and listens without crash (default route from generator is acceptable).

## Out of scope (do not implement here)

- **PostgreSQL, Drizzle, migrations** → Story **1.2**  
- **`GET /api/v1/todos`, OpenAPI, error envelope** → Story **1.3**  
- **Vite dev proxy / `VITE_API_BASE_URL` / CORS** → Story **1.4** (architecture “wire proxy” appears after init; epics place it with list shell)  
- **Tailwind, Radix, TanStack Query** → Story **1.4** and following  
- **README Run / Test / API contract blocks, CI** → Story **1.5** (do not block 1.1 on full NFR-06; avoid fake README sections—leave to 1.5 unless you add a one-line root README pointing to upcoming docs)

## Tasks / Subtasks

- [ ] **Scaffold API** (AC: 1, 3, 6)  
  - [ ] From repo root: `npm init fastify@latest api` — choose options that yield **TypeScript** + sensible default layout.  
  - [ ] `cd api && npm install` (or workspace install from root).  
  - [ ] Confirm `npm run` scripts: record the exact dev command in Dev Agent Record when done.

- [ ] **Scaffold web** (AC: 2, 3, 5)  
  - [ ] From repo root: `npm create vite@latest web -- --template react-ts`.  
  - [ ] `cd web && npm install` (or workspace install).  
  - [ ] Run dev server; confirm app loads.

- [ ] **Root monorepo** (AC: 4)  
  - [ ] Add root `package.json` with `workspaces`: `["api", "web"]`.  
  - [ ] Ensure root `.gitignore` covers `node_modules`, build outputs, env files (merge with any existing BMad-only ignores—do not delete unrelated rules).  
  - [ ] From root, `npm install` resolves both workspaces.

- [ ] **Sanity documentation (minimal)**  
  - [ ] If root README is missing, add a **short** stub: project name + “See `_bmad-output/planning-artifacts/architecture.md` for stack; Run/Test/API docs land in Story 1.5.” (Optional; avoids empty root if desired.)

## Dev Notes

### Epic context

- **Epic 1 goal:** User can open the app and **trust** what the server shows (loading / empty / error / list). This story only establishes **two runnable packages**; no todo domain yet. [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.1]

### Architecture compliance (must follow)

| Topic | Requirement |
|--------|----------------|
| **Stack** | Split **`api/`** (Fastify) + **`web/`** (Vite `react-ts`). [Source: `architecture.md` — Selected Starter] |
| **Node** | Use **Node 20.19+** or **22.12+** (or current Vite baseline at generator time). [Source: `architecture.md` — Initialization commands] |
| **ESM / TS** | Client: TypeScript + ESM (Vite default). Server: TypeScript if selected in Fastify generator. [Source: `architecture.md` — Architectural decisions provided by starter] |
| **Naming / layout** | Normalize generator output toward **`api/src/...`** and **`web/src/...`** as in architecture tree over later stories; do not rename to `client/`/`server/` without updating architecture + epics. [Source: `architecture.md` — Project Structure & Boundaries] |
| **Testing** | Vitest may not exist yet on server/client—**do not** fully standardize here; Story **1.5** / **1.6** lock test runners. Optional: ensure `npm test` exists or document “no tests yet”. |

### UX / PRD (this story)

- No user-facing todo UI requirements in **1.1**; PRD/UX apply starting **1.4**. Do not add product chrome beyond template defaults.

### Project structure notes

- **Brownfield vs greenfield:** Repo currently has **planning artifacts only** (no `api/` or `web/`). This story **creates** those trees.  
- **Git:** No recent `git log` in workspace (repo may be uninitialized or empty history)—no prior commit patterns to mirror.

### Library / generator notes (verify at run time)

- **`npm init fastify@latest`** and **`npm create vite@latest`** evolve quickly. Pin exact versions in lockfiles after generation; skim each package’s README for breaking changes if templates differ from this doc.

### Testing requirements (Story 1.1)

- **Manual:** Start `web` dev → see Vite welcome. Start `api` dev → no crash.  
- **Automated:** Not required for 1.1 unless the generator ships a passing default test; do not spend cycles on CI here (**1.5** / **1.6**).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.1 (acceptance + traces)]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Starter Template Evaluation, Initialization commands, Project Structure & Boundaries]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — Project-Type Requirements, NFR-06 (downstream)]  
- [Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-03.md` — OpenAPI/UI gate applies **after** 1.3/1.4, not 1.1]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Vite app created via `npm create vite@latest web -- --template react-ts` (official template).
- Fastify API authored manually (TypeScript + ESM) with `GET /health` and Vitest `inject` smoke test.
- Playwright webServer uses `vite --host 127.0.0.1 --port 5173 --strictPort` so URL probing is reliable.

### File List

- `package.json`, `package-lock.json`, `.gitignore`, `README.md`
- `playwright.config.ts`
- `tests/e2e/app-shell.spec.ts`
- `api/package.json`, `api/tsconfig.json`, `api/tsconfig.build.json`, `api/vitest.config.ts`, `api/.env.example`
- `api/src/app.ts`, `api/src/server.ts`, `api/src/app.test.ts`
- `web/` (Vite scaffold) + `web/vite.config.ts`, `web/vitest.config.ts`, `web/package.json` (test scripts + Vitest/RTL/jsdom)
- `web/src/setupTests.ts`, `web/src/App.test.tsx`

## Story completion status

**ready-for-dev** — Ultimate context for Story 1.1 prepared from epics + architecture. Implementation should leave **`api`** and **`web`** installable and runnable independently and via **npm workspaces**, without scope bleed into DB or REST features.
