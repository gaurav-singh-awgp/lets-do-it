---

## story_key: 4-2-web-dockerfile-static-serve-and-env

story_id: "4.2"

epic: 4

status: done

---

# Story 4.2: Web Dockerfile — static build and minimal serve

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created. -->

## Story

As a **maintainer**,
I want **a `Dockerfile` for `web/` that builds the SPA and serves it with a tiny static server or nginx**,
So that **the UI is reachable inside Compose without `vite dev`**.

## Acceptance Criteria

1. **Build from repo root (AC1)**  
   **Given** a clone with lockfile  
   **When** `docker build -f web/Dockerfile -t lets-do-it-web:local .` runs from the **repository root**  
   **Then** the build completes with **exit code 0**  
   **Traces:** NFR-08; epics Story 4.2.

2. **Static assets + port (AC2)**  
   **Given** a built image  
   **When** the container runs  
   **Then** **`GET /`** returns **200** with **`text/html`** referencing built JS/CSS (Vite **`dist/`**)  
   **And** the listen port is **documented** (default **8080** for unprivileged nginx pattern)  
   **Traces:** IS-4.2.a.

3. **`VITE_API_BASE_URL` (AC3)**  
   **Given** the SPA calls the API via `import.meta.env.VITE_API_BASE_URL` (`web/src/api/todosClient.ts`)  
   **When** operators build the image  
   **Then** **`ARG` / `ENV`** (or documented **`--build-arg`**) allows setting the **browser-reachable** API base (e.g. `http://127.0.0.1:3000` for same-host demo, or public URL in real deploys)  
   **And** **`architecture.md`** explains the contract alongside the **`api`** image table  
   **Traces:** NFR-08; architecture networking bullet.

4. **Non-root + health (AC4)**  
   **Given** production hardening expectations  
   **When** the image runs  
   **Then** the process model matches **`nginxinc/nginx-unprivileged`** (no root listener) **or** equivalent documented non-root static serve  
   **And** **`HEALTHCHECK`** probes **`GET /`** on the container listen port  
   **Traces:** Epic 4.2 AC.

5. **Scope (AC5)**  
   **Do not** add **`web`** service to root **`docker-compose.yml`** here (**Story 4.3**). **Do not** change **`README`** Run path here (**Story 4.4**).

## Tasks / Subtasks

- [x] **`web/docker/default.conf`** (AC: 2)  
  - [x] Nginx **`try_files`** SPA fallback to **`index.html`**; **`listen 8080`**.

- [x] **`web/Dockerfile`** (AC: 1–4)  
  - [x] **Builder:** `node:22-bookworm-slim`, root **`package.json` + `package-lock.json`**, **`api/package.json`** (workspace stub), **`web/package.json`**, **`npm ci -w web`**, copy **`web/`** sources, **`ARG VITE_API_BASE_URL`** with sensible default, **`npm run build -w web`**.  
  - [x] **Runner:** `nginxinc/nginx-unprivileged` (pinned alpine tag), copy **`dist`** → **`/usr/share/nginx/html`**, copy **`default.conf`** → **`/etc/nginx/conf.d/default.conf`**.  
  - [x] **`EXPOSE 8080`**, **`HEALTHCHECK`** (wget or curl per image), non-root implied by base image.

- [x] **`architecture.md`** (AC: 3)  
  - [x] Add **`web` image** table: build command, **`VITE_API_BASE_URL`**, port **8080**, nginx stages, health.

- [x] **Verification — `IS-4.2.a`** (AC: 2)  
  - [x] `docker run --rm -p 9080:8080 lets-do-it-web:local` → **`curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:9080/`** → **200**; response body contains **`script`** or **`assets/`** path.

- [x] **Regression** (AC: 5)  
  - [x] **`npm run build -w web`** on host passes.  
  - [x] **`npm run test:web`** passes.

## Dev Notes

### API base URL at build time

`VITE_*` is inlined at **`vite build`**. The URL must be whatever the **browser** uses to reach the API (not `http://api:3000` unless the browser truly resolves that hostname). Default **`http://127.0.0.1:3000`** matches local demo; Compose host mapping is documented for Story 4.3.

### Workspace install

Same pattern as **`api/Dockerfile`**: **`npm ci -w web`** from repo root requires **`api/package.json`** present so the lockfile’s workspace graph resolves.

### References

- `web/src/api/todosClient.ts` — `VITE_API_BASE_URL`  
- `api/Dockerfile` — mirror multi-stage / root-context conventions  
- `_bmad-output/planning-artifacts/architecture.md` — Epic 4 deployment section

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_(none)_

### Completion Notes List

- Multi-stage **`web/Dockerfile`** builds SPA with **`VITE_API_BASE_URL`** build-arg; **`nginxinc/nginx-unprivileged:1.27-alpine`** serves **`web/dist`** on **8080** with SPA **`try_files`**.
- **`HEALTHCHECK`** uses **`wget --spider`** against **`http://127.0.0.1:8080/`** (HTTP 200).
- **`tsconfig.app.json`** excludes `*.test.*` from **`tsc -b`** so production typecheck matches Docker build; **`vitest.config.ts`** sets **`esbuild.jsx: "automatic"`** so Vitest still compiles JSX for tests.
- Verified: **`docker build -f web/Dockerfile`**, **`docker run`** + curl **200** with **`/assets/`** in HTML, **`npm run build -w web`**, **`npm run test:web`**.

### File List

- `web/Dockerfile`
- `web/docker/default.conf`
- `_bmad-output/planning-artifacts/architecture.md`
- `web/tsconfig.app.json`
- `web/vitest.config.ts`
- `_bmad-output/implementation-artifacts/4-2-web-dockerfile-static-serve-and-env.md`

## Change Log

- 2026-05-14: Story context created by `bmad-create-story` — status `ready-for-dev`.
- 2026-05-14: Implemented (`bmad-dev-story`): Dockerfile, nginx config, architecture **`web` image** table, Vitest/tsconfig alignment for Docker + host **`tsc -b`**.
- 2026-05-14: `bmad-code-review` — clean review; story marked **done**.

### Review Findings

✅ **Clean review** — adversarial pass (diff + AC audit): no `decision-needed`, `patch`, or `defer` items. `docker build` / container smoke / regression commands executed successfully in dev session.
