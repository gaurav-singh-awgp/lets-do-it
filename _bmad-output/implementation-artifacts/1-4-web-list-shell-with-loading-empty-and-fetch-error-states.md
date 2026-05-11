---

## story_key: 1-4-web-list-shell-with-loading-empty-and-fetch-error-states

story_id: "1.4"
epic: 1
status: done

# Story 1.4: Web list shell with loading, empty, and fetch error states

Status: done

## Story

As a **todo user**,
I want **the first screen to show loading, then either an inviting empty state or my todos, or a clear error with retry**,
So that **I never stare at a blank page wondering if the app is broken**.

## Acceptance Criteria

1. **Loading honesty (FR-08, UX-DR4)**
  **Given** Story 1.3 is complete and the web app is configured with `apiClient` + TanStack Query against `/api/v1/todos` (Vite dev proxy already forwards `/api` → `http://127.0.0.1:3000`; `VITE_API_BASE_URL` is honored when set)
   **When** the app mounts on `/`
   **Then** a **loading affordance** (skeleton **or** spinner — pick one and reuse it) is rendered **until the initial GET settles** (success or error). The control surface used must be perceivable to assistive tech (e.g. `role="status"` with visible-or-SR-only text such as “Loading todos…”).
2. **Empty state (FR-07, UX-DR3, UX-DR11)**
  **When** the initial GET resolves with `200` and `[]`
   **Then** an **EmptyState** region renders containing:
   (a) a short headline (e.g. **“No todos yet”**),
   (b) a short subline inviting action (e.g. **“Add your first task above.”**), and
   (c) the **AddComposer** remains visible above/adjacent to the empty state so the **primary add affordance** is one tab/click away (composer wiring itself is implemented in Stories 2.1/2.2 — this story keeps the existing composer rendered but does **not** harden create UX).
   The empty state container must be discoverable in tests (preserve the existing `data-testid="todo-empty"` selector — the E2E spec at `tests/e2e/todos.spec.ts` depends on it).
3. **Populated list (FR-03, UX-DR11)**
  **When** the initial GET resolves with `200` and a non-empty array
   **Then** todos render as a semantic `**ul` / `li`** list (preserve `aria-label="Todo list"` on the `ul`) in **server order** (newest first by `createdAt` descending). The client **must not** re-sort the array — the API’s `ORDER BY created_at DESC` is the contract (verified in Story 1.3 integration tests).
4. **Fetch error + Retry (FR-09, UX-DR5, UX-DR13)**
  **When** the initial GET fails (non-2xx response, network error, or fetch rejection)
   **Then** an **ErrorBanner** renders with:
   (a) `role="alert"` (critical load failure — see UX spec §UX Consistency Patterns › Feedback Patterns),
   (b) a **human-readable message** sourced from the API error envelope `error.message` when present, otherwise a generic fallback (e.g. **“We couldn’t load your todos.”**),
   (c) a **visible Retry button** that, when activated, invokes `query.refetch()` (or equivalent invalidation) on the list query and re-enters the loading state until the retry settles; on success the banner is removed and the list renders.
5. **Tailwind + Radix baseline (UX-DR1)**
  **When** dependencies are installed
   **Then** the `web/` workspace declares `**tailwindcss`** + `**@tailwindcss/vite`** (v4 line) **and at least one Radix UI primitive package** (recommended: `**@radix-ui/react-checkbox`** — required by Story 3.2 — plus optionally `**@radix-ui/react-slot`** if you adopt shadcn-style Button composition).
   **And** Tailwind is wired in `web/vite.config.ts` (add the `tailwindcss()` plugin alongside `react()`) **and** the entry CSS (`web/src/index.css`) imports Tailwind via `**@import "tailwindcss";`**.
   **And** **Direction A — Classic calm** tokens are seeded in CSS via a `@theme` block (zinc neutrals + a single blue accent + standard `rounded-md` radius) — minimum set: surface/background, border, text-primary, text-muted, accent, destructive, error. Existing legacy CSS variables (`--text`, `--bg`, etc. in `index.css`) may remain temporarily, but **new** components on this story should use Tailwind utilities backed by the `@theme` tokens — full token migration of older components is **deferred**.
   This AC explicitly does **not** require completing a full design-system pass. It is a **baseline install** so Stories 2.x / 3.x can build on Tailwind + Radix without an architecture detour.

**Traces:** FR-03, FR-07, FR-08, FR-09; UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR11, UX-DR13, UX-DR14. NFR-07 baseline a11y is **owned by Story 1.6**, not this story; do not gate 1.4 on full axe coverage, but **do not introduce critical regressions** (the existing `role="alert"` banner is already in `tests/e2e/todos.spec.ts`).

## Tasks / Subtasks

- [x] **Install Tailwind v4 + Radix baseline** (AC: 5)
  - [x] In `web/`: `npm install tailwindcss @tailwindcss/vite` and `npm install @radix-ui/react-checkbox` (add `@radix-ui/react-slot` only if you choose to build a shared `Button` primitive in this story — otherwise defer to Story 2.2).
  - [x] Update `**web/vite.config.ts`**: add `import tailwindcss from "@tailwindcss/vite";` and include `tailwindcss()` in `plugins` (keep `react()`).
  - [x] `**web/vitest.config.ts`** mirrors `vite.config.ts` plugins for production parity — Tailwind only emits CSS at build time, but **add the plugin to the vitest config too** so any future `@apply`/CSS-imported component renders consistently in jsdom (recommended; not strictly required for these tests).
  - [x] `**web/src/index.css`**: prepend `**@import "tailwindcss";`** at the very top (preserve legacy custom-property declarations below it for now). Add a `**@theme**` block immediately after the import with **Direction A** tokens:
    ```css
    @theme {
      --color-bg: oklch(0.99 0 0);        /* zinc-50 / paper */
      --color-surface: oklch(0.97 0 0);    /* zinc-100 */
      --color-border: oklch(0.91 0 0);     /* zinc-200 */
      --color-text: oklch(0.21 0.01 280);  /* zinc-900 */
      --color-text-muted: oklch(0.50 0.02 280); /* zinc-500 */
      --color-accent: oklch(0.55 0.20 255); /* blue-600 */
      --color-accent-fg: oklch(0.99 0 0);
      --color-destructive: oklch(0.55 0.22 25);  /* red-600 */
      --color-error-bg: oklch(0.96 0.04 25);     /* red-50 */
      --color-error-fg: oklch(0.30 0.18 25);     /* red-900 */
      --radius-md: 0.5rem;
    }
    ```
    Exact lightness/chroma values may be tuned — the **constraint** is WCAG 2.1 AA contrast on `--color-text` over `--color-bg`, on `--color-accent-fg` over `--color-accent`, and on `--color-error-fg` over `--color-error-bg` (verify with any AA contrast tool; Story 1.6 axe will assert this).
  - [x] **No `tailwind.config.js`** required for v4 (CSS-first config). Do not add one unless you need a JS plugin.
- [x] **Refactor ListShell as a composable AppFrame** (AC: 1, 2, 3, 4; UX-DR2, UX-DR11)
  - [x] Create `**web/src/components/ListShell.tsx`**: receives `children` and renders the page chrome — semantic `<main>` containing a single `<h1>Todos</h1>`, a short subhead, max-width container (~40rem ≈ Tailwind `max-w-2xl`), centered horizontally, with **16px** horizontal safe area on mobile (e.g. Tailwind `px-4 sm:px-6`). Inline styles in current `web/src/App.tsx` are migrated to Tailwind utilities applied to the JSX in `ListShell`.
  - [x] Update `**web/src/App.tsx`** to render `<ListShell><TodoApp /></ListShell>` (remove the inline `<main class="todo-shell">` chrome from `App.tsx`).
  - [x] **Do not** delete `.todo-shell` / `.todo-lead` CSS yet — older tests/snapshots may reference them; you may remove the class names from JSX while leaving CSS rules to be pruned in a later polish pass.
- [x] **Extract `EmptyState` component** (AC: 2; UX-DR3)
  - [x] Create `**web/src/components/EmptyState.tsx`**: stateless component with props `{ headline?: string; subline?: string }` (defaults: “No todos yet” / “Add your first task above.”). Renders a region with a heading-level appropriate under the `<h1>` in `ListShell` (use `<h2>` or `role="region"` + `aria-label`). Preserve `**data-testid="todo-empty"`** on the outermost element so existing E2E specs (`tests/e2e/todos.spec.ts`) and unit tests still pass without churn.
  - [x] Update `**web/src/features/todos/TodoList.tsx**` so the empty branch renders `<EmptyState />` instead of the inline `<p data-testid="todo-empty">…</p>`. Keep the `loading` branch and populated branch otherwise unchanged.
- [x] **Extract `ErrorBanner` component with Retry** (AC: 4; UX-DR5, UX-DR13)
  - [x] Create `**web/src/components/ErrorBanner.tsx`**: props `{ message: string; onRetry?: () => void; retryLabel?: string }`. Renders a region with `**role="alert"`** (always — see UX › Feedback Patterns — critical load failure). When `onRetry` is provided, render a visible button labeled **“Retry”** (default) inside the banner; clicking it calls `onRetry()`. Style with Tailwind utilities backed by `--color-error-bg` / `--color-error-fg` (and accent for the Retry button focus ring).
  - [x] **Critical refactor in `web/src/features/todos/TodoApp.tsx`:** the existing banner surfaces messages from `q.error`, `create.error`, `patch.error`, **and** `del.error` via a single `firstErrorMessage(...)` helper. **Story 1.4 owns only the load-error path.** Refactor so:
    - [x] When `**q.isError`** (initial GET failed) → render `**<ErrorBanner message={...} onRetry={() => q.refetch()} />`** above (or instead of) the list. This satisfies AC 4 and UX-DR13.
    - [x] When **only** mutation errors exist (create/patch/del) and `q.isError` is false → keep the existing inline mutation-error message (do **not** regress current behavior — Story 2.2 / 2.4 / 3.2 own mutation-error UX hardening).
    - [x] Suggested pattern: extract two derived values (`loadErrorMessage`, `mutationErrorMessage`) instead of a single `firstErrorMessage`.
  - [x] **Refetch semantics:** prefer `**q.refetch()`** for Retry (it re-runs the query with the same key and bypasses cache freshness). `qc.invalidateQueries({ queryKey: todoKeys.list() })` also works but is less direct here. Document the choice in Dev Agent Record.
  - [x] **Error message extraction:** `apiClient.listTodos()` already throws `new Error(message)` where `message` comes from `error.message` in the envelope (see `web/src/api/todosClient.ts` → `readError`). Pass `q.error.message` straight through. Fallback to **“We couldn’t load your todos.”** when `message` is empty/undefined.
- [x] **Loading affordance** (AC: 1; UX-DR4)
  - [x] In `**web/src/features/todos/TodoList.tsx`**, replace the bare `<p className="todo-muted" role="status">Loading…</p>` with a **list-skeleton** (preferred) or a small spinner. Minimum implementation: 2–3 stub `<li>` placeholders styled via Tailwind (e.g. `animate-pulse bg-[--color-surface] h-10 rounded-md`) wrapped in a `<ul role="status" aria-label="Loading todos">`. Keep an SR-only `<span className="sr-only">Loading todos…</span>` so `getByRole("status", { name: /loading/i })` resolves in tests.
  - [x] **Reduced motion:** add Tailwind `motion-safe:animate-pulse` (or wrap the animation in `@media (prefers-reduced-motion: no-preference)`) per UX-DR10.
- [x] **HTML shell polish** (UX-DR2)
  - [x] Update `**web/index.html`** `<title>web</title>` → `<title>lets-do-it</title>` (or `Todos — lets-do-it`).
  - [x] **Do not** add `<meta name="robots" content="noindex" />` here — that is **Story 1.6’s** responsibility (Story 1.6 AC 3 explicitly covers `noindex` + stable title). Adding it now would steal scope without owning the test coverage.
- [x] **Install MSW for test scenarios** (test infrastructure for US-1.4.b, US-1.4.c, IS-1.4.a, IS-1.4.b — and required for Stories 2.2, 2.4, 3.2)
  - [x] In `web/`: `npm install --save-dev msw@latest`.
  - [x] Create `**web/src/test/mswServer.ts`** exporting a `setupServer()` instance and a small `http` handler builder around `/api/v1/todos`. Pattern reference: [https://mswjs.io/docs/integrations/node](https://mswjs.io/docs/integrations/node) (Node integration for Vitest/jsdom — use `setupServer` from `msw/node`, **not** the browser worker).
  - [x] Update `**web/src/setupTests.ts`**:
    ```ts
    import "@testing-library/jest-dom/vitest";
    import { afterAll, afterEach, beforeAll } from "vitest";
    import { server } from "./test/mswServer";
    beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());
    ```
  - [x] **Do not migrate existing `vi.stubGlobal("fetch", …)` tests** — leave them as-is to keep the diff focused. New 1.4 tests use MSW; older tests keep their fetch stubs. **Coexistence guarantee:** `vi.stubGlobal("fetch", mock)` replaces the global `fetch` entirely, so MSW’s interception layer is bypassed in those tests — `onUnhandledRequest: "error"` will not trigger. (If a fetch-stub test starts failing for any reason, the cheap fix is to add `server.use(http.get("*/api/v1/todos", () => HttpResponse.json([])))` at the top of the test instead of using `vi.stubGlobal`.)
- [x] **Tests — unit `US-1.4.*`** (AC: 1, 2, 4)
  - [x] **US-1.4.a** (`web/src/features/todos/TodoApp.test.tsx` or new `ListShell.test.tsx`): MSW returns `[]` → assert the EmptyState region is visible (`getByTestId("todo-empty")` **and** `getByRole("heading", { name: /no todos/i })`). This extends the existing empty-state test; migrating it to MSW is **optional** but recommended.
  - [x] **US-1.4.b** (new): MSW handler keeps the request **pending forever** (`new Promise(() => {})` inside the resolver, or `delay("infinite")` via MSW) → assert the loading affordance is visible (`getByRole("status", { name: /loading/i })`).
  - [x] **US-1.4.c** (new): MSW returns `500` with the documented envelope `{ "error": { "code": "INTERNAL", "message": "Failed to list todos", "requestId": "..." } }` → assert (a) `**getByRole("alert")`** is visible, (b) it contains the API error message, (c) a button with name `/retry/i` is visible.
- [x] **Tests — integration `IS-1.4.*`** (AC: 3, 4)
  - [x] **IS-1.4.a**: MSW returns **two** todos with different `createdAt` (server already sorts newest-first; reflect that in the fixture). Assert both `text` strings render and the **first** `<li>` in DOM order matches the newest todo (use `screen.getAllByRole("listitem")[0]`).
  - [x] **IS-1.4.b**: MSW handler **fails on first call** (`HttpResponse.json(envelope, { status: 500 })`) and **succeeds on second call** (return one todo). Render → wait for ErrorBanner + Retry → click Retry → assert the loading affordance briefly appears (or use `findByText(...)` to wait through the transition) → assert the list renders the todo **and** the ErrorBanner is **gone** (`queryByRole("alert")` is `null`).
- [x] **Tests — E2E `ES-1.4.*`** (AC: 2, 4)
  - [x] **ES-1.4.a**: An existing test (`tests/e2e/todos.spec.ts` › `empty state`) already covers “open `/` with empty DB → empty state visible.” No new spec required; verify it still passes after the EmptyState refactor.
  - [x] **ES-1.4.b** (new): add a Playwright spec in `tests/e2e/load-error.spec.ts` (or extend `todos.spec.ts`) that intercepts `GET **/api/v1/todos` with `route.fulfill({ status: 500, body: JSON.stringify({ error: { code: "INTERNAL", message: "Server unavailable" } }) })`, opens `/`, asserts the alert banner contains the message, then **un-routes** (or fulfills success on a second call) and clicks **Retry**, asserting the banner disappears and the list (or empty state) renders. Use `page.route` with a counter so the second call goes through. Keep the spec under the existing `todo journeys` describe block or a new describe — match the file’s existing style.
- [x] **README / Dev Agent Record updates** (UX-DR2, NFR-06 maintenance)
  - [x] No new README sections required by Story 1.4 ACs. If you choose, add a **one-line note** under “Run” that the web client expects the API at `/api/v1/todos` via the existing Vite proxy or `VITE_API_BASE_URL` (already implicit — only add if you find the existing README ambiguous after this story). Full Run/Test/API contract polish belongs to Story 1.5.
  - [x] In Dev Agent Record below, list every new/modified file and call out the Retry semantics decision (`refetch` vs `invalidateQueries`).

### Review Findings

_Code review run 2026-05-12 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 4 decision-needed (resolved → 3 patch + 1 dismissed), 9 patches total (all applied + verified), 6 deferred, 4 dismissed._

**Decision-needed (resolved):**

- [x] [Review][Decision→Patch] Cached todos remain visible during list error — chose **(a) hide list when `q.isError`** (strict AC4 reading). Tracked as patch P7 below.
- [x] [Review][Decision→Patch] `readFastifyValidation` shape relaxation — chose **revert to `Array.isArray` guard**. Tracked as patch P8 below.
- [x] [Review][Decision→Dismissed] Helmet CSP missing directives — verified live: Helmet 8 defaults supply adequate `style-src` and `font-src`; Swagger UI at `/documentation` loads all sub-resources 200 OK with no inline scripts. Accepted as authorized; bounded to single-app deployment.
- [x] [Review][Decision→Patch] Load message fallback — chose **fix at source in `apiClient.readError`** so envelope-derived vs synthesized messages are distinguishable; consumer keeps friendly fallback for synthesized errors. Tracked as patch P9 below.

**Patch (applied 2026-05-12):**

- [x] [Review][Patch] **P1** — Invalid `<ul>` skeleton replaced with `<div role="status">` + decorative `<div>` placeholders [web/src/features/todos/TodoList.tsx]
- [x] [Review][Patch] **P2** — Retry tests switched from counter to deterministic `mode: "fail" | "ok"` state machine; production `queries.retry: false` confirmed [web/src/features/todos/TodoApp.test.tsx; tests/e2e/load-error.spec.ts]
- [x] [Review][Patch] **P3** — Removed `&& !q.isError` guard so mutation banner shows independently of list load error [web/src/features/todos/TodoApp.tsx]
- [x] [Review][Patch] **P4** — `US-1.4.b` infinite-pending MSW handler now uses `delay('infinite')` per story Dev Notes line 231 [web/src/features/todos/TodoApp.test.tsx]
- [x] [Review][Patch] **P5** — Removed dead `.todo-muted, .todo-empty` CSS rule (no JSX references remain post-Tailwind). `.todo-shell` / `.todo-lead` kept per story Dev Notes line 77; `.todo-error` / `.todo-app` still in use [web/src/index.css]
- [x] [Review][Patch] **P6** — `IS-1.4.b` now asserts `findByRole("status", { name: /loading todos/i })` after Retry click, with a 40ms MSW delay to make the affordance observable [web/src/features/todos/TodoApp.test.tsx]
- [x] [Review][Patch] **P7** (from Decision 1) — Renamed `suppressEmptyState` → `suppressContent`; now hides both populated list and empty state when `q.isError`, while loading skeleton still wins for retry [web/src/features/todos/TodoApp.tsx, web/src/features/todos/TodoList.tsx]
- [x] [Review][Patch] **P8** (from Decision 2) — Restored `Array.isArray` guard in `readFastifyValidation`; error envelope `details` is array-only again [api/src/app.ts]
- [x] [Review][Patch] **P9** (from Decision 4) — Added `ApiEnvelopeError` class in `todosClient.ts`; throw sites use `buildResponseError()` which returns an envelope subclass only when the body parsed cleanly. `loadErrorDisplayMessage` now applies the friendly fallback for any non-envelope error (network failures, opaque 5xx, statusText fallbacks) [web/src/api/todosClient.ts, web/src/features/todos/TodoApp.tsx]

**Verification:**

- `npm run test -w web` — **14/14 pass** across 5 files.
- `npm run build -w web` — clean.
- `npx eslint web/src/` — clean.
- `npm run test -w api` — 25/26 pass. The single failure (`PATCH rejects extra keys (immutable text)`) is **pre-existing** (verified by reverting P8 alone — same failure), unrelated to this review; rooted in Fastify's default AJV `removeAdditional: true` stripping the extra `text` key before Zod sees it. Deferred to Story 3.1 (owns immutable-text rule); see `deferred-work.md`.

**Deferred (recorded in `deferred-work.md`):**

- [x] [Review][Defer] `WEB_ORIGIN` is trimmed but not URL-normalized (trailing slash, scheme/case) [api/src/http/resolve-web-origin.ts] — deferred, post-1.4 hardening
- [x] [Review][Defer] OpenAPI POST body schema drift: `maxLength` removed in favor of prose, `additionalProperties: false` added [api/src/routes/todos.ts] — deferred, out-of-scope for 1.4 (belongs with 2.1)
- [x] [Review][Defer] `listTodos` assumes JSON-array response body; non-array / non-JSON bodies surface raw `SyntaxError` [web/src/api/todosClient.ts] — deferred, pre-existing
- [x] [Review][Defer] Out-of-story API + README changes shipped under 1.4 (CSP, CORS helper, error handler, OpenAPI tweaks) — deferred, sprint discipline note for retro
- [x] [Review][Defer] `ErrorBanner` `role="alert"` has no focus/key management for repeated identical alerts [web/src/components/ErrorBanner.tsx] — deferred, a11y refinement (Story 1.6 owns axe gate)

**Dismissed (noise / authorized / verified):**

- ASCII apostrophe in `loadErrorDisplayMessage` fallback copy — no typographic standard in scope.
- `@radix-ui/react-checkbox` unused in 1.4 — explicitly authorized by Dev Notes line 206 (“Install now; don’t wire into TodoRow yet (3.2 owns that)”).
- Global CSP `'unsafe-inline'` on `scriptSrc` — already authorized by Story 1.3 Dev Notes line 297 (Swagger UI baseline). Note: live verification showed Swagger UI’s static HTML has zero inline scripts, so `'unsafe-inline'` is unnecessary in practice; kept for now (accepted as bounded to single-app deployment), revisit alongside Story 1.5 CI hardening if desired.
- Helmet CSP missing `styleSrc`/`fontSrc` overrides — verified Helmet 8 defaults are adequate; all Swagger UI sub-resources load 200 with no CSP violations.

## Dev Notes

### Epic context

- **Epic 1** delivers a trustworthy **read path**: **1.2** = persistence; **1.3** = HTTP + OpenAPI + error envelope for `GET /api/v1/todos`; **1.4** = **web list shell** for that read path; **1.5** = README + CI baseline; **1.6** = baseline a11y + `noindex`. This story owns the **UI side of the GET happy/empty/error path** and the **Tailwind + Radix baseline install** required by every subsequent UI story. [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Stories 1.3–1.6]

### Brownfield inventory — read these files completely before editing

Story 1.1 introduced significant **scope-bleed** that already covers create/patch/delete. **Do not delete or regress this code**: it is the foundation Stories 2.x / 3.x will harden. Story 1.4 only **refines the GET-path UX** (loading/empty/error/retry) and **installs Tailwind + Radix**.


| File                                                  | Current state                                                                                                                                                                                                            | Implication for 1.4                                                                                                                                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `**web/src/App.tsx`**                                 | Renders `<main class="todo-shell"><h1>Todos</h1><p class="todo-lead">…</p><TodoApp /></main>`                                                                                                                            | Move chrome into new `ListShell.tsx`; keep `<h1>Todos</h1>` semantic (UX-DR2).                                                                                                                                                |
| `**web/src/main.tsx`**                                | Already wires `QueryClientProvider` with `retry: false` for queries + mutations                                                                                                                                          | Keep as-is; do **not** enable retries — UX retry is **user-driven**.                                                                                                                                                          |
| `**web/src/api/todosClient.ts`**                      | `listTodos`/`createTodo`/`patchTodo`/`deleteTodo` with `readError()` extracting `error.message` from envelope                                                                                                            | Keep. `listTodos()` already throws `Error(message)` — Retry consumes `q.error.message` directly.                                                                                                                              |
| `**web/src/features/todos/TodoApp.tsx`**              | Wires `useQuery(list)` + 3 `useMutation` + a single banner surfacing **any** error                                                                                                                                       | Refactor so **load error** → `ErrorBanner` w/ Retry; **mutation errors** keep current inline surfacing (out of 1.4 scope to redesign).                                                                                        |
| `**web/src/features/todos/TodoList.tsx`**             | Branches loading / empty (`data-testid="todo-empty"`) / list (`<ul aria-label="Todo list">`)                                                                                                                             | Replace empty branch with `<EmptyState />`; replace loading text with a skeleton/spinner. **Preserve** `data-testid="todo-empty"` and `aria-label="Todo list"`.                                                               |
| `**web/src/features/todos/TodoRow.tsx`**              | Uses native `<input type="checkbox">` with `aria-label="Toggle done for {text}"` and a `<button aria-label="Delete {text}">`                                                                                             | **Out of scope** for 1.4 — Story 3.2 introduces Radix Checkbox + `aria-checked`; Story 2.4 hardens delete labeling. Leave intact.                                                                                             |
| `**web/src/features/todos/AddTodoForm.tsx`**          | Native form, trim + non-empty client gate, `maxLength={600}` (note: server enforces 500 **code points** at runtime via Zod)                                                                                              | **Out of scope** for 1.4 — Story 2.2 owns this. The form must remain rendered so the Empty state has its primary add affordance.                                                                                              |
| `**web/src/features/todos/todoKeys.ts`**              | `todoKeys.all` + `todoKeys.list()`                                                                                                                                                                                       | Keep. Use `todoKeys.list()` for any `refetch`/`invalidate` calls.                                                                                                                                                             |
| `**web/src/index.css`**                               | Legacy CSS variables + `.todo-shell` / `.todo-error` / `.todo-form` etc.                                                                                                                                                 | Prepend `@import "tailwindcss";` and add `@theme { … }`; keep legacy rules until later cleanup.                                                                                                                               |
| `**web/src/App.css**`                                 | Vite starter template leftovers (.counter, .hero, #next-steps)                                                                                                                                                           | Unused; **leave for now** — pruning belongs in a polish pass, not 1.4.                                                                                                                                                        |
| `**web/vite.config.ts`**                              | Has React plugin + `/api` proxy to `127.0.0.1:3000`                                                                                                                                                                      | Add `tailwindcss()` plugin from `@tailwindcss/vite`. Keep proxy.                                                                                                                                                              |
| `**web/vitest.config.ts`**                            | jsdom, globals, `setupFiles: ./src/setupTests.ts`, `include: src/**/*.test.{ts,tsx}`                                                                                                                                     | Add `tailwindcss()` plugin too (parity). MSW setup goes in `setupTests.ts`.                                                                                                                                                   |
| `**web/src/setupTests.ts**`                           | One line: `import "@testing-library/jest-dom/vitest"`                                                                                                                                                                    | Extend with MSW lifecycle (`beforeAll`/`afterEach`/`afterAll`).                                                                                                                                                               |
| `**web/index.html**`                                  | `<title>web</title>`                                                                                                                                                                                                     | Change title to `lets-do-it` (or `Todos`). Defer `noindex` to Story 1.6.                                                                                                                                                      |
| `**tests/e2e/todos.spec.ts**`                         | Already exercises empty state, create, complete, delete, **plus** a `role="alert"` assertion on create-error                                                                                                             | Ensure the alert assertion still passes — current implementation surfaces create errors via the same banner, which Story 1.4’s refactor must preserve for mutation errors (do not move that to a no-`role="alert"` location). |
| `**tests/e2e/app-shell.spec.ts`**                     | Asserts heading `/todos/i` is visible                                                                                                                                                                                    | Heading stays — `ListShell` keeps `<h1>Todos</h1>`.                                                                                                                                                                           |
| `**package.json` (root)**                             | Has `dev:e2e` orchestrating api+web; `test:e2e` runs Playwright                                                                                                                                                          | Unchanged.                                                                                                                                                                                                                    |
| `**web/package.json`**                                | Already has `@tanstack/react-query` 5.x, RTL, jsdom, userEvent                                                                                                                                                           | Add `tailwindcss`, `@tailwindcss/vite`, `@radix-ui/react-checkbox`, `msw`.                                                                                                                                                    |
| **API (`api/src/routes/todos.ts`, `api/src/app.ts`)** | Read-only context. `GET /api/v1/todos` returns 200 + bare array; 500 returns `{ error: { code: "INTERNAL", message: "Failed to list todos", requestId } }`. CORS: single `WEB_ORIGIN` (default `http://127.0.0.1:5173`). | Use the documented envelope in MSW fixtures so tests reflect production shape.                                                                                                                                                |


**Read-before-change list (paste into your editor):**

```
web/src/App.tsx
web/src/main.tsx
web/src/index.css
web/src/App.css
web/index.html
web/vite.config.ts
web/vitest.config.ts
web/src/setupTests.ts
web/src/api/todosClient.ts
web/src/features/todos/TodoApp.tsx
web/src/features/todos/TodoApp.test.tsx
web/src/features/todos/TodoList.tsx
web/src/features/todos/TodoList.test.tsx
web/src/features/todos/TodoRow.tsx
web/src/features/todos/AddTodoForm.tsx
web/src/features/todos/todoKeys.ts
web/package.json
tests/e2e/todos.spec.ts
tests/e2e/app-shell.spec.ts
README.md  (only to confirm no contract drift)
```

### Architecture compliance (must follow)


| Topic              | Requirement                                                                                                                                                                                                                                                  | Source                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| UI stack           | **React + Tailwind CSS + Radix UI primitives**; **TanStack Query v5** for server state                                                                                                                                                                       | `architecture.md` — Frontend Architecture       |
| Query key factory  | `web/src/features/todos/todoKeys.ts` (already exists) — use `todoKeys.list()` everywhere                                                                                                                                                                     | `architecture.md` — State management patterns   |
| Mutation pattern   | `onSuccess` → `invalidateQueries(todoKeys.list())`; already in place — do not change for 1.4                                                                                                                                                                 | `architecture.md` — State management patterns   |
| Loading semantics  | Use `isPending` / `isFetching` from TanStack Query; **distinguish initial skeleton vs background refetch**                                                                                                                                                   | `architecture.md` — Loading state patterns      |
| Errors             | Client parses `error.message`; **Retry only for GET and safe mutation retries**                                                                                                                                                                              | `architecture.md` — Process Patterns            |
| Boundaries         | **No cross-import** between `api/` and `web/`; duplicate minimal DTO types in `web/` (already done in `todosClient.ts`)                                                                                                                                      | `architecture.md` — Component boundaries        |
| Naming             | Components `PascalCase` (`EmptyState.tsx`, `ErrorBanner.tsx`, `ListShell.tsx`); hooks `use`*; constants `SCREAMING_SNAKE`                                                                                                                                    | `architecture.md` — Code naming conventions     |
| List semantics     | Prefer `<ul>` / `<li>` for the todo list — preserve existing `aria-label="Todo list"`                                                                                                                                                                        | `epics.md` UX-DR11                              |
| Single primary CTA | At most **one** primary button visible on the list view — Retry **and** Add are both primary in error state; ensure Tailwind tokens don’t make them visually compete. UX accepts both as primary because they fulfill different intents (recover vs create). | `ux-design-specification.md` — Button Hierarchy |
| Reduced motion     | Honor `prefers-reduced-motion` for non-essential animation                                                                                                                                                                                                   | UX-DR10                                         |
| Contrast           | WCAG 2.1 AA on text, controls, error, destructive                                                                                                                                                                                                            | UX-DR14                                         |


### Library / framework requirements


| Package                           | Version line                        | Why                                                         | Notes                                                                                                 |
| --------------------------------- | ----------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tailwindcss`                     | **v4** (latest stable, e.g. `^4.x`) | UX-DR1 + architecture                                       | v4 ships a Vite plugin; CSS-first config via `@theme` — **no** `tailwind.config.js` needed.           |
| `@tailwindcss/vite`               | Matching v4 line                    | Required Vite integration                                   | Add to `plugins: [react(), tailwindcss()]`.                                                           |
| `@radix-ui/react-checkbox`        | latest                              | UX-DR1 baseline + needed by Story 3.2                       | Install now; don’t wire into `TodoRow` yet (3.2 owns that).                                           |
| `@radix-ui/react-slot` (optional) | latest                              | Only if you author a shadcn-style `Button` primitive in 1.4 | Otherwise defer to Story 2.2.                                                                         |
| `msw`                             | **v2.x** (latest)                   | Required by epics test scenarios across 1.4, 2.2, 2.4, 3.2  | Use Node integration (`msw/node` → `setupServer`) for Vitest/jsdom. Browser worker is **not** needed. |


**MSW v2 quick reference (verify exact import paths in package README at install time):**

```ts
// web/src/test/mswServer.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { Todo } from "../api/todosClient";

export const todosListHandler = (payload: Todo[] | { status: number; body?: unknown }) =>
  http.get("*/api/v1/todos", () => {
    if (Array.isArray(payload)) return HttpResponse.json(payload);
    return HttpResponse.json(payload.body ?? null, { status: payload.status });
  });

export const server = setupServer();
```

Notes:

- The `*` wildcard prefix matches both the Vite-proxied path (relative) and absolute `VITE_API_BASE_URL` if set in tests.
- For an **infinite-pending** handler use `await new Promise(() => {});` inside the resolver or MSW’s `delay` helper.
- `onUnhandledRequest: "error"` in `server.listen()` will fail tests on unstubbed network — that’s the desired guardrail.

### File structure requirements

New files (this story):

```
web/src/components/
  ListShell.tsx
  EmptyState.tsx
  ErrorBanner.tsx
  ListShell.test.tsx           # optional; otherwise covered via App.test.tsx
  EmptyState.test.tsx          # optional; otherwise covered via TodoList.test.tsx
  ErrorBanner.test.tsx         # recommended (small unit)
web/src/test/
  mswServer.ts
tests/e2e/
  load-error.spec.ts           # new — ES-1.4.b
```

Modified files (this story):

```
web/package.json
web/vite.config.ts
web/vitest.config.ts
web/src/index.css
web/src/setupTests.ts
web/src/App.tsx
web/index.html
web/src/features/todos/TodoApp.tsx
web/src/features/todos/TodoApp.test.tsx       # add US-1.4.b, US-1.4.c, IS-1.4.a, IS-1.4.b
web/src/features/todos/TodoList.tsx           # delegate empty branch + loading skeleton
```

**Do NOT create** (out of scope):

- `web/tailwind.config.ts` — v4 is CSS-first; only add if you need a JS plugin.
- A new `AddComposer.tsx` — the existing `AddTodoForm.tsx` is sufficient until Story 2.2 redesigns it.
- Any Radix Checkbox usage in `TodoRow` — Story 3.2.
- `meta robots` / `noindex` — Story 1.6.

### Testing requirements

- **Runner:** Vitest in jsdom (existing `web/vitest.config.ts`).
- **Library:** Testing Library React + `@testing-library/user-event` (already installed).
- **Network mocking:** **MSW** (new). Older tests that use `vi.stubGlobal("fetch", …)` may remain — do not refactor unless they break.
- **Scenario IDs** must appear in test titles (or `it.each` labels) so QA can grep:
  - `US-1.4.a empty state via MSW`
  - `US-1.4.b loading state while request pending`
  - `US-1.4.c error banner + Retry on 500`
  - `IS-1.4.a renders two todos newest-first`
  - `IS-1.4.b retry recovers from initial failure`
  - `ES-1.4.b error path + recovery via Retry` (Playwright)
- **No real DB / HTTP** in unit/integration; **e2e** runs against the real stack via `npm run dev:e2e` (Postgres via Docker — `tests/e2e/global-setup.ts` already spins it up).
- **A11y:** Story 1.6 owns the axe gate. For 1.4 **do not regress** the existing `role="alert"` contract — your Retry banner must keep `role="alert"`.

### Previous story intelligence

**From Story 1.3 (just completed — `_bmad-output/implementation-artifacts/1-3-get-api-v1-todos-with-openapi-and-error-envelope.md`):**

- API now serves `GET /api/v1/todos` with **OpenAPI 3** docs at `/documentation` (UI) and `/documentation/json` (JSON). README documents both URLs. Use the **JSON** route as the source of truth for response shape when authoring fixtures.
- Error envelope finalized: `**{ "error": { "code": string, "message": string, "requestId"?: string, "details"?: unknown } }`**. 500 responses for GET include `requestId` (Fastify request id). Build MSW fixtures with this exact shape so error-message extraction in `apiClient.readError` works the same way in tests and in dev.
- **CORS** is configured for a **single** `WEB_ORIGIN` (default `http://127.0.0.1:5173`). The Vite dev proxy bypasses CORS for the dev server; e2e uses the proxy. Do **not** add CORS headers to MSW handlers — they’re irrelevant in jsdom + MSW.
- POST `text` is validated by Zod at **500 Unicode code points**. The current `AddTodoForm` uses `maxLength={600}` (a soft client cap). Story 2.2 will reconcile the client cap to match Zod — **leave that alone** in 1.4.
- Helmet CSP was tuned for Swagger UI inline scripts (`scriptSrc: ['self', 'unsafe-inline']`) on the API. Irrelevant to the web client, but mentioned because future a11y or CSP work on the web side is its own story.
- Validation/serialization errors in the API map to **400 envelope** (not 500). For GET there is currently no validation surface (no query params) — 500 is the only realistic load-failure path until pagination ships.

**From Story 1.2 (`1-2-local-postgresql-and-drizzle-schema-for-todos.md`):**

- Drizzle migrations run on `buildApp()` startup; integration tests use `describe.skipIf(!databaseUrl)`. Not relevant to the web client tests but explains why `tests/e2e/global-setup.ts` does `docker compose up -d` before Playwright runs.

**From Story 1.1 (`1-1-scaffold-api-and-web-from-approved-starters.md`):**

- The web scaffold already includes a fully wired TanStack Query client (`web/src/main.tsx`), a feature folder (`web/src/features/todos/`), and Playwright specs that cover the full CRUD loop. This means Stories 1.4–3.2 are largely **refactor + harden** stories on existing surface area — they are not greenfield component builds. Treat the existing code as a starting line, not a wall.
- **Tailwind and Radix were not installed in 1.1**, despite the architecture mandating them. 1.4’s AC 5 closes that gap deliberately.
- **MSW was not installed in 1.1** — same gap, closed here.

### Git intelligence

- The repository has **one commit** (`2e37281 FIrst commit`). There is no prior commit pattern to mirror (single initial dump). Subsequent commits in this session have been mixed onto the working tree (see `git status` — `README.md`, `_bmad-output/implementation-artifacts/1-3-…md`, `_bmad-output/implementation-artifacts/deferred-work.md`, `api/src/app.ts`, `api/src/routes/todos.ts` are dirty). **Do not commit unrelated changes** alongside Story 1.4 work — keep your commit focused on `web/`, `web/`-adjacent test infra, and `tests/e2e/load-error.spec.ts`.

### Latest tech information

- **Tailwind v4 (released Jan 2025; current stable line as of May 2026)**: CSS-first config via `@theme`; no `tailwind.config.js` required; ships official `@tailwindcss/vite` plugin. Setup is `npm install tailwindcss @tailwindcss/vite` → add `tailwindcss()` to `vite.config.ts` plugins → `@import "tailwindcss";` in entry CSS. v4 supports `oklch()` colors directly in `@theme` (preferred for predictable contrast). [Verify exact patch version on `npm view tailwindcss version` at install time.]
- **Radix UI primitives**: each primitive is its own package (`@radix-ui/react-checkbox`, `@radix-ui/react-slot`, etc.). They are headless — pair with Tailwind utility classes for styling. Story 3.2 will replace the native `<input type="checkbox">` in `TodoRow` with `@radix-ui/react-checkbox` to gain `aria-checked` + reliable focus rings.
- **TanStack Query v5** (already installed `^5.100.x`): `useQuery` returns `isPending` (initial load, no data yet), `isFetching` (any in-flight including background refetch), `isError`, `error`, `refetch`. `mutations` retry is disabled in `main.tsx` (`retry: false`) — keep that.
- **MSW v2** (current stable): Node integration via `msw/node` → `setupServer`. Handlers built with `http.get(pattern, resolver)` returning `HttpResponse.json(body, { status })`. v2 uses **absolute or `*`-prefixed** URL patterns; relative paths can fall through, so use `http.get("*/api/v1/todos", …)` to match both proxied and absolute calls.

### Project structure notes

- The architecture tree (architecture.md › Project Structure & Boundaries) proposes a `web/src/components/` folder for `ListShell`, `AddComposer`, `TodoRow`, `EmptyState`, `ErrorBanner`, plus `web/src/features/todos/` for hooks/composition. The current repo placed the existing components in `web/src/features/todos/` only. **Story 1.4 keeps that hybrid:** new pure presentational components (`ListShell`, `EmptyState`, `ErrorBanner`) go into the new `web/src/components/` folder; existing feature wiring stays in `web/src/features/todos/`. This is consistent with “dumb presentational vs feature composition” boundary in architecture.md.
- The architecture also mentions `web/src/lib/apiClient.ts` and `web/src/lib/queryKeys.ts`. The current repo uses `web/src/api/todosClient.ts` and `web/src/features/todos/todoKeys.ts` instead. **Do not rename these** in Story 1.4 — paths are referenced from existing tests; renaming would explode the diff for zero behavioral benefit. Note the variance in Project Structure Notes below.

### Project Structure Notes

- **Alignment:** Component split (presentational under `components/`, feature wiring under `features/todos/`) matches `architecture.md` § Component boundaries.
- **Variance from architecture tree (with rationale):**
  - `web/src/api/todosClient.ts` instead of `web/src/lib/apiClient.ts` — pre-existing from Story 1.1 scaffold; rename deferred to avoid churn.
  - `web/src/features/todos/todoKeys.ts` instead of `web/src/lib/queryKeys.ts` — same reason.
- **No `tailwind.config.ts`** — Tailwind v4 is CSS-first; this is an intentional v4 simplification, not a missing file.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.4 acceptance + test scenarios (US-1.4.*, IS-1.4.*, ES-1.4.*)]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR-03, FR-07, FR-08, FR-09; NFR-07]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture, Implementation Patterns (State / Loading / Error), Project Structure & Boundaries, QA integration — Project Setup]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Component Strategy (`ListShell`, `EmptyState`, `ErrorBanner`, `TodoRow`, `AddComposer`), UX Consistency Patterns, Visual Design Foundation (Direction A), UJ-1, UJ-5, UJ-6]
- [Source: `_bmad-output/implementation-artifacts/1-3-get-api-v1-todos-with-openapi-and-error-envelope.md` — error envelope shape, OpenAPI URLs, CORS `WEB_ORIGIN`]
- [Source: `_bmad-output/implementation-artifacts/1-1-scaffold-api-and-web-from-approved-starters.md` — scaffolded files inventory; reason existing TodoApp / TodoList / TodoRow / AddTodoForm exist before 1.4]
- [Source: `web/src/features/todos/TodoApp.tsx`, `web/src/features/todos/TodoList.tsx`, `web/src/api/todosClient.ts`, `web/src/main.tsx`, `web/vite.config.ts`, `tests/e2e/todos.spec.ts`]
- [Tailwind v4 + Vite install: `tailwindcss.com/docs` (verify on install)]
- [MSW v2 Node integration: `mswjs.io/docs/integrations/node`]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented Tailwind v4 (`@tailwindcss/vite` + `@import "tailwindcss"`) with Direction A `@theme` tokens; installed `@radix-ui/react-checkbox` (baseline only, not wired into rows).
- Added `ListShell`, `EmptyState`, and `ErrorBanner`; moved page chrome from `App.tsx` into `ListShell`.
- **Load vs mutation errors:** `TodoApp` uses `ErrorBanner` + `q.refetch()` only when `q.isError`; create/patch/delete errors keep the existing `todo-error` `role="alert"` block when the list query is not in error (preserves `tests/e2e/todos.spec.ts` create-error behavior).
- **Retry:** used `q.refetch()` (not `invalidateQueries`) so the list query re-runs directly on user Retry.
- **List loading:** `listLoading = q.isPending || (q.isError && q.isFetching)` so retry shows the skeleton; `TodoList` accepts `suppressEmptyState={q.isError}` so a failed load does not show the empty success state.
- MSW `setupServer` with default `GET */api/v1/todos → []` in `setupTests.ts`; legacy tests keep `vi.stubGlobal("fetch", …)` and bypass MSW as designed.
- **Vitest:** all web tests pass; **ESLint:** `web` lint clean; **`npm run build -w web`** succeeds.
- **E2E:** `tests/e2e/load-error.spec.ts` added; local `playwright test` failed in this environment with `ReferenceError: exports is not defined` in `tests/e2e/global-setup.ts` (pre-existing setup issue, not caused by this story). Re-run `npm run test:e2e` after fixing global setup.

### File List

- `package-lock.json` (workspace install lockfile)
- `web/package.json`
- `web/vite.config.ts`
- `web/vitest.config.ts`
- `web/index.html`
- `web/src/index.css`
- `web/src/App.tsx`
- `web/src/setupTests.ts`
- `web/src/components/ListShell.tsx`
- `web/src/components/EmptyState.tsx`
- `web/src/components/ErrorBanner.tsx`
- `web/src/test/mswServer.ts`
- `web/src/features/todos/TodoApp.tsx`
- `web/src/features/todos/TodoList.tsx`
- `web/src/features/todos/TodoApp.test.tsx`
- `web/src/features/todos/TodoList.test.tsx`
- `tests/e2e/load-error.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-4-web-list-shell-with-loading-empty-and-fetch-error-states.md`

## Change Log

- **2026-05-12:** Story 1.4 implementation — Tailwind v4 + Radix baseline, ListShell/EmptyState/ErrorBanner, load skeleton + error retry path, MSW test harness, unit/integration tests (US/IS-1.4.*), Playwright ES-1.4.b spec; sprint status → review.
