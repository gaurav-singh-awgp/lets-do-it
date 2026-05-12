---

## story_key: 4-3-docker-compose-full-stack-and-profiles

story_id: "4.3"

epic: 4

status: done

---

# Story 4.3: Docker Compose — full stack, networking, optional profiles

Status: done

## Story

As a **maintainer**,
I want **`docker-compose.yml` to orchestrate postgres, api, and web**,
So that **`docker compose` / `docker-compose` with profile `full` brings up a working todo app**.

## Acceptance Criteria

1. **Full stack (AC1)** — Postgres + API + web build and run; browser can reach UI and CRUD against API → Postgres.  
2. **Networking (AC2)** — Service names, published ports, **`WEB_ORIGIN`**, **`VITE_API_BASE_URL`** build-arg documented in **`architecture.md`** and compose header comments.  
3. **Profiles (AC3)** — Default **`postgres`** only (no profile); **`api`** / **`web`** use **`profiles: ["full"]`** so existing `docker compose up -d postgres` workflow unchanged.

## Tasks / Subtasks

- [x] Extend **`docker-compose.yml`**: postgres healthcheck; **`api`** / **`web`** with **`full`** profile, env, **`depends_on`** + **`api`** healthcheck for **`web`**.  
- [x] Document **`docker-compose`** standalone + **`COMPOSE_PROFILES=full`** when Docker Compose plugin missing.  
- [x] **`architecture.md`** — **Root Compose (Story 4.3)** table.  
- [x] Sync **`sprint-status.yaml`** for this story.

## Dev Agent Record

### Agent Model Used

Composer (Cursor subagent)

### Completion Notes List

- **`api`** healthcheck in Compose probes **`GET /health`** so **`web`** waits for migrations + listen.  
- Host ports **3000** (API) and **9080** (web → container **8080**).

### File List

- `docker-compose.yml`  
- `_bmad-output/planning-artifacts/architecture.md`  
- `_bmad-output/implementation-artifacts/4-3-docker-compose-full-stack-and-profiles.md`  
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-05-14: Implemented; status **done**.

### Review Findings

✅ Clean self-review against epics Story 4.3 — profiles, health ordering, and docs aligned.
