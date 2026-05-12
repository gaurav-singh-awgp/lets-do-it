# Sprint Change Proposal — Course rubric vs lets-do-it

**Date:** 2026-05-13  
**Project:** lets-do-it  
**Author:** Correct Course workflow (BMad)  
**Trigger:** Alignment of repository with external **Spec-Driven Development / BMAD training** deliverables (Steps 1–4, 4.2 checklist, success criteria).

**Approval (finalized):** **Batch** mode; user approved **2026-05-13**. Planning artifacts and sprint tracking updated: `epics.md` (Epic 4 + Stories 4.1–4.8), `prd.md` (NFR-08–NFR-11), `architecture.md` (deployment section + validation refresh), `sprint-status.yaml` (epic-2/3 → **done**, epic-4 + stories → **backlog**).

---

## Section 1 — Issue summary

**Problem statement:** The training pathway describes a **full** deliverable set (multi-service Docker, formal QA reports, ≥70% coverage policy, AI integration log). The **original PRD + epics** for lets-do-it scoped **Postgres via Compose** and **local dev** (`api` + `web` on host), not **containerized app services**. Implementation **satisfies the product spec** (Epics 1–3 complete) but **does not yet satisfy several course-only expectations** unless you treat those as optional or out of scope.

**Context:** Epics 1–3 and retrospectives are complete in `sprint-status.yaml`. `docker-compose.yml` runs **Postgres only**. No `Dockerfile` for `api` or `web`. No root `test:coverage` / CI coverage gate. No committed **QA report pack** or **AI integration log** as standalone artifacts.

**Evidence (factual):**

| Rubric item | Expected (course text) | Current repo |
|-------------|------------------------|--------------|
| BMAD artifacts | Brief, PRD, architecture, stories + AC | Present under `_bmad-output/planning-artifacts/` |
| Working todo app + CRUD | Full-stack functional | Implemented (API + web + tests) |
| Unit / integration / E2E | All three | Vitest (api/web), Playwright E2E |
| E2E ≥ 5 passing | Minimum 5 | **17** `test(` blocks across 4 spec files — **met** |
| A11y — zero critical | WCAG / axe | Enforced in CI via `@axe-core/playwright` (Story 3.4) — **met** for gated flows |
| **Dockerfiles** api + web | Multi-stage, non-root, health checks | **None found** |
| **docker-compose** full stack | App + DB orchestration | **Postgres only**; apps run via `npm run dev` per README |
| **Coverage ≥ 70%** | Meaningful coverage | **No** `vitest --coverage` scripts or CI threshold in `package.json` files reviewed |
| **QA reports** | Coverage, perf, a11y, security docs | **No** dedicated report files in repo (CI + stories substitute partially) |
| **“How BMAD guided implementation”** | Narrative doc | Partially inferable from artifacts; **no** single learner-facing narrative |
| **AI integration log** | Agent/MCP/prompts/limitations | **Not present** as a tracked doc |
| Postman MCP / Chrome DevTools MCP | Suggested in course | **Optional** tooling; not required by your PRD — document as N/A if not used |

---

## Section 2 — Impact analysis

### Epic impact

- **Epics 1–3:** Unchanged for **product** scope; no rollback required.
- **Gap:** Course rubric maps to a **new body of work** best captured as **Epic 4 (or “Phase 4 — Release & evidence”)** so it does not rewrite completed epics.

### Story impact

- No changes to **closed** story ACs unless you explicitly adopt a **global coverage NFR** (then add a **new** story: “Coverage gate + reporting” rather than editing 3.4 retroactively).
- **New stories** (indicative): Dockerfile api; Dockerfile web; Compose profiles (`dev` / `ci` / `prod-like`); optional nginx or `docker compose` service wiring; coverage script + threshold; QA report template commits; `docs/bmad-course-alignment.md` + `docs/ai-integration-log.md`.

### Artifact conflicts

| Artifact | Conflict / gap | Action |
|----------|----------------|--------|
| **PRD** | May not mention **containerized deployment** or **70% coverage** | Add optional **NFR** subsection *if* you adopt course rubric as binding |
| **architecture.md** | Describes Compose for Postgres + local Node dev | Add **“Containerized deployment (optional / Epic 4)”** section: images, compose services, health URLs |
| **UX** | No change to flows | N/A |
| **README** | Documents `docker compose up -d postgres` + npm dev | Extend with **`docker compose up` full stack** path once images exist |
| **CI** | Lint + unit + E2E + axe | Optionally add **coverage** job or merge-step with threshold |
| **Secondary** | Deferred-work items (CORS, axe version alignment, etc.) | Unrelated to course Docker gap; keep separate |

### Technical impact

- New build targets: `api` production image (Fastify `start`), `web` static or Node preview server.
- Compose networking: `DATABASE_URL` for api → postgres service name.
- Health: reuse **`GET /health`** on API; web needs **HTTP 200** probe (nginx or `wget` on preview).
- Security: non-root users in images; secrets via env files, not baked images.

---

## Section 3 — Recommended approach

**Selected path:** **Option 1 — Direct adjustment** (add **Epic 4** + stories; extend PRD/architecture/README; no rollback).

**Rationale:**

- Original BMAD scope delivered **spec-driven MVP** with strong QA-in-CI; course asks for **additional release-engineering and documentation evidence**.
- Rollback would destroy value without fixing the rubric gap.
- MVP **product** remains achieved; **course submission** needs an explicit **“evidence epic”**.

**Effort:** **Medium** (Docker + compose wiring 1–3 days for an intermediate dev; docs 0.5–1 day).  
**Risk:** **Medium** (first-time prod images: wrong `DATABASE_URL`, static asset paths, Playwright against containerized URLs).

**Alternative (explicit scope shrink):** If the assessor accepts **“Compose = database only + documented local run”**, document **intentional deviation** in one markdown file and skip Dockerfiles — only valid if rubric allows interpretation.

---

## Section 4 — Detailed change proposals

### 4.1 PRD (optional subsection — only if course is binding)

**Section to add:** Non-functional / delivery — *Containerization & evidence (training alignment)*

**Proposed bullets:**

- Optional **NFR-Docker:** Runnable stack via `docker compose up` including **api**, **web**, and **postgres** with documented ports.
- Optional **NFR-Coverage:** Line/branch coverage reported in CI with **minimum threshold** (e.g. 70% on agreed globs).
- **Documentation:** Single **BMAD narrative** + **AI integration log** for assessors.

### 4.2 Architecture

**Add:** Deployment topologies — (A) current dev: host Node + Compose Postgres; (B) target: multi-service Compose with image build args, healthchecks, non-root.

**Diagram:** Simple Mermaid: `web` → `api` → `postgres`.

### 4.3 Epics / stories (conceptual — for `epics.md` + sprint when you run sprint planning)

**Epic 4 — Containerization & course evidence** (example story titles)

1. **4.1** — `api` Dockerfile (multi-stage, non-root, `HEALTHCHECK` against `/health`).
2. **4.2** — `web` Dockerfile (build static assets; serve via minimal static server or nginx; health on `/`).
3. **4.3** — Extend `docker-compose.yml`: services `api`, `web`, `postgres`; networks; env; optional **profiles** `dev` / `full`.
4. **4.4** — README: one-command bring-up; parity with CI env vars.
5. **4.5** — Coverage: `@vitest/coverage-v8` (or istanbul), `npm run test:coverage`, optional CI gate at 70% with **documented exclusions** for generated/boilerplate.
6. **4.6** — QA report pack: `docs/qa/coverage-summary.md`, `docs/qa/accessibility.md` (pointer to CI + axe), `docs/qa/security-review.md` (checklist outcome), `docs/qa/performance-notes.md` (Lighthouse or manual + link to NFR-01/02 hooks).
7. **4.7** — `docs/bmad-implementation-narrative.md` — how PRD → architecture → stories → CI mapped to code.
8. **4.8** — `docs/ai-integration-log.md` — agents, prompts, MCPs used, misses, human overrides.

### 4.4 Stories — no edits to closed stories

All changes are **additive** files and new epic block in `epics.md`.

---

## Section 5 — Implementation handoff

**Scope classification:** **Moderate** — backlog reorganization (new epic + stories) + implementation + docs.

| Role | Responsibility |
|------|----------------|
| **You / PO** | Approve this proposal; decide if course rubric is **hard** or **soft** requirement |
| **Architect** | Finalize compose topology and env contract for containers |
| **Developer** | Dockerfiles, compose, coverage wiring, README |
| **Tech writer / you** | BMAD narrative + AI log + QA report stubs |
| **QA mindset** | Fill reports from CI outputs + one manual security pass |

**Success criteria:**

- `docker compose up` (profile documented) starts **postgres + api + web** and UI loads todos end-to-end.
- Coverage command exists; if threshold adopted, CI fails below floor.
- Assessor-facing docs exist in `docs/` (or `_bmad-output/` if you prefer single tree — pick one convention).

---

## Section 6 — Checklist execution log (Correct Course)

### §1 Understand trigger

| ID | Status | Notes |
|----|--------|-------|
| 1.1 | **N/A** | Trigger is external **course rubric**, not a single implementation story. |
| 1.2 | **Done** | **Type:** New / stakeholder requirement. **Statement:** Close gaps vs training deliverables OR document deliberate exceptions. |
| 1.3 | **Done** | Evidence table in Section 1. |

### §2 Epic impact

| ID | Status | Notes |
|----|--------|-------|
| 2.1 | **Done** | Epics 1–3 complete as planned; no modification to their internal ACs required. |
| 2.2 | **Done** | **Add Epic 4** (or equivalent backlog epic) for Docker + evidence docs. |
| 2.3 | **Done** | No future epics in file today; new epic is additive. |
| 2.4 | **Done** | Does not invalidate Epics 1–3. |
| 2.5 | **Done** | New work **after** Epic 3. |

### §3 Artifacts

| ID | Status | Notes |
|----|--------|-------|
| 3.1 | **[!] Action-needed** | PRD update **if** course rubric is binding. |
| 3.2 | **[!] Action-needed** | Architecture: add containerized deployment section. |
| 3.3 | **N/A** | No UX flow change. |
| 3.4 | **[!] Action-needed** | README, CI, new `docs/*` reports, compose files. |

### §4 Path forward

| Option | Viable? |
|--------|---------|
| 4.1 Direct adjustment | **Yes** (recommended) |
| 4.2 Rollback | **No** |
| 4.3 MVP review / reduce scope | **Only** if you negotiate rubric down to “DB compose + narrative” |

### §5 Proposal components

| ID | Status |
|----|--------|
| 5.1–5.5 | **Done** (this document) |

### §6 Final review

| ID | Status | Notes |
|----|--------|-------|
| 6.1 | **Done** | |
| 6.2 | **Pending** | Your review |
| 6.3 | **Pending** | Explicit **yes / no / revise** |
| 6.4 | **Pending** | After approval: update `epics.md`, `sprint-status.yaml`, run `bmad-sprint-planning` or `bmad-create-story` |
| 6.5 | **Pending** | After approval |

---

## What is already “correct” for the course (no change required)

- **BMAD workflow & artifacts:** PRD, UX, architecture, epics, stories with test scenario IDs, implementation readiness — **strong alignment** with Step 1.
- **Step 2 — Build + QA in CI:** Unit, integration-style API tests, component tests, Playwright E2E including **create / complete / delete / empty / errors** — **aligned**.
- **Accessibility:** Automated **axe** in E2E + CI step naming — meets “zero critical” **where you gate** (document any flows not gated).
- **E2E count:** **Well above** minimum five tests.

---

## Corrections to your pasted project description (wording accuracy)

1. **“Docker Compose orchestrates all containers (app, database)”** — In **this** repo, Compose currently orchestrates **database only**; apps are **not** containerized. Update course narrative when presenting the project, **or** implement Epic 4 so the sentence becomes true.
2. **“Postman MCP”** — Helpful if available; your stack validates contracts via **OpenAPI + automated tests** — acceptable substitute if course allows; state that explicitly in the AI log.
3. **“Framework Comparison”** — Your message ends there; if a template is required, add a short subsection (BMAD vs ad-hoc AI) in the narrative doc.

---

## Next actions for you

1. Reply with **mode** for any follow-up edits: **Incremental** (one artifact at a time) or **Batch** (single PR with all files).
2. Reply **yes / no / revise** to this Sprint Change Proposal.
3. If **yes:** run **`bmad-sprint-planning`** or **`bmad-create-epics-and-stories`** (or manually add Epic 4 to `epics.md`) then **`bmad-create-story`** for 4.1.

---

_Correct Course workflow — awaiting your approval to implement or revise._
