# Documentation index

Central map for **lets-do-it**: how to run and change the code, how to use the product in a browser, and where specifications and evidence live.

| Document | Audience | Contents |
|----------|----------|----------|
| **[User guide](USER_GUIDE.md)** | People using the app | Opening the app, adding todos, marking done, deleting, errors and retries, limits. |
| **[Developer guide](DEVELOPER_GUIDE.md)** | Contributors and operators | Repo layout, env vars, scripts, tests, CI, BMad artifact map, API pointers. |
| **[Contributing](../CONTRIBUTING.md)** | Contributors | PR checklist, **US-/IS-/ES-** test ID convention, local commands. |
| **[Root README](../README.md)** | Everyone | **Run**, **Test**, **API contract** (NFR-06); single source for commands. |
| **[QA evidence pack](qa/index.md)** | Reviewers / assessors | Coverage, a11y, security checklist, performance notes (NFR-10). |
| **[BMad implementation narrative](bmad-implementation-narrative.md)** | Reviewers / learners | How PRD → UX → architecture → stories mapped to the codebase (NFR-11). |
| **[AI integration log](ai-integration-log.md)** | Course / portfolio | Agents, MCP, prompts, gaps, human overrides (NFR-11). |

## Specifications (authoritative product and technical design)

These live under **`_bmad-output/planning-artifacts/`** in the repository:

| Artifact | Role |
|----------|------|
| [`prd.md`](../_bmad-output/planning-artifacts/prd.md) | Product requirements and success criteria. |
| [`ux-design-specification.md`](../_bmad-output/planning-artifacts/ux-design-specification.md) | UX patterns, components, accessibility expectations. |
| [`architecture.md`](../_bmad-output/planning-artifacts/architecture.md) | Stack, boundaries, API and data shapes. |
| [`epics.md`](../_bmad-output/planning-artifacts/epics.md) | Epics and stories with acceptance criteria and test scenario IDs. |

## Implementation tracking

| Path | Role |
|------|------|
| [`_bmad-output/implementation-artifacts/sprint-status.yaml`](../_bmad-output/implementation-artifacts/sprint-status.yaml) | Epic and story delivery status. |
| [`_bmad-output/implementation-artifacts/`](../_bmad-output/implementation-artifacts/) | Per-story context files, retrospectives, [`deferred-work.md`](../_bmad-output/implementation-artifacts/deferred-work.md) (known follow-ups). |
| [`_bmad-output/project-context.md`](../_bmad-output/project-context.md) | Lean rules for AI assistants working in this repo. |

## API contract (quick link)

Interactive docs: **`GET /documentation`** on the running API (see root README **API contract**). Machine-readable OpenAPI: **`/documentation/json`**.
