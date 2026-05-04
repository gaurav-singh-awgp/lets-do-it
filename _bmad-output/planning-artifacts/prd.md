---
workflowType: prd
workflow: edit
classification:
  domain: general_consumer_productivity
  projectType: web_app
  complexity: low
inputDocuments:
  - "/Users/gauravsingh/Downloads/Product Requirement Document (PRD) for the Todo App.pdf"
  - "./product-brief-todo-app.md"
stepsCompleted:
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
lastEdited: "2026-05-02"
editHistory:
  - date: "2026-05-02"
    changes: "Validation-guided edit — classification; V1 text immutability; SC-01 scripted check; NFR-06/07 explicit gates; SEO/indexing; health endpoint moved to Growth."
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
prdVersion: validation-guided-2026-05-02
---

# Product Requirements Document — lets-do-it

**Author:** Gauravsingh  
**Date:** 2026-05-02  
**Companion:** [Product brief — Todo app](./product-brief-todo-app.md)

## Executive Summary

Deliver a **full-stack personal todo** web product for **lets-do-it**: users manage a single logical collection of tasks with **create, read, update (complete/uncomplete), and delete**. Each todo has **short text**, **boolean completion**, **creation timestamp**, and a **stable server-issued identifier**. The UI loads the list **immediately** on open (with explicit **empty**, **loading**, and **error** states), keeps **active vs completed** visually distinct, and targets **desktop and mobile** viewports. A **small RESTful JSON API** (or equivalent HTTP resource design) persists data so sessions survive refresh.

V1 **excludes** authentication, multi-tenant data, collaboration, prioritization, due dates, and notifications. The **architecture must not preclude** adding accounts and per-user data later (clear resource boundaries, avoid client-only authoritative state).

**Deployment default (V1):** Intended for **local or private demo** use. A **public internet** deployment of an **unauthenticated** CRUD API is **out of scope** for V1 unless separate security controls are specified later; operators assume responsibility if they expose the stack beyond that default.

## Success Criteria

| ID | Criterion | Measurement |
|----|-----------|----------------|
| SC-01 | **Unaided core loop** | **Owner:** PRD author or PM. **Method:** Scripted session (no in-app help): open app → add one todo → mark complete → delete → confirm list empty. **Pass:** Single operator completes script **without** reading help/tooltips; result recorded pass/fail. |
| SC-02 | **Session durability** | Given healthy server and storage: after browser refresh, todo set matches pre-refresh set **100%** for lists ≤ 500 items |
| SC-03 | **API responsiveness** | CRUD endpoints achieve **P95 ≤ 200 ms** server processing time under local/single-user baseline (excluding client network variability); documented test method |
| SC-04 | **UI responsiveness** | After successful server acknowledgment, list reflects change **≤ 1 s P95** under normal conditions |
| SC-05 | **Defect bar for V1** | No uncaught exceptions on happy path; user-visible failures show **recoverable messaging** (retry or reload guidance where applicable) |
| SC-06 | **Scope compliance** | Release checklist confirms **no** shipped dependencies on auth, multi-user isolation, priorities, deadlines, or notification channels |

## Product Scope

### MVP (V1 — must ship)

- Persisted todos with **text** (non-empty, max length enforced), **done** flag, **createdAt**, **id**. **Text is immutable after create**; “update” in V1 means **done flag only**.
- List screen: view all, add, toggle done, delete.
- API: list, create, update (**done** toggle only), delete; consistent error payload shape.
- Responsive layout; keyboard/tap targets usable on mobile.
- Explicit **empty**, **loading**, and **error** UI states on the list experience.

### Growth (post-MVP, not committed)

- User accounts, per-user lists, sync across devices.
- **Edit todo text** after create (new API + UI behavior).
- **Ops:** HTTP **health** or root metadata endpoint returns **200** when process is up — **required before any production deploy** without authentication.
- Soft delete / archive, undo window.
- Search/filter when list sizes justify it.

### Vision (directional)

- Optional collaboration, reminders, or integrations—**only** after validated demand and privacy model.

## User Journeys

### UJ-1 — First open (empty)

1. User opens app URL.  
2. System shows **loading** then **empty state** with primary “add todo” affordance.  
3. User adds first item; it appears at top (or per documented ordering rule).

**Success:** User understands what to do with **zero** onboarding modal.

### UJ-2 — Steady usage (several active items)

1. User sees mixed active/completed items (if any completed).  
2. Active vs completed styling makes status obvious at a glance.

**Success:** User scans list in **< 5 s** for “what’s still open” (qualitative review goal).

### UJ-3 — Complete and uncomplete

1. User marks item done; UI updates; persistence succeeds.  
2. User toggles back to active; persistence succeeds.

**Success:** Toggle survives refresh (SC-02).

### UJ-4 — Delete

1. User deletes item; UI removes row; server deletes record.  
2. Accidental delete: **no** undo in V1—acceptable if documented in brief; destructive action should be **clear** (label/control, not ambiguous icon-only if possible).

**Success:** Deleted item does not reappear after refresh.

### UJ-5 — Return visit

1. User closes tab and returns later.  
2. List matches last successful server state.

**Success:** Matches SC-02.

### UJ-6 — Backend unavailable / slow

1. User performs action while API errors or times out.  
2. UI shows **error state** for the operation or list; user can retry without losing entire page context where feasible.

**Success:** No silent failure; no infinite spinners without timeout messaging.

## Domain Requirements

- **Industry:** General consumer productivity; **no** regulated health, payment, or children’s-data domain in V1.
- **Privacy:** Treat all todos as **sensitive user content** at transport (HTTPS in real deployments) and rest (storage permissions minimized); no third-party analytics requirement in PRD—product owner decides; if added, must be disclosed and configurable.
- **Accessibility:** Target **WCAG 2.1 Level AA** for primary flows where applicable (contrast, focus order, name/role for controls)—measurable via automated checks plus manual spot-check on add/complete/delete.

## Innovation Analysis

- **Differentiation:** Quality of **minimal scope**—speed, clarity, durability—not novel algorithms.
- **Competitive landscape:** Crowded category; success depends on **discipline** and **polish**, not unique features.
- **Risk:** “Another todo app” perception—mitigate with **reliable persistence** and **clean UX** per success criteria.

## Project-Type Requirements

- **Client:** Web UI (SPA or MPA acceptable); must work on **latest two major versions** of Chromium, Safari, and Firefox (desktop + iOS Safari / Android Chrome).
- **Server:** HTTP API with JSON request/response; **versioned or stable** URL prefix (e.g., `/api/v1/...`) to allow future evolution.
- **Data:** Server-side authoritative store (SQL or document store acceptable); migrations strategy documented for schema changes.
- **Deploy:** Single-command or documented steps to run API + client for local dev; production hosting left to implementation with NFRs below.

### SEO and indexing (web app)

- **V1:** No SEO growth channel required. If the client is reachable on the public web, ship a **default `noindex`** (or equivalent robots policy) and a stable **document `<title>`** until product marketing scope exists.
- **Growth:** Optional indexable landing/marketing surface; out of scope for core todo UI in V1.

## Functional Requirements

Each FR is **testable** and maps to journeys. V1 **does not** include post-create text edit (see Growth).

| ID | Requirement | Trace | Test / acceptance |
|----|-------------|--------|----------------------|
| FR-01 | User can **create** a todo with **non-empty** text | UJ-1, UJ-2 | Reject empty/whitespace-only with **4xx** + message; valid create returns **201** with `id`, `text`, `done`, `createdAt` |
| FR-02 | Text length **≤ 500** Unicode code points (configurable constant) | UJ-2 | Submission beyond max returns **4xx**; DB never stores beyond limit |
| FR-03 | User can **list** all todos | UJ-2, UJ-5 | GET returns array; stable sort: **`createdAt` descending** unless changed by explicit future FR |
| FR-04 | User can **mark** todo completed | UJ-3 | PATCH/PUT (or POST action) sets `done=true`; persisted; reflected on reload |
| FR-05 | User can **mark** todo active again | UJ-3 | Sets `done=false`; persisted |
| FR-06 | User can **delete** todo by id | UJ-4 | DELETE removes row; subsequent GET does not return it; **404** on repeat delete acceptable if documented |
| FR-07 | User sees **empty state** when zero todos | UJ-1 | When count=0, dedicated empty UI (not blank table) |
| FR-08 | User sees **loading** indicator during initial fetch | UJ-1, UJ-5 | Shown until success or error |
| FR-09 | User sees **error** UI on failed fetch or mutation | UJ-6 | Human-readable message; retry or reload path |
| FR-10 | **Completed** items visually distinct from active | UJ-2, UJ-3 | Visual spec: strikethrough **or** muted style + `aria`/`data-state` for assistive tech |

## Non-Functional Requirements

| ID | Requirement | Measurement |
|----|-------------|-------------|
| NFR-01 | API CRUD **P95 ≤ 200 ms** processing under baseline load (single user, ≤ 500 todos) | APM or structured logs with timing; reproducible script in repo docs |
| NFR-02 | UI reflects successful mutations **≤ 1 s P95** after server OK | Instrumented manual or E2E timing |
| NFR-03 | Concurrent requests: no data loss for **single-user** sequential ops (last-write-wins acceptable on same record if documented) | Integration tests |
| NFR-04 | **HTTPS** required in non-local production | Infra checklist |
| NFR-05 | **Secrets** not committed; configuration via env | Secret scan in CI (recommended) |
| NFR-06 | **Codebase maintainability** | Root **README** on main branch **must** contain three explicit blocks (headings or linked sections): **Run** (start API + client locally), **Test** (how to execute automated tests), **API contract** (link or path to OpenAPI/Swagger or equivalent static description). **Pass:** CI job or release checklist verifies all three on each release candidate. |
| NFR-07 | **Accessibility** | Default branch CI **must** run automated a11y checks (e.g. axe) against the **main list view** (add/complete/delete paths exercised); **zero critical** violations reported by that tool on the checked snapshot. |

## Traceability Summary

| Journey | FRs primarily covering |
|---------|------------------------|
| UJ-1 | FR-01, FR-07, FR-08, FR-09 |
| UJ-2 | FR-01–FR-03, FR-10 |
| UJ-3 | FR-04, FR-05, FR-10 |
| UJ-4 | FR-06, FR-09 |
| UJ-5 | FR-03, FR-08, FR-09 |
| UJ-6 | FR-09, NFR-01–NFR-02 |

## Document History

| Version | Change |
|---------|--------|
| refined-2026-05-02 | Expanded from PDF seed to full PRD sections; added companion product brief. |
| validation-guided-2026-05-02 | Edit workflow: `classification`, deployment default, SC-01 owner/script, immutable text V1, SEO subsection, FR-11 → Growth (ops health), NFR-06/07 CI/README gates, FR table FR-01–FR-10. |

## Provided requirements source (archival)

Original condensed intent from user-supplied PDF:

- Simple full-stack Todo; CRUD; metadata; responsive; empty/loading/error states; no auth/multi-user in V1; architecture extensible later; out of scope: accounts, collaboration, priorities, deadlines, notifications.
