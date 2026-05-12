---

## story_key: 4-1-api-dockerfile-multistage-nonroot-health

story_id: "4.1"

epic: 4

status: done

---

# Story 4.1: API Dockerfile — multi-stage, non-root, health-aligned

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created. -->

## Story

As a **maintainer**,
I want **a production-oriented `Dockerfile` for `api/`**,
So that **the Fastify service runs reproducibly in containers with a verifiable health signal**.

## Acceptance Criteria

1. **Build from repo root (AC1)**  
   **Given** a clean clone with lockfile  
   **When** `docker build -f api/Dockerfile -t lets-do-it-api:local .` runs from the **repository root**  
   **Then** the build completes with **exit code 0**  
   **Traces:** NFR-08; epics Story 4.1.

2. **Runtime entry and env (AC2)**  
   **Given** a built image  
   **When** the container runs with **`DATABASE_URL`** (and **`WEB_ORIGIN`** if required by current CORS defaults) supplied at **runtime** only—not baked as secrets into the image  
   **Then** the process executes **`npm run start`** semantics (**`node dist/server.js`** from the `api` package after `npm run build`) and listens on **`PORT`** (default **3000**) on **`0.0.0.0`** per `api/src/server.ts`  
   **Traces:** NFR-08; `api/package.json` scripts.

3. **Non-root runtime (AC3)**  
   **Given** the container starts  
   **Then** the Node process runs as a **non-root** user (e.g. official image **`node`** user, UID **1000**)  
   **Traces:** NFR-08; training rubric.

4. **Health signal (AC4)**  
   **Given** Postgres is reachable and migrations succeed (same precondition as local `npm run dev` — `buildApp` runs `runMigrations` before routes register)  
   **When** a client performs **`GET /health`** on the bound port  
   **Then** response is **200** with JSON **`{ "ok": true }`** (see `api/src/app.ts` line registering `/health`)  
   **And** the Dockerfile declares **`HEALTHCHECK`** **or** the story explicitly documents Compose-level `healthcheck` in **Story 4.3** with a pointer—**prefer Dockerfile `HEALTHCHECK`** here using **`wget`** or **`curl`** against `127.0.0.1:$PORT/health`  
   **Traces:** IS-4.1.a epics; Growth health note in PRD.

5. **Architecture doc sync (AC5)**  
   **Given** the image contract is now concrete  
   **When** a reader opens `_bmad-output/planning-artifacts/architecture.md` § **Deployment & containerization (Epic 4)**  
   **Then** it lists **build command**, **default exposed port**, **required runtime env vars** (`DATABASE_URL`, `PORT`, `HOST`, `WEB_ORIGIN`), and **image stage outline** (builder vs runner) for **`api` only**—do not duplicate full-stack Compose here (**Story 4.3** owns `api` + `web` + `postgres` wiring)  
   **Traces:** epics Story 4.1 AC “architecture section lists…”.

6. **Scope discipline (AC6)**  
   **Given** Epic 4 splits Docker work across 4.1–4.3  
   **When** implementing this story  
   **Then** deliverables are limited to **`api/Dockerfile`**, **root `.dockerignore`** (recommended when build context is `.`), **`architecture.md`** subsection update, and verification notes—**no** new **`api` service** in root `docker-compose.yml` (that is **Story 4.3**); **no** `web` image ( **Story 4.2** ).

## Tasks / Subtasks

- [x] **Multi-stage `api/Dockerfile`** (AC: 1, 2, 3)
  - [x] **Builder stage:** Node **22** LTS-aligned image (e.g. `node:22-bookworm-slim`); `WORKDIR` e.g. `/app`; copy **root** `package.json` + `package-lock.json` and **`api/package.json`** (npm **workspaces** — lockfile is at repo root only).
  - [x] Run **`npm ci -w api`** in builder (needs devDependencies for **`tsc`**), copy `api/src` and `api/tsconfig*.json` / `api/drizzle.config.ts` as needed, then **`npm run build -w api`** so `api/dist/` and embedded migrations match existing `api/package.json` **`build`** script.
  - [x] **Runner stage:** fresh slim image; install **`wget`** (or `curl`) for **`HEALTHCHECK`** only if not present; **`npm ci -w api --omit=dev`**; copy **`api/dist`** from builder (and any non-`dist` runtime files the build does not emit—today migrations live under **`dist/db/migrations`** per build script).
  - [x] Set **`WORKDIR`** to **`/app/api`** (mirror repo layout) so **`node dist/server.js`** resolves **`./app.js`** and other relative imports beside **`dist/`** exactly as on the host after `npm run build`.
  - [x] **`USER node`** before **`CMD`**; expose **`EXPOSE 3000`** (or parameterized—document).

- [x] **`HEALTHCHECK`** (AC: 4)
  - [x] Use generous **`--start-period`** (migrations + listen can exceed a few seconds on cold DB).
  - [x] Probe **`GET /health`** on loopback; fail if non-200.

- [x] **Root `.dockerignore`** (AC: 1, 6)
  - [x] Exclude **`.git`**, **`node_modules`**, **`web/node_modules`**, **`api/node_modules`**, build caches, `_bmad-output` (optional—reduces context size), and other large paths so `docker build` stays fast and deterministic.

- [x] **`architecture.md` update** (AC: 5)
  - [x] Under **Deployment & containerization (Epic 4)**, add an **`api` image** bullet table: build `-f api/Dockerfile`, ports, env, non-root, health.

- [x] **Verification — `IS-4.1.a`** (AC: 2, 4)
  - [x] Start Postgres locally (existing root **`docker compose up -d postgres`**).
  - [x] Run container with **`DATABASE_URL`** pointing at host Postgres from inside the container (**`host.docker.internal`** on Docker Desktop Mac/Win; on Linux document **`--add-host=host.docker.internal:host-gateway`** or use host network mode for dev verification only).
  - [x] **`curl -sS http://127.0.0.1:3000/health`** from host with **`-p 3000:3000`** → **`{"ok":true}`**.

- [x] **Regression** (AC: 6)
  - [x] **`npm run build -w api`** on host still succeeds (Dockerfile must not require changes that break host build).
  - [x] **`npm run test:api`** still passes (no test behavior change required; Dockerfile-only is fine).

### Review Findings

- [x] [Review][Patch] **`HEALTHCHECK` ignores `PORT`** [`api/Dockerfile:39-40`] — `HEALTHCHECK` always probed **3000** while `api/src/server.ts` honors **`PORT`**. **Resolved:** **`CMD /bin/sh -c`** + **`$${PORT:-3000}`** in **`wget`** URL (legacy builder does not support **`CMD-SHELL`**).

- [x] [Review][Defer] **`npm audit` noise in Docker build logs** [`api/Dockerfile` (npm ci layers)] — pre-existing dependency advisories from the lockfile; not introduced as new app behavior; track under supply-chain hygiene separately from this story.

## Dev Notes

### Epic 4 context

Epic 4 closes the **training / portfolio** gap: **NFR-08** (containerized stack). This story is **only** the **API image**. **Story 4.2** adds **`web` Dockerfile**; **Story 4.3** wires **Compose** for all services. Keep boundaries strict to avoid review churn.

### Critical runtime behavior (do not skip)

`buildApp()` in `api/src/app.ts`:

- **Throws** if **`DATABASE_URL`** is missing (`resolveDatabaseUrl`).
- Runs **`runMigrations(db)`** before registering routes; **`/health`** is registered **after** migrations succeed.

Therefore:

- A running container **implies** DB reachability and successful migrations at startup—**health is a weak “DB up” signal** for this codebase.
- **`HEALTHCHECK` start-period** must account for migration time on a cold volume.

### Brownfield — files to add or touch

| Path | Action |
|------|--------|
| `api/Dockerfile` | **NEW** — multi-stage definition |
| `.dockerignore` | **NEW** (repo root) — shrink context |
| `_bmad-output/planning-artifacts/architecture.md` | **UPDATE** — `api` image contract under Epic 4 deployment |
| `docker-compose.yml` | **Do not add `api` service in this story** (Story 4.3) |

### Workspace + lockfile reality

- **Single `package-lock.json`** at **repo root** (npm workspaces: `api`, `web`).  
- **Docker build context = `.`** — copy root lockfile + root `package.json` + `api/package.json`, then `npm ci -w api`.

### Library / base image notes

- **Fastify 5**, **Node 22** types in `api/package.json` — align base image **major** with repo Node (root `engines` if present; else **22** is a safe default for 2026).
- **`pg` native module:** **`bookworm-slim`** is usually smoother than **alpine** for `pg` unless you want musl complexity.

### Testing requirements

| ID | Level | Requirement |
|----|-------|----------------|
| IS-4.1.a | Manual / integration | Built image + Postgres → **`GET /health`** **200** + `{ ok: true }`. |
| US-4.1.a | Optional | **`hadolint api/Dockerfile`** in CI or docs—epics mark optional; skip with one-line rationale in story Dev Agent Record if omitted. |

No Playwright or Vitest code changes **required** for AC; Dockerfile-only story.

### Previous story intelligence (3.4)

From **`3-4-ci-matrix-unit-e2e-and-axe-gate-on-list-view.md`** (done):

- **CI discipline:** named workflow steps, README parity with CI—when you later add a **`docker build` job** (optional, not this story), follow the same explicit naming pattern.
- **Postgres in CI:** GitHub Actions uses **`services:`** Postgres; Playwright **`global-setup.mjs`** skips **`docker compose`** when **`CI=true`**. Container verification on developer machines still uses root **`docker compose up -d postgres`** — unchanged.

### Git intelligence (recent commits)

- `2e162ad` — CI Story 3.4 quality gates (E2E, axe, Vitest isolation).
- `6c88f81` — Epic 3 retro + sprint tracking.

Maintain conventional commit prefixes: `ci:`, `chore:`, `docs:` for infra/doc-only follow-ups.

### Project context reference

- `_bmad-output/planning-artifacts/epics.md` — Story **4.1** block.
- `_bmad-output/planning-artifacts/prd.md` — **NFR-08**.
- `_bmad-output/planning-artifacts/architecture.md` — **Deployment & containerization (Epic 4)**.
- `api/src/server.ts`, `api/src/app.ts` — listen + `/health`.
- `api/package.json` — **`build`**, **`start`**.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_(none)_

### Completion Notes List

- Added **`api/Dockerfile`** (multi-stage **`node:22-bookworm-slim`**, workspace **`npm ci -w api`**, **`USER node`**, **`HEALTHCHECK`** via **`wget`** + **`grep '"ok":true'`**).
- Added root **`.dockerignore`** to keep build context small (excludes `_bmad-output`, workspace **`node_modules`**, etc.).
- Updated **`_bmad-output/planning-artifacts/architecture.md`** with **`api` image** contract table (build command, stages, env, health, verification patterns including bridge network vs **`host.docker.internal`**).
- **`docker build -f api/Dockerfile -t lets-do-it-api:local .`** succeeds from repo root.
- **IS-4.1.a:** Verified with a **user-defined bridge network** (`postgres:17-alpine` + API on same network, **`DATABASE_URL`** using the DB container name); **`curl http://127.0.0.1:3001/health`** returned **`{"ok":true}`** (host port **3001** mapped to container **3000**). This host’s Docker CLI lacks the **`docker compose`** plugin, so root **`docker compose up -d postgres`** was not used for verification—the network pattern matches the architecture doc guidance.
- **US-4.1.a (hadolint):** Not added (optional per epics); low value vs maintaining Hadolint in CI for a single Dockerfile in this repo.
- **Code review (2026-05-14):** Applied **`HEALTHCHECK`** fix — shell probes **`$${PORT:-3000}`** via **`CMD /bin/sh -c`** (legacy Docker daemon rejects **`CMD-SHELL`**); architecture **Health** row updated to match.

### File List

- `api/Dockerfile`
- `.dockerignore`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-1-api-dockerfile-multistage-nonroot-health.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`

## Change Log

- 2026-05-13: Story context created by `bmad-create-story` — status `ready-for-dev`.
- 2026-05-14: Implementation complete (`bmad-dev-story`) — status **`review`**; Docker image + docs + verification.
- 2026-05-14: `bmad-code-review` — applied patch: **`HEALTHCHECK`** uses **`/bin/sh -c`** + **`$${PORT:-3000}`** (replacing **`CMD-SHELL`** for legacy Docker compatibility); story **`done`**.
