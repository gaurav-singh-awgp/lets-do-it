---

## story_key: 4-4-readme-container-path-parity-nfr-06

story_id: "4.4"

epic: 4

status: done

---

# Story 4.4: README — parity for container path

Status: done

## Story

As a **new contributor**,
I want **README Run/Test to describe host-dev and container-full-stack paths**,
So that **NFR-06 stays the single source of truth**.

## Tasks / Subtasks

- [x] **Run** — document **`docker compose --profile full`** / **`docker-compose`** / **`COMPOSE_PROFILES`**, URLs **9080** / **3000**, port-conflict note vs host dev API.  
- [x] **`check:readme`** — headings unchanged; verified structure.  
- [x] **`sprint-status.yaml`** sync.

## Dev Agent Record

### Completion Notes List

- Test section will reference **`npm run test:coverage`** in Story **4.5** (same epic).

### File List

- `README.md`  
- `_bmad-output/implementation-artifacts/4-4-readme-container-path-parity-nfr-06.md`  
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-05-14: README Run path for full-stack Compose; status **done**.

### Review Findings

✅ Self-review — NFR-06 **Run** documents both Postgres-only and **full** profile paths.
