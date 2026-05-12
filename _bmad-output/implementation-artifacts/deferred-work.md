# Deferred work

Housekeeping pass **2026-05-13** closed several earlier review items (see git history): Playwright `global-setup.mjs` CI guard, Fastify AJV `removeAdditional: false` for PATCH + Zod strict, `listTodos` shape handling, list `ErrorBanner` remount key, `TodoRow` `aria-busy` during delete, README `WEB_ORIGIN` string-equality note, Playwright `fullyParallel: false` + axe suite `retries: 0`.

## Remaining (backlog / product / larger refactors)

### API & contract

- Unbounded `GET /api/v1/todos` — acceptable until pagination or abuse protection is required.
- `buildApp` requires `DATABASE_URL` and runs migrations at startup — intentional unless a DB-free boot mode is needed.
- Global error handler maps most non-validation errors to **500** `INTERNAL` — extend when product needs finer client-visible codes.
- JSON Schema (OpenAPI) vs Zod at HTTP boundary — consolidate or lint for drift over time.
- **OpenAPI POST** documents max length in prose (Unicode code points); JSON Schema `maxLength` omitted on purpose — keep OpenAPI and Zod aligned when contract tooling changes.
- **README:** PATCH **500** response not spelled out (same pattern as DELETE) — align in a future API docs pass.

### CORS & config

- **`WEB_ORIGIN`:** no automatic normalization (trailing slash, scheme case) — README documents strict string equality; code could normalize later if desired.

### Client

- **`todosClient`:** `createTodo` / `patchTodo` still assume JSON object on success — extend the same defensive pattern as `listTodos` if needed.
- **`TodoApp`:** single `patch.variables?.id` pending tracker can misattribute busy state on overlapping toggles — broader concurrency UX.
- **`ErrorBanner`:** still does not move focus on error (optional enhancement).

### CI / tests / tooling

- Integration tests share one DB and truncate per test; raising Vitest workers without per-worker DB risks cross-talk.
- **`describe.skipIf(!databaseUrl)`** — CI must supply `DATABASE_URL`; local without DB skips integration tests by design.
- **`jest-axe` vs `@axe-core/playwright`:** different pinned `axe-core` minors (`jest-axe@10` depends on **4.10.2**; Playwright stack on **4.11.x**). npm `overrides` did not replace jest-axe’s exact pin in this workspace; options: wait for `jest-axe` release, fork/patch, or accept the drift until Vitest uses the Playwright axe path for unit a11y.
- **Playwright global CI retries** — other E2E specs still use `retries: 2` in CI; only `a11y-list-shell.spec.ts` is pinned to `retries: 0`.

### Infra / hygiene

- **`npm audit`** noise in Docker image builds — supply-chain bumps as separate hygiene work.
- **Global `noindex`** in `web/index.html` — revisit when SEO matters.

### Architecture / process notes

- **TOCTOU** concurrent DELETE + PATCH on same id — address when concurrency SLAs exist.
- **IS-/US-** test ID taxonomy — document in CONTRIBUTING when someone owns testing guide.
- Epic 1 retro note: keep cross-cutting API/README changes inside the story that owns them.
