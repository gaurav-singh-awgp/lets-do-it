# BMAD implementation narrative (NFR-11)

This document traces how **planning artifacts** map to **code and CI** for **lets-do-it** — a spec-driven personal todo app (Fastify API + Vite React + PostgreSQL). It is not a dump of the PRD; use the linked paths for full text.

## 1. Product intent → PRD

- **Source:** `_bmad-output/planning-artifacts/prd.md`  
- **Captured in code:** REST todo contract under **`/api/v1/todos`**, camelCase DTOs, Zod validation, immutable todo text after create, **500** code-point limit, OpenAPI at **`/documentation`**.  
- **Trace:** PRD functional requirements **FR-01–FR-10** align with **Epic 1–3** stories in `epics.md` (completed).

## 2. UX → web behavior

- **Source:** `_bmad-output/planning-artifacts/` (UX specification files alongside PRD planning set).  
- **Captured in code:** Loading / empty / error states, composer, accessible row actions, **TanStack Query** for server state.  
- **Trace:** List shell and composer flows match epic acceptance language; a11y reinforced by **`jest-axe`** unit tests and Playwright **`a11y-list-shell.spec.ts`**.

## 3. Architecture → repository layout

- **Source:** `_bmad-output/planning-artifacts/architecture.md`  
- **Captured in code:** Monorepo **`api`** + **`web`** workspaces; Drizzle + Postgres; **Epic 4** container sections (`api` image, `web` image, **Root Compose**).  
- **Trace:** ADRs in architecture (e.g. REST + OpenAPI, split packages) match `api/src` and `web/src` boundaries.

## 4. Epics & stories → sprint execution

- **Source:** `_bmad-output/planning-artifacts/epics.md`  
- **Tracking:** `_bmad-output/implementation-artifacts/sprint-status.yaml` and per-story files `4-*-*.md` in the same folder.  
- **Trace:** Epic 4 stories **4.1–4.8** delivered Dockerfiles, Compose **`full`** profile, README parity, Vitest coverage + CI gate, **`docs/qa/`**, this narrative, and **`docs/ai-integration-log.md`**.

## 5. Quality gates → CI

- **Source:** README **Test** / **Continuous integration** (NFR-06 single source of truth).  
- **Implementation:** `.github/workflows/ci.yml` — **`check:readme`**, **`lint`**, **`test:api`**, **`test:web`**, **`test:coverage:ci`**, Playwright + Postgres service.  
- **Trace:** NFR-07 axe gate lives in E2E; NFR-09 coverage gate uses **`CI_COVERAGE_GATE`** (see `docs/qa/index.md`).

## 6. How to extend

1. Update **PRD / epics** for new scope.  
2. Adjust **architecture** if boundaries change.  
3. Add story under **`_bmad-output/implementation-artifacts/`** and **`sprint-status.yaml`**.  
4. Mirror user-facing commands in **README** so **`check:readme`** and assessors stay aligned.
