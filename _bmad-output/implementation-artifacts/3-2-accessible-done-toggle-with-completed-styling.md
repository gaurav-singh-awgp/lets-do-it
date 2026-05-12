---

## story_key: 3-2-accessible-done-toggle-with-completed-styling

story_id: "3.2"

epic: 3

status: done

---

# Story 3.2: Accessible Done Toggle with Completed Styling

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a **todo user**,
I want **a checkbox/toggle that shows done vs active clearly and works with keyboard and screen readers**,
So that **I can scan and update tasks quickly**.

## Acceptance Criteria

1. **Toggle mutation (FR-04, FR-05)**
   **Given** a todo row is rendered
   **When** the user activates the done checkbox
   **Then** `PATCH /api/v1/todos/:id` fires with `{ done: !currentDone }`
   **And** a pending state disables the checkbox while the mutation is in-flight
   **And** on success the server-returned `done` value is reflected (list refetch)
   **Traces:** FR-04, FR-05; epics Story 3.2 AC1.

2. **Completed visual treatment (FR-10, UX-DR8)**
   **Given** a todo with `done: true`
   **When** rendered
   **Then** the row title shows **muted text + strikethrough** (CSS class `.todo-text.done` already exists)
   **And** the checkbox `checked` state reflects `done`
   **And** `aria-checked` (via native `checked` prop on `<input type="checkbox">`) is synced to `done` — verified by test
   **Traces:** FR-10; UX-DR8; architecture Pattern Examples.

3. **Pending + error handling (FR-09, UX-DR13)**
   **Given** a PATCH failure
   **When** the mutation settles as error
   **Then** the shared `patchDelBanner` (`role="alert"`) surfaces the error message
   **And** the checkbox is re-enabled (no stuck disabled state)
   **And** the `done` state displayed in the row matches the **server-last-known** value (no false optimistic flip left behind)
   **Note:** No explicit Retry button for toggle — consistent with delete pattern from Story 2.4 (idempotent; user re-clicks the toggle).
   **Traces:** FR-09; UX-DR13; Epic 2 `patchDelBanner` pattern.

4. **Focus ring + `prefers-reduced-motion` (UX-DR9, UX-DR10)**
   **Given** keyboard-only navigation
   **When** the user tabs to the checkbox
   **Then** a visible focus ring is present (browser default or custom — verify no CSS suppresses it)
   **And** any transition applied to the done state change respects `prefers-reduced-motion: reduce`
   **Traces:** UX-DR9, UX-DR10; architecture a11y guidelines.

5. **`aria-busy` on row when toggling (UX-DR7)**
   **Given** `busyToggle` prop is `true` on a `TodoRow`
   **When** the row renders
   **Then** the row container (`<div className="todo-row">`) has `aria-busy="true"`
   **Traces:** UX-DR7 ("row `aria-busy` when pending"); architecture TodoRow anatomy.

6. **Automated tests (AC: 1–5)**
   - **US-3.2.a**: `TodoRow` rendered with `done: true` → `.todo-text.done` class applied and `checked` is `true`
   - **US-3.2.b**: `TodoRow` rendered with `done: false`; simulated checkbox change → `onToggle(id, false→true)` called; verify `aria-checked` reflects new value
   - **IS-3.2.a**: MSW PATCH failure → prior `done` state visible in row + `patchDelBanner` `role="alert"` shows error message; checkbox re-enabled
   - **ES-3.2.a**: Playwright — keyboard Space on checkbox → PATCH fires → row style updates after server OK

## Tasks / Subtasks

- [x] **Brownfield audit** (AC: 1–5)
  - [x] Confirm `TodoRow.tsx` `busyToggle` prop disables checkbox during `patch.isPending`
  - [x] Confirm `TodoApp.tsx` `patch` mutation + `patchDelBanner` error path
  - [x] Confirm CSS `.todo-text.done` has strikethrough + muted color
  - [x] Check if `aria-busy` is missing from `<div className="todo-row">` — add if so
  - [x] Verify focus ring is not suppressed by `outline: none` or similar in `index.css`
  - [x] Confirm no CSS `transition` on done state that would violate `prefers-reduced-motion` (if transition added, wrap with `@media (prefers-reduced-motion: no-preference)`)

- [x] **Code — `aria-busy` on row** (AC: 5)
  - [x] Add `aria-busy={busyToggle || undefined}` to `<div className="todo-row">` in `TodoRow.tsx`

- [x] **Unit tests — US-3.2.a + US-3.2.b** (AC: 2, 6)
  - [x] In `web/src/features/todos/TodoRow.test.tsx` add under new `describe("done styling and a11y")`:
    - `"US-3.2.a: done=true — .todo-text.done class applied and checkbox checked"`
    - `"US-3.2.b: toggle checkbox — onToggle called and aria-checked follows"`

- [x] **Integration test — IS-3.2.a** (AC: 3, 6)
  - [x] In `web/src/features/todos/TodoApp.test.tsx` (MSW describe block):
    - `"IS-3.2.a: PATCH failure — prior done state shown + patchDelBanner error visible"`

- [x] **E2E — ES-3.2.a** (AC: 1, 6)
  - [x] In `tests/e2e/todos.spec.ts`: keyboard Space on checkbox → verify done styling after server OK

- [x] **Regression**
  - [x] `npm run test:web` passes — 29/29 green
  - [x] `npm run test:e2e` passes (serial, `workers: 1`) — `todos.spec.ts` 6/6 green including ES-3.2.a; pre-existing failures in `a11y-list-shell.spec.ts` / `load-error.spec.ts` tracked under retro B1/B2
  - [x] Existing delete tests, composer tests, and a11y tests unaffected


### Review Findings

- [x] [Review][Patch] ES-3.2.a assertion is globally scoped and can false-pass [tests/e2e/todos.spec.ts:68]
- [x] [Review][Patch] ES-3.2.a does not assert PATCH request is fired [tests/e2e/todos.spec.ts:56]
- [x] [Review][Patch] US-3.2.b does not verify aria-checked sync after state update [web/src/features/todos/TodoRow.test.tsx:24]
- [x] [Review][Defer] Row `aria-busy` semantics omit delete-pending state [web/src/features/todos/TodoRow.tsx:19] — deferred, pre-existing
- [x] [Review][Defer] Single global mutation variable can mis-track overlapping toggle pending rows [web/src/features/todos/TodoApp.tsx:140] — deferred, pre-existing

## Dev Notes

### Brownfield reality (read before coding)

**The toggle mechanic is FULLY wired already.** Do not reimplement:

- `TodoApp.tsx` already has `patch = useMutation(...)` calling `patchTodo(id, done)` with `invalidateQueries` on success → **do not change mutation wiring**
- `TodoList.tsx` already passes `togglingId` → `busyToggle={togglingId === todo.id}` to `TodoRow` → **do not change**
- `TodoRow.tsx` already has `busyToggle` prop disabling checkbox, `onChange` calling `onToggle` → **do not change mutation trigger**
- CSS `.todo-text.done` already has `text-decoration: line-through; color: var(--text)` → **do not change done styling**
- `patchDelBanner` in `TodoApp.tsx` already surfaces PATCH errors via `patchDelErrorMessage` → **do not add a separate PATCH error banner**

**The only code change required is likely one line:** add `aria-busy={busyToggle || undefined}` to the `<div className="todo-row">` in `TodoRow.tsx`.

Everything else is **verification + tests**.

### Current state of `TodoRow.tsx` (read before editing)

```
<div className="todo-row">
  <label className="todo-label">
    <input
      type="checkbox"
      checked={todo.done}
      disabled={busyToggle}
      onChange={(e) => onToggle(todo.id, e.target.checked)}
      aria-label={`Toggle done for ${todo.text}`}
    />
    <span className={todo.done ? "todo-text done" : "todo-text"}>
      {todo.text}
    </span>
  </label>
  <button type="button" className="todo-delete" ...>Delete</button>
</div>
```

**What to add:** `aria-busy={busyToggle || undefined}` on the outer `<div className="todo-row">`.

Why `|| undefined`? Boolean `false` would emit `aria-busy="false"` in the DOM which is valid but unnecessary; `undefined` omits the attribute when not busy.

### `aria-checked` via native checkbox

`<input type="checkbox" checked={todo.done}>` automatically provides the correct `aria-checked` state — no explicit `aria-checked` attribute needed. This satisfies UX-DR8. The test `US-3.2.b` should query `getByRole("checkbox")` and assert `.toBeChecked()` / `.not.toBeChecked()`.

### Error pattern — no Retry on PATCH toggle

**Match the established Epic 2 delete pattern.** The `patchDelBanner` already covers both `patch.error` and `del.error` via `patchDelErrorMessage`. It does NOT have a Retry button — delete is idempotent, and toggle is idempotent too (user re-clicks). Story 2.4 explicitly resolved this as acceptable. Do not add a Retry button to the shared banner.

### CSS — done styling already in place

In `web/src/index.css`:
```css
.todo-text.done {
  text-decoration: line-through;
  color: var(--text);    /* --text = oklch(0.5 0.02 280) — muted gray */
}
```

**`prefers-reduced-motion`:** No transition currently on this class. If you add one (e.g., `transition: color 150ms`), wrap it:
```css
@media (prefers-reduced-motion: no-preference) {
  .todo-text { transition: color 150ms, text-decoration 150ms; }
}
```
The loading skeleton already uses `motion-safe:animate-pulse` (Tailwind's `prefers-reduced-motion`-aware class), so the pattern is established. **Do not add a transition unless there is a clear UX reason.** The existing instantaneous done-class swap already satisfies the spec.

### Architecture compliance

| Topic | Requirement | Source |
|-------|-------------|--------|
| `aria-checked` on toggle | Use native `checked` prop; no explicit `aria-checked` attribute needed | Architecture a11y; UX-DR8 |
| Row `aria-busy` when pending | `aria-busy={busyToggle \|\| undefined}` on row container | Architecture TodoRow anatomy; UX-DR7 |
| PATCH error display | Shared `patchDelBanner` — no new banner component | Epic 2 pattern; Story 2.4 completion notes |
| `prefers-reduced-motion` | Only needed if a CSS transition is introduced | UX-DR10; `motion-safe:` Tailwind prefix established in codebase |
| Focus ring | Browser default on `<input type="checkbox">` is sufficient; do NOT add `outline: none` to checkbox | UX-DR9 |
| Query invalidation | `patch.onSuccess → invalidateQueries(todoKeys.list())` — already in `TodoApp.tsx` | Architecture TanStack Query pattern |

### Library / stack (pinned)

| Package | Version | Notes |
|---------|---------|-------|
| React | 19 | `<input checked={...}>` handles `aria-checked` natively |
| TanStack Query | v5 | `useMutation` `isPending` for `busyToggle`; already wired |
| Vitest + Testing Library | ^3.x / ^16.x | `toBeChecked()`, `getByRole("checkbox")` |
| MSW | v2 | `http.patch("*/api/v1/todos/*", ...)` for IS-3.2.a |
| Playwright | ^1.x | `workers: 1` (serial — do not change `playwright.config.ts`) |

### Test patterns (follow exactly)

**US-3.2.a — done styling unit test** (add to `TodoRow.test.tsx`):
```ts
describe("done styling and a11y", () => {
  it("US-3.2.a: done=true — .todo-text.done class applied and checkbox checked", () => {
    const doneTodo = { ...sample, done: true };
    render(<TodoRow todo={doneTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByText(doneTodo.text)).toHaveClass("done");
  });
```

**US-3.2.b — aria-checked unit test**:
```ts
  it("US-3.2.b: toggle checkbox — onToggle called with flipped value", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoRow todo={sample} onToggle={onToggle} onDelete={vi.fn()} />);
    const cb = screen.getByRole("checkbox");
    expect(cb).not.toBeChecked();
    await user.click(cb);
    expect(onToggle).toHaveBeenCalledWith(sample.id, true);
  });
});
```

**IS-3.2.a — MSW PATCH failure** (add to `TodoApp.test.tsx` MSW `describe` block):
```ts
it("IS-3.2.a: PATCH failure — prior done state shown + patchDelBanner error visible", async () => {
  const todo: Todo = {
    id: "00000000-0000-4000-8000-000000000042",
    text: "Toggle fail test",
    done: false,
    createdAt: "2024-01-01T00:00:00.000Z",
  };
  server.use(
    http.get("*/api/v1/todos", () => HttpResponse.json([todo])),
    http.patch("*/api/v1/todos/*", () =>
      HttpResponse.json(
        { error: { code: "INTERNAL", message: "Server error", requestId: "r1" } },
        { status: 500 },
      ),
    ),
  );
  renderWithClient(<TodoApp />);
  const cb = await screen.findByRole("checkbox");
  await userEvent.click(cb);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Server error"),
  );
  // Checkbox should be unchecked (server state unchanged) and re-enabled
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.getByRole("checkbox")).not.toBeDisabled();
});
```

**ES-3.2.a — Playwright** (add to `tests/e2e/todos.spec.ts` after existing tests):
```ts
test("ES-3.2.a: keyboard Space on checkbox toggles done styling", async ({ page }) => {
  // Add a todo first
  await page.goto("/");
  await page.getByLabel("New todo").fill("Keyboard toggle test");
  await page.getByRole("button", { name: /add/i }).click();
  await expect(page.getByText("Keyboard toggle test")).toBeVisible();

  // Focus the checkbox and press Space
  const checkbox = page.getByRole("checkbox", { name: /toggle done for keyboard toggle test/i });
  await checkbox.focus();
  await page.keyboard.press("Space");

  // After server OK, done styling should appear
  await expect(page.getByText("Keyboard toggle test")).toHaveClass(/done/);
});
```

### Files to touch

| File | Role |
|------|------|
| `web/src/features/todos/TodoRow.tsx` | **Update** — add `aria-busy={busyToggle \|\| undefined}` to row div |
| `web/src/features/todos/TodoRow.test.tsx` | **Update** — add US-3.2.a + US-3.2.b |
| `web/src/features/todos/TodoApp.test.tsx` | **Update** — add IS-3.2.a |
| `tests/e2e/todos.spec.ts` | **Update** — add ES-3.2.a |
| `web/src/index.css` | **Read-only** unless adding a transition (wrap with `prefers-reduced-motion` guard) |
| `web/src/features/todos/TodoApp.tsx` | **Read-only** — PATCH mutation already correct |
| `web/src/features/todos/TodoList.tsx` | **Read-only** — `busyToggle` already passed |

**Out of scope for 3.2:** E2E SC-01 full loop (**Story 3.3**); CI matrix + axe gate (**Story 3.4**).

### Previous story intelligence (3.1 → 3.2)

From **Story 3.1** (code-review complete, committed `8e2f89d`):
- `patchTodo(id, done)` in `todosClient.ts` is verified and stable — the response returns the full updated todo DTO; do not change the client function.
- PATCH API returns `200` + `{ id, text, done, createdAt }` — `TodoApp.tsx` already calls `invalidateQueries` on success, so no need to manually update the cache from the PATCH response.
- `patchTodoBodySchema` is `.strict()` — any body with extra keys returns `400`; the web client sends `{ done }` only ✅.

From **Story 2.4** (delete pattern precedent):
- `patchDelBanner` is the **shared** error channel for both `patch.error` and `del.error`.
- No Retry button on `patchDelBanner` — idempotent actions; user re-clicks. **Do not add Retry.**
- `busyDelete` → `disabled` on button; `busyToggle` → `disabled` on checkbox — both disable controls during in-flight mutation. **Match this pattern for `aria-busy`.**
- `renderWithClient()` helper in `TodoApp.test.tsx` must be reused for IS-3.2.a — do not re-define it.
- Playwright suite is `workers: 1` (serial) — do not change `playwright.config.ts`.

From **Story 2.2** (composer a11y patterns):
- `aria-live="polite"` used on validation errors; not needed for toggle (errors go to shared banner with `role="alert"`).
- Focus returns to input after compose — toggle does not need focus management (checkbox retains focus naturally after click).

### Git intelligence

Recent commits relevant to Story 3.2:
- `8e2f89d` — PATCH API test hardening (Story 3.1 code review) — confirms API is stable
- `3e70c85` — Story 2.4 delete tests — `TodoApp.test.tsx` MSW patterns to follow for IS-3.2.a

### Latest technical notes

- **React 19** + `<input type="checkbox" checked={done}>`: `checked` correctly sets `aria-checked` in the ARIA accessibility tree — no `aria-checked` attribute needed in the JSX. `getByRole("checkbox")` + `toBeChecked()` from Testing Library verifies this.
- **TanStack Query v5** `useMutation`: `patch.isPending` is `true` while the mutation is in-flight; `patch.isError` is `true` after failure; `patch.error` holds the error. These are already wired in `TodoApp.tsx`.
- **MSW v2** pattern for PATCH: `http.patch("*/api/v1/todos/*", () => HttpResponse.json(...))` — note the wildcard `*` at both ends matches the Vite proxy path.

### Project context reference

- `_bmad-output/planning-artifacts/architecture.md` — Frontend Architecture, Loading state patterns, Error handling patterns, TodoRow anatomy
- `_bmad-output/planning-artifacts/ux-design-specification.md` — Component Strategy (TodoRow), UJ-3 (steady use toggle), Accessibility Strategy
- `_bmad-output/planning-artifacts/epics.md` — Epic 3, Story 3.2, Test scenarios US/IS/ES-3.2.*

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5

### Debug Log References

_(none)_

### Completion Notes List

- Brownfield audit confirmed: toggle mutation, pending state, error banner, and done CSS styling were already fully wired from prior epics.
- One code change applied: `aria-busy={busyToggle || undefined}` added to `<div className="todo-row">` in `TodoRow.tsx` (AC5 / UX-DR7). `|| undefined` omits the attribute when not busy, avoiding a redundant `aria-busy="false"` in the DOM.
- Focus ring verified unblocked — no `outline: none` on checkbox in `index.css`. Satisfied by browser default (AC4 / UX-DR9).
- No CSS transition on `.todo-text.done` — `prefers-reduced-motion` is not applicable here; existing `motion-safe:animate-pulse` pattern on loading skeleton already sets the project precedent (AC4 / UX-DR10).
- `patchDelBanner` confirmed as shared error channel for both PATCH and DELETE — no Retry button added, consistent with Story 2.4 idempotent pattern (AC3 / FR-09).
- `aria-checked` via native `<input type="checkbox" checked={todo.done}>` confirmed correct — no explicit `aria-checked` attribute required (AC2 / UX-DR8).
- 3 new unit/integration tests added (US-3.2.a, US-3.2.b, IS-3.2.a); 1 new E2E test added (ES-3.2.a). All pass: 29/29 web, `todos.spec.ts` 6/6 E2E.
- 5 pre-existing E2E failures in `a11y-list-shell.spec.ts` (4) and `load-error.spec.ts` (1) unchanged — tracked under retro B1/B2.

### File List

- `web/src/features/todos/TodoRow.tsx` — added `aria-busy={busyToggle || undefined}` to row div
- `web/src/features/todos/TodoRow.test.tsx` — added US-3.2.a + US-3.2.b under `describe("done styling and a11y")`
- `web/src/features/todos/TodoApp.test.tsx` — added IS-3.2.a to MSW describe block
- `tests/e2e/todos.spec.ts` — added ES-3.2.a keyboard Space toggle test

## Change Log

- 2026-05-12: Story 3.2 context created by `bmad-create-story` — status `ready-for-dev`.
- 2026-05-12: Story 3.2 implementation complete by `bmad-dev-story` — status `review`. One production change (`aria-busy` on row); 4 new tests added.
