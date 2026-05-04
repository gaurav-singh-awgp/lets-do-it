---
story_key: 1-2-local-postgresql-and-drizzle-schema-for-todos
story_id: "1.2"
epic: 1
status: done
---

# Story 1.2: Local PostgreSQL and Drizzle schema for todos

Status: done

<!-- Optional: run validate-create-story (`bmad-create-story` · validate) before `bmad-dev-story`. -->

## Story

As a **developer**,
I want **Docker Compose Postgres and a Drizzle-managed `todos` table**,
So that **the API can persist todos with migrations as the single schema evolution path**.

## Acceptance Criteria

1. **Given** Story 1.1 complete  
   **When** `docker-compose.yml` at the repo root defines a `postgres` service and local connection details are reproducible  
   **Then** contributors can start Postgres with **`docker compose up -d postgres`** (or documented equivalent).

2. **`DATABASE_URL` documentation**  
   **When** a developer opens `api/.env.example`  
   **Then** it documents **`DATABASE_URL`** with a value that matches the Compose service (user, password, db name, host, port)—**never** commit real secrets; example string only.

3. **Drizzle schema**  
   **Then** Drizzle defines table **`todos`** with: **`id`** (UUID PK), **`text`**, **`done`**, **`created_at`** (required), optional **`updated_at`**, using **snake_case** column names in the database and explicit TS ↔ DB mapping per architecture (camelCase in TS schema props mapped to snake columns is acceptable if consistent).

4. **Index for list reads**  
   **Then** there is an index aligned with default list ordering **`created_at` descending** (name per architecture: **`idx_todos_created_at_desc`**, or rename in one migration if renaming for consistency).

5. **Migrations as source of truth**  
   **When** `drizzle-kit generate` is run after schema changes  
   **Then** generated SQL migrations are **committed** under the repo (path agreed below—prefer `api/src/db/migrations/` to match [Source: `_bmad-output/planning-artifacts/architecture.md` — Project Structure & Boundaries], or update architecture + this story if the team standardizes on `api/migrations/`).  
   **And** applying migrations (`drizzle-kit migrate` or documented `drizzle-kit push` policy—**pick one primary path for CI and humans**) creates the table and index on a fresh database.

6. **README**  
   **Then** root `README.md` **Run** (or linked subsection) documents: starting Postgres, setting `DATABASE_URL`, and running **generate / migrate** (or the chosen workflow) so schema changes are not tribal knowledge. (Full NFR-06 polish can still grow in Story 1.5; this story must at minimum cover **DB + Drizzle** commands.)

## Tasks / Subtasks

- [x] **Compose & env** (AC: 1–2)  
  - [x] Confirm `docker-compose.yml` matches documented `DATABASE_URL` in `api/.env.example`.  
  - [x] Add missing `DATABASE_URL=` line and short comment if absent.

- [x] **Schema audit** (AC: 3–4)  
  - [x] Compare `api/src/db/schema.ts` to architecture + epics; adjust types/index naming only if needed for AC compliance.

- [x] **Single evolution path** (AC: 5) — *critical brownfield*  
  - [x] Today `buildApp` calls `ensureTodosTable` ([Source: `api/src/db/initSchema.ts`]) which duplicates DDL outside Drizzle migrations. **Resolve this:** either remove `ensureTodosTable` once migrations always run first, or restrict it to **test-only** behind an explicit flag—**production and normal `npm run dev` must rely on applied migrations**, per architecture (“migrations are the only schema evolution path”).  
  - [x] Run `npx drizzle-kit generate` (from `api/`) to produce initial migration if none committed; verify SQL matches schema + DESC index intent.  
  - [x] Add `api/package.json` scripts if missing, e.g. `db:generate`, `db:migrate` (exact names your team prefers, but document them in README).

- [x] **README** (AC: 6)  
  - [x] Extend **Run** with Postgres + migrate steps; keep Story 1.5 scope in mind (do not fake full NFR-06 blocks—just honest DB steps).

- [x] **Tests** (epics Test scenarios)  
  - [x] **US-1.2.a:** Unit/assertions on exported schema types or table definition (no DB).  
  - [x] **IS-1.2.a:** With Compose up and `DATABASE_URL` set, after migrate: verify table + index via `information_schema` or `\d todos` (document command in test comment or script).  
  - [x] **IS-1.2.b:** Integration: `TodoRepository.list()` (or equivalent) against real DB returns `[]` on empty DB.

### Review Findings

- [x] [Review][Patch] Add final newline to committed migration SQL — POSIX text files should end with newline; `git diff` flags `\ No newline at end of file` on `0000_init_todos.sql`. [api/src/db/migrations/0000_init_todos.sql]
- [x] [Review][Patch] Treat whitespace-only `DATABASE_URL` like unset — `??` does not catch `""`; `pg` errors are opaque vs explicit validation. [api/src/app.ts] [api/src/db/migrate-cli.ts]
- [x] [Review][Defer] Integration suite uses shared DB + `DELETE FROM todos`; Vitest parallel workers against one `DATABASE_URL` could flake — deferred, CI / test config concern. [api/src/todos.integration.test.ts]

## Dev Notes

### Epic context

- **Epic 1:** Trustworthy read path and local runnability. **1.2** is persistence foundation only; **HTTP list contract** is Story **1.3**, web list shell **1.4**. Do not weaken existing routes if they already exist from accelerated work—**this story’s success** is measured by **Compose + Drizzle schema + committed migrations + docs + tests**, and by **eliminating parallel DDL** (`ensureTodosTable`) unless narrowly justified. [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.2]

### Brownfield inventory (do not reinvent)

| Area | Current state | Implication |
|------|----------------|-------------|
| Compose | `docker-compose.yml` has `postgres:17-alpine`, user/password/db `todo`/`todos` | Verify `DATABASE_URL` example matches these defaults. |
| Drizzle schema | `api/src/db/schema.ts` defines `todos` + index `idx_todos_created_at_desc` | Audit vs AC; fix index direction in migration if DB index is not DESC. |
| `drizzle.config.ts` | `out: "./migrations"` (under `api/`) | Architecture diagram shows `src/db/migrations/`—**reconcile** (move output + config or document intentional variance). |
| Runtime DDL | `ensureTodosTable` in `initSchema.ts` | **Anti-pattern vs epic**—replace with migration-first workflow. |
| Repository | `TodoRepository.list()` uses `orderBy(desc(todos.createdAt))` | Good alignment with FR-03 default sort; keep. |
| `.env.example` | Missing `DATABASE_URL` | **Must fix** for AC 2. |
| README Run | Mentions API/web; says “Postgres … later stories” | **Stale vs this story**—update for 1.2. |

### Architecture compliance (must follow)

| Topic | Requirement |
|--------|--------------|
| **DB** | PostgreSQL **16+ or 17+**; Docker for local. [Source: `architecture.md` — Data Architecture] |
| **ORM** | Drizzle + `pg`; `drizzle-kit` for migrations; document generate/migrate. |
| **Table** | `todos`: `id`, `text`, `done`, `created_at`, optional `updated_at`; index for **`created_at DESC`** list reads. |
| **Naming** | Tables/columns **snake_case** in DB; map to **camelCase** JSON at HTTP boundary in later stories—not this story’s primary work. |
| **Layout** | `api/src/db/schema.ts`, `client.ts`, migrations folder per tree. [Source: `architecture.md` — Project Structure & Boundaries] |
| **Secrets** | `DATABASE_URL` env only (NFR-05). |

### Previous story intelligence (1.1)

- Monorepo **`api` / `web`** workspaces and Vitest baseline exist. [Source: `1-1-scaffold-api-and-web-from-approved-starters.md`]  
- Generators evolve; lockfiles are source of truth for versions.  
- No git history in workspace snapshot—no commit-pattern intelligence.

### Testing requirements

- Follow epic **Test scenarios** IDs **`US-1.2.*`**, **`IS-1.2.*`**, **`ES-1.2.*`** (E2E optional unless CI starts Compose).  
- Integration tests already exist in `api/src/todos.integration.test.ts` gated on `DATABASE_URL`; ensure they **pass with migration-applied DB** and do not rely solely on `ensureTodosTable` for CI.

### Library versions (verify at implementation time)

- **`drizzle-orm`** / **`drizzle-kit`** / **`pg`** — use versions already in `api/package.json` unless security bump required; if upgrading, re-run `generate` and confirm migration SQL.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Story 1.2, acceptance + test scenarios]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Database naming conventions, Project Structure]  
- [Source: `_bmad-output/planning-artifacts/prd.md` — persistence / NFR-05]  
- [Source: `api/src/db/schema.ts`, `api/src/db/run-migrations.ts`, `api/drizzle.config.ts`, `docker-compose.yml`]

## Change Log

- 2026-05-03: Story 1.2 implemented — Drizzle migrations as sole schema path, `DATABASE_URL` docs, README Run/Test hooks, schema + integration tests.
- 2026-05-04: Addressed code review patches — trailing newline on `0000_init_todos.sql`; `resolveDatabaseUrl()` trims and rejects blank/whitespace-only `DATABASE_URL` in `buildApp` and `migrate-cli`; unit tests added.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Removed `ensureTodosTable`; `buildApp` runs `drizzle-orm/node-postgres/migrator` against `api/src/db/migrations`.
- Added committed migration `0000_init_todos.sql` with **`created_at DESC NULLS LAST`** index; schema uses `table.createdAt.desc()` in index definition.
- `drizzle.config.ts` `out` set to `./src/db/migrations`; `api` build copies migrations into `dist/db/migrations` for `npm start`.
- `api/.env.example` documents `DATABASE_URL` aligned with Compose.
- Root README documents Postgres, `db:migrate`, `db:generate`, and `docker-compose` alternate.
- **US-1.2.a:** `api/src/db/schema.test.ts`. **IS-1.2.a/b:** extended `api/src/todos.integration.test.ts` (requires `DATABASE_URL` + Postgres).
- Code review follow-up: `api/src/db/resolve-database-url.ts` + `resolve-database-url.test.ts`; migration newline; integration gate uses `resolveDatabaseUrl()`.

### File List

- `api/.env.example`
- `api/drizzle.config.ts`
- `api/package.json`
- `api/src/app.ts`
- `api/src/db/migrate-cli.ts`
- `api/src/db/resolve-database-url.ts`
- `api/src/db/resolve-database-url.test.ts`
- `api/src/db/run-migrations.ts`
- `api/src/db/schema.ts`
- `api/src/db/schema.test.ts`
- `api/src/db/migrations/0000_init_todos.sql`
- `api/src/db/migrations/meta/_journal.json`
- `api/src/db/migrations/meta/0000_snapshot.json`
- `api/src/todos.integration.test.ts`
- `api/src/db/initSchema.ts` (deleted)
- `README.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/1-2-local-postgresql-and-drizzle-schema-for-todos.md` (this file)

---

**Story completion note:** Ultimate context engine analysis completed — comprehensive developer guide created.
