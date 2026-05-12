# Deferred work

## Deferred from: code review of 1-5-readme-run-test-api-contract-and-root-ci-skeleton.md (2026-05-12)

- **`global-setup.mjs` `docker compose up -d` silently fails in CI** — When Playwright runs in GitHub Actions, port 5432 is already bound by the `services:` Postgres container, so `docker compose up -d` throws an error that is caught and swallowed. The tests still pass because `DATABASE_URL` points to the already-running service container. Risk: if the silent-error path is ever removed or the catch narrowed, CI will break. Fix: add `if (process.env.CI) return;` guard at the top of `globalSetup()` to skip the Compose call entirely in CI. Candidate owner: Story 3.4 (CI matrix) or a small housekeeping PR.

## Deferred from: code review of 1-4-web-list-shell-with-loading-empty-and-fetch-error-states.md (2026-05-12)

- **PATCH immutable-text rule is not enforced.** Integration test `todos.integration.test.ts › PATCH rejects extra keys (immutable text)` returns **200** instead of the expected **400** when the client sends `{ done: true, text: "nope" }`. Fastify defaults AJV with `removeAdditional: true`, so the route schema's `additionalProperties: false` silently strips `text` before the handler runs; the Zod `.strict()` then sees only `{ done }` and passes. Pre-existing failure inherited from Story 1.3 — Story 3.1 (`PATCH /api/v1/todos/:id for done-only updates`) is the natural owner. Fix options: (a) configure Fastify AJV `removeAdditional: false`, (b) read `request.body` before Fastify validation via a pre-parse hook, or (c) move strict validation entirely into Zod and have the route opt out of Fastify body validation. Test was correct; implementation is the regression.
- `WEB_ORIGIN` is trimmed and comma-rejected but not URL-normalized (trailing slash, scheme/case mismatch silently fails CORS in browser) — `api/src/http/resolve-web-origin.ts`. Defer to a CORS-hardening pass; document strict equality in README until then.
- OpenAPI POST body schema drift in `api/src/routes/todos.ts`: `maxLength` removed in favor of prose description, and `additionalProperties: false` added — out of Story 1.4 scope; reconcile alongside Story 2.1 (POST validation + immutable text rule). Risk: machine clients/generators no longer see the length limit, and OpenAPI now claims stricter shape than the Zod runtime guarantees.
- `web/src/api/todosClient.ts › listTodos` assumes a JSON-array body on `200` — non-array or non-JSON success bodies surface a raw `SyntaxError`/type-error in the load banner rather than the AC4 friendly fallback. Pre-existing from Story 1.1 scaffold; revisit when the API contract grows beyond a bare array (or as part of an apiClient hardening pass).
- Story 1.4 quietly carried API and README work (Helmet CSP, `resolveWebOrigin` helper, `runMigrations` try/catch, `readFastifyValidation` relaxation, OpenAPI POST tweaks, README CORS + schema docs) that was not declared in Story 1.4 ACs. Capture for Epic 1 retro: tighten sprint-scope discipline so cross-cutting changes are owned by an authorized story (likely 1.3 or 1.5).
- `web/src/components/ErrorBanner.tsx` has `role="alert"` but does not move focus or use a `key` tied to fetch failure count — repeated identical retry failures may not be re-announced by some screen readers. Story 1.6 owns the axe gate; queue this as an a11y hardening item alongside it.

## Deferred from: code review of 1-3-get-api-v1-todos-with-openapi-and-error-envelope.md (2026-05-04)

- Unbounded `GET /api/v1/todos` (no pagination or caps) — acceptable for Story 1.3; revisit when product requires list limits or abuse protection.
- `buildApp` hard-requires `DATABASE_URL` and runs migrations during startup — intentional for this service; revisit only if a DB-free or health-only boot mode is needed.
- Global handler maps most non-validation errors to 500 `INTERNAL` — acceptable baseline; add domain-specific codes when product needs client-visible distinction.
- JSON Schema fragments, inline route schemas, and Zod parsers maintained separately — track as follow-up to consolidate generation or lint drift.
- `describe.skipIf(!databaseUrl)` skips all integration tests when env unset — CI must supply `DATABASE_URL` for coverage; local dev without DB stays green by design.
- `sendError` uses `randomUUID()` when `requestId` is omitted — low risk while call sites pass Fastify `request.id` for user-visible errors.

## Deferred from: code review of 1-2-local-postgresql-and-drizzle-schema-for-todos.md (2026-05-04)

- Integration tests use a shared database and truncate `todos` per test; running Vitest with multiple workers against a single `DATABASE_URL` can cause cross-test interference. Address via `poolOptions.max: 1`, serial integration projects, or per-worker databases when CI enables parallelism.

## Deferred from: code review of 2-1-post-api-v1-todos-with-validation-and-immutable-text-rule.md (2026-05-12)

- Global `noindex` in `web/index.html` may be undesirable for production SEO, but this is pre-existing from Story 1.6 scope and not required to resolve Story 2.1.
- Unit and E2E accessibility checks currently resolve different `axe-core` versions (`jest-axe` vs `@axe-core/playwright`), which can produce inconsistent violation outcomes across layers.
- Current Story 2.1 working tree includes unrelated dependency/web/artifact churn outside the expected API-focused file scope; isolate in a later cleanup pass.

## Deferred from: code review of 1-6-baseline-accessibility-checks-for-list-shell.md (2026-05-12)

- Unit and E2E accessibility checks currently resolve different `axe-core` versions via `jest-axe` and `@axe-core/playwright`. This can produce inconsistent violation outcomes across layers. Defer as pre-existing tooling drift unless the team wants to pin/align both stacks now.

## Deferred from: code review of 3-1-patch-api-v1-todos-by-id-for-done-only-updates.md (2026-05-12)

- D1: `patchTodoBodySchema`, route handler, service, and repository are absent from this diff (story is brownfield — API was pre-existing). Manually verify these files comply with architecture constraints (`done`-only Zod strict, service gatekeeper, repository updates only `done + updated_at`).
- D2: IS-/US- test taxonomy convention is undocumented and inconsistently applied across the test suite. Define in a CONTRIBUTING or testing guide in a future housekeeping pass.
- D3: TOCTOU race — concurrent DELETE + PATCH on the same todo ID exercises an unguarded path in `patchTodo` (findById succeeds then updateDone on a deleted row). Pre-existing architecture gap; address when concurrency SLAs are defined.
- D4: README does not document the `500` response for PATCH (consistent with DELETE, which also omits it). Pre-existing documentation pattern; align in a future API contract docs pass.
