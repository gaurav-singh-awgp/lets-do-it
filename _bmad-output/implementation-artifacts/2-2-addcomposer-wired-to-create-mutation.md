---

## story_key: 2-2-addcomposer-wired-to-create-mutation

story_id: "2.2"
epic: 2
status: done

---

# Story 2.2: AddComposer wired to create mutation

Status: done

Ultimate context engine analysis completed - comprehensive developer guide created

## Story

As a **todo user**,
I want **a simple field to add a todo with inline validation and clear pending state**,
So that **adding feels fast and honest**.

## Acceptance Criteria

1. **Client empty / whitespace — UX-DR6**  
   **Given** the composer is visible  
   **When** the user submits via **Enter** or **Add** with empty or whitespace-only text  
   **Then** the client does **not** call `POST`  
   **And** an **inline** validation message appears, wired with **`aria-describedby`** on the input and announced with **`aria-live="polite"`** (not silent/no-op).  
   **Traces:** FR-02; UX-DR6.

2. **Submitting state**  
   **Given** non-empty trimmed text  
   **When** `POST /api/v1/todos` is in flight  
   **Then** the composer is **disabled** and shows a **visible pending indicator** (spinner text, `role="status"`, or equivalent—not only a disabled button with no explanation).  
   **Traces:** UX-DR6; `ux-design-specification.md` “Add todo” feedback.

3. **Success — list refresh + ordering**  
   **Given** Story **2.1** complete (server returns **201** + camelCase todo)  
   **When** create succeeds  
   **Then** TanStack Query **invalidates/refetches** the list query so the new item appears **consistent with server ordering** (**`createdAt` desc** — new item at top when alone or newer than others).  
   **And** the composer **clears** the input text.  
   **Traces:** FR-01; FR-03.

4. **API / network failure — FR-09 + UX-DR13**  
   **Given** a failed create (`4xx`/`5xx`, network error, non-JSON body)  
   **When** the mutation settles as error  
   **Then** the user sees a **human-readable** error (prefer **`ApiEnvelopeError.message`** when applicable, consistent with list load handling)  
   **And** a **Retry** affordance exists that **retries the same create** with the **same trimmed text** (or re-enables submit so the user can retry without retyping—pick one pattern and document it in Dev Notes).  
   **And** the composer is **re-enabled** (not stuck disabled).  
   **Traces:** FR-09; UX-DR13.

5. **Focus behavior**  
   **After successful create**, default expectation: **focus returns to the composer** for rapid entry (matches UX journey). If you choose different focus (e.g. first new row), **document rationale** in Dev Notes and ensure tab order remains logical (**UX-DR9**: composer → list top → rows).

6. **Sticky composer (UX-DR12)**  
   **Composer** remains usable while scrolling the list on typical viewports (sticky top or bottom per architecture/UX—**document** breakpoint choice in Dev Notes; full mobile keyboard overlap verification can be **documented/manual** if not automated).

7. **Contrast / a11y baseline (UX-DR14)**  
   New composer chrome (errors, pending indicator) uses existing design tokens so **WCAG 2.1 AA** intent is preserved; run or extend **axe** coverage if the story adds new interactive/error regions.

## Tasks / Subtasks

- [x] **Brownfield audit** (AC: 1–7)  
  - [x] Read `TodoApp.tsx`, `AddTodoForm.tsx`, `todosClient.ts`, `TodoApp.test.tsx`, `tests/e2e/todos.spec.ts` and map each AC to current vs missing behavior.

- [x] **Composer UX — UX-DR6 / UX-DR12** (AC: 1, 2, 6, 7)  
  - [x] Replace silent empty submit with inline + `aria-describedby` + `aria-live="polite"`.  
  - [x] Add visible **pending** state during `create.isPending`.  
  - [x] Implement **sticky** composer layout (likely `ListShell` / wrapper in `TodoApp` or feature CSS) and note manual mobile check.

- [x] **Create mutation error + Retry** (AC: 4)  
  - [x] Extend `TodoApp` (or a small helper) so create failures surface copy consistent with `ApiEnvelopeError` / `buildResponseError` patterns.  
  - [x] Add **Retry** for failed **POST** (not only GET `ErrorBanner`).

- [x] **Success path polish** (AC: 3, 5)  
  - [x] Confirm `invalidateQueries({ queryKey: todoKeys.list() })` still runs on success; add test spy if required by **US-2.2.b**.  
  - [x] Implement/document focus return to input after success.

- [x] **Client vs server length** (FR-02 alignment)  
  - [x] Reconcile `maxLength={600}` on the input with server rule **500 Unicode code points** (trim + counter, `maxLength` adjustment, or pre-submit client check mirroring `countUnicodeCodePoints` semantics—**do not** rely on UTF-16 length alone for emoji).

- [x] **Unit / integration — web Vitest + MSW** (epic test IDs)  
  - [x] **US-2.2.a** — empty/whitespace submit → inline validation + live region update (no POST).  
  - [x] **US-2.2.b** — MSW returns **201** → composer clears + assert `queryClient.invalidateQueries` (spy) **or** equivalent observable refetch.  
  - [x] **IS-2.2.a** — MSW POST failure → error UI + Retry + composer re-enabled.

- [x] **E2E — ES-2.2.a**  
  - [x] `tests/e2e/todos.spec.ts` already has **“create todo”**; ensure it explicitly matches **SC-01** fragment (**first** todo appears at **top** after OK). Extend if the scenario is ambiguous.

- [x] **Regression**  
  - [x] `npm run test:web`, `npm run lint`; run **e2e** subset if CI expects it.  
  - [x] Do **not** break Story **1.4** / **1.6** list shell behaviors (`ErrorBanner`, loading skeleton, axe tests).

### Review Findings

- [x] [Review][Patch] Duplicate create race on rapid resubmit/retry [web/src/features/todos/AddTodoForm.tsx:31]
- [x] [Review][Patch] Focus can be lost after failed create; recovery flow degrades for keyboard users [web/src/features/todos/AddTodoForm.tsx:38]
- [x] [Review][Patch] Repeated identical validation submits may not be re-announced [web/src/features/todos/AddTodoForm.tsx:72]
- [x] [Review][Patch] Submit handler swallows unexpected runtime errors [web/src/features/todos/AddTodoForm.tsx:41]
- [x] [Review][Patch] “Unicode code points” test uses ASCII-only payload and misses surrogate-pair edge cases [web/src/features/todos/TodoApp.test.tsx:248]
- [x] [Review][Patch] Sprint tracker `last_updated` regresses backward in time [/_bmad-output/implementation-artifacts/sprint-status.yaml:38]

## Dev Notes

### Epic cross-story context

- **2.1** delivered **POST** + Zod + OpenAPI + integration tests — **preserve** response shape `{ id, text, done, createdAt }` and **400** validation envelope.  
- **2.3–2.4** add delete API + row UI; **2.2** must not block delete/toggle wiring already present in `TodoApp` for e2e, but **create** is the acceptance scope. If **PATCH**/**DELETE** still **404** against a minimal API, coordinate with backlog stories—**do not** remove working UI without product direction.

### Brownfield inventory — current code (read before editing)

| File | Current behavior | Gap vs AC |
|------|------------------|-----------|
| `web/src/features/todos/TodoApp.tsx` | `useMutation` → `createTodo`, `onSuccess` → `invalidateQueries`; `mutationErrorMessage` in `role="alert"` banner | No **Retry** for create; banner may not distinguish load vs mutation clearly |
| `web/src/features/todos/AddTodoForm.tsx` | Trims; **early return** if empty; disables submit when empty trim or `submitting`; clears text after `onCreate` | **No** inline validation / `aria-live` / `aria-describedby`; **no** visible pending indicator beyond disabled controls; `maxLength={600}` vs **500 code points** |
| `web/src/api/todosClient.ts` | `createTodo` POST + `ApiEnvelopeError` | OK; reuse for messages |
| `web/src/features/todos/todoKeys.ts` | `todoKeys.list()` | Use in tests for invalidate spy |
| `web/src/test/mswServer.ts` | Default **GET** `[]` only | Tests must `server.use` **POST** handlers per scenario |
| `web/src/features/todos/TodoApp.test.tsx` | Legacy fetch stub includes create path; MSW block covers **1.4** scenarios | Add **US-2.2.\*** / **IS-2.2.a** under **MSW** `describe` |

### Technical requirements (guardrails)

| Topic | Requirement |
|-------|-------------|
| TanStack Query | **v5** — `useMutation`, `useQuery`, `useQueryClient`; mutations `retry: false` in tests (match `TodoApp.test.tsx` harness). |
| MSW | **v2** `http.post("*/api/v1/todos", …)` for create scenarios; use `HttpResponse.json` with correct status codes. |
| a11y | Inline errors: **`aria-live="polite"`** for validation; **`aria-describedby`** linking input ↔ error id; pending: **`role="status"`** or live region as appropriate. |
| Error copy | Prefer same **`ApiEnvelopeError`** handling as `loadErrorDisplayMessage` for API-authored messages on **create**. |

### Architecture compliance

| Topic | Source |
|-------|--------|
| Server state / mutations | `architecture.md` — TanStack Query, invalidation after mutations |
| `web/` layout | `architecture.md` — `src/features/todos/`, components split |
| POST retry policy | `architecture.md` notes **POST** retry and duplicates — Retry must **not** silently double-create; either single explicit retry or user-confirmed pattern. |

### Library / framework requirements

- **React 19 + Vite**, **TanStack Query v5**, **MSW** for web tests, **Vitest** + **Testing Library** + **user-event** — match existing `web/package.json`.

### File structure requirements

**Expected touch:**

```
web/src/features/todos/AddTodoForm.tsx
web/src/features/todos/TodoApp.tsx
web/src/features/todos/TodoApp.test.tsx
web/src/components/ListShell.tsx   (optional — only if sticky layout lives here)
web/src/index.css or feature CSS   (optional — sticky / composer chrome)
tests/e2e/todos.spec.ts              (if ES-2.2.a needs tightening)
```

**Read-only unless story scope expands:**

```
web/src/api/todosClient.ts
web/src/features/todos/TodoList.tsx
web/src/components/ErrorBanner.tsx
```

### Testing requirements

| ID | Intent |
|----|--------|
| **US-2.2.a** | Empty/whitespace submit → inline + `aria-live`; **no** POST |
| **US-2.2.b** | MSW **201** → field cleared + `invalidateQueries` spy or refetch proof |
| **IS-2.2.a** | MSW POST error → error UI + Retry + composer usable |
| **ES-2.2.a** | Playwright: add first todo → row visible at top after server OK |

### Previous story intelligence (2.1)

- **POST** contract and **Unicode 500 code-point** cap are **server-enforced**; web should align UX and avoid sending impossible text without guidance.  
- Integration tests in **api** use `inject` + Postgres — web story does **not** change api unless a discovered contract bug requires it (separate scope).  
- Story **2.1** completion: `npm run test:api` + test naming pattern `US-2.1.*` / `IS-2.1.*` — mirror with **`US-2.2.*` / `IS-2.2.*`** in **web** tests.

### Git intelligence summary

Recent commits emphasize **1.6 a11y**, **2.1 api validation tests**, **1.5 CI**, **1.4 list shell** — preserve those behaviors when adjusting composer DOM and error regions.

### Latest tech information

- TanStack Query **invalidateQueries** in v5 is async; tests should `await waitFor` for DOM updates after mutation settlement.  
- For **500 Unicode code points**, use the same conceptual rule as api (`[...str].length` or shared helper if you introduce a small `web` util—avoid importing from `api` package).

### Project context reference

- `_bmad-output/project-context.md` is minimal — treat **`epics.md`**, **`architecture.md`**, **`ux-design-specification.md`**, and this file as authoritative.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 2 UX-DR6/9/12–14, Story 2.2]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — TanStack Query, web structure, QA]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Add todo journey, AddComposer]  
- [Source: `_bmad-output/implementation-artifacts/2-1-post-api-v1-todos-with-validation-and-immutable-text-rule.md` — POST semantics]

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Cursor)

### Debug Log References

### Completion Notes List

- **Implementation:** `AddTodoForm` validates empty/whitespace and **>500 Unicode code points** before calling `onCreate`; inline error uses **`aria-describedby`** + **`aria-live="polite"`**; visible **“Adding…”** `role="status"` while submitting; **focus returns to the input** after successful create. **`try`/`catch`** around `onCreate` avoids unhandled rejections when the mutation fails (parent shows error UI).
- **Submit button:** enabled while the field is empty so **Enter** triggers implicit form submit in real browsers (disabled submit controls block that). Client validation still prevents `POST` on empty/whitespace.
- **TodoApp:** dedicated **create** error alert with **`ApiEnvelopeError`**-aware copy + **Retry** (`create.mutateAsync` with `create.variables`); **patch/delete** errors use a separate banner without POST retry. Sticky composer via **`todo-composer-sticky`** wrapper + **`web/src/index.css`** (full-bleed on narrow widths; flush at `sm+`).
- **Tests:** **US-2.2.a** / **US-2.2.b** / **IS-2.2.a** in `TodoApp.test.tsx`; `todoTextLimits` unit test; **IS-1.6.a** tab order updated for composer → **Add** → list. **Playwright** was not executed in this agent environment (missing browser install); run `npx playwright install` then `npm run test:e2e` locally or in CI to verify `todos.spec.ts` and `a11y-list-shell.spec.ts`.
- **Code review fixes:** added race guards for form submit/retry, restored focus after failed create, forced re-announcement for repeated validation errors, rethrew non-API runtime errors, strengthened Unicode boundary test with astral symbols, and corrected sprint timestamp monotonicity.

### File List

- `web/src/lib/todoTextLimits.ts`
- `web/src/lib/todoTextLimits.test.ts`
- `web/src/features/todos/AddTodoForm.tsx`
- `web/src/features/todos/AddTodoForm.test.tsx`
- `web/src/features/todos/TodoApp.tsx`
- `web/src/features/todos/TodoApp.test.tsx`
- `web/src/features/todos/TodoApp.a11y.test.tsx`
- `web/src/index.css`
- `tests/e2e/todos.spec.ts`
- `tests/e2e/a11y-list-shell.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-2-addcomposer-wired-to-create-mutation.md`

## Change Log

- **2026-05-12:** Story context created by `bmad-create-story` — status `ready-for-dev`.
- **2026-05-12:** Implemented Story 2.2 (composer UX, create retry, tests, e2e/a11y extensions); `bmad-dev-story` — status **`review`**.
- **2026-05-12:** Addressed code review findings (6 patch items), re-ran web tests and lint; story moved to **`done`**.
