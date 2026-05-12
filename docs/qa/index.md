# QA evidence pack (NFR-10)

**Snapshot date (UTC):** 2026-05-13  
**Repository commit:** `607bf7416d50a02a8e5d55632488bf0cd1ff4a81` (update this SHA when tagging a submission)

This index summarizes assessor-facing quality evidence. Source commands live in the root **`README.md`** (NFR-06).

## Coverage (NFR-09)

- **Tooling:** Vitest **`@vitest/coverage-v8`** on **`api`** and **`web`**.  
- **Commands:** `npm run test:coverage` (reports only); `npm run test:coverage:ci` (threshold gate with **`CI_COVERAGE_GATE=1`**).  
- **Outputs:** `api/coverage/` and `web/coverage/` after a local run (gitignored **`coverage/`**). Reporters: **text**, **html**, **lcov**.  
- **Thresholds (CI):** lines / statements / functions **≥70%**, branches **≥60%**. **`api`** gate expects **`DATABASE_URL`** (CI provides Postgres service).  
- **Exclusions (justified):** test files, Drizzle SQL migrations, **`migrate-cli`**, **`api/src/server.ts`**, **`web/src/main.tsx`**, **`vite-env.d.ts`**, MSW **`src/test/**`**, **`setupTests.ts`**.

## Accessibility (NFR-07)

- **Automated:** Playwright **`tests/e2e/a11y-list-shell.spec.ts`** — **@axe-core/playwright**; CI fails on **critical** violations across empty list, populated list, error banner, composer validation, and **add → complete → delete** flow (**ES-3.4.a**).  
- **Component-level:** **`web`** Vitest + **`jest-axe`** in **`TodoApp.a11y.test.tsx`**.  
- **Manual:** Track keyboard order and screen reader labels against UX spec in `_bmad-output/planning-artifacts/`.

## Security checklist (training rubric)

| Item | Status / note |
|------|-----------------|
| **Secrets in repo** | No real **`.env`** committed; **`api/.env.example`** documents placeholders. |
| **Images** | **`api`** / **`web`** Dockerfiles use non-root where applicable; runtime **`DATABASE_URL`** / **`WEB_ORIGIN`** via env, not baked into SPA beyond **`VITE_*`** build args (documented). |
| **HTTP hardening** | **`@fastify/helmet`** on API; CORS restricted to single **`WEB_ORIGIN`**. |
| **Dependency audit** | Run **`npm audit`** locally / in pipeline as needed; address high findings per org policy. |

## Performance (NFR-01 / NFR-02)

- **Current posture:** No hard CI gate on latency or LCP (see README **Continuous integration** — vendor-neutral perf smoke remains backlog **ES-3.4.b**).  
- **Hooks:** Server logs request **`responseTime`** (Fastify); browser DevTools Network tab can capture todo API timings during manual review.  
- **Future:** Optional Lighthouse CI or scripted marks once baselines are agreed.

## Related paths

- **Documentation hub:** [`docs/README.md`](../README.md) — index of user guide, developer guide, and assessor docs (this file is linked from there).  
- Planning: `_bmad-output/planning-artifacts/prd.md`, `epics.md`, `architecture.md`  
- CI: `.github/workflows/ci.yml`  
- Epic 4 narrative: `docs/bmad-implementation-narrative.md`  
- AI usage log: `docs/ai-integration-log.md`
