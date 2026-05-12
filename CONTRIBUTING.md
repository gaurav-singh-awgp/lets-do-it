# Contributing to lets-do-it

## Tests and traceability

Automated tests often include scenario IDs that trace back to **`_bmad-output/planning-artifacts/epics.md`**:

| Prefix | Level | Example |
|--------|--------|---------|
| **`US-n.m.*`** | Unit | `US-3.1.a` — Zod or pure function for story *n.m* |
| **`IS-n.m.*`** | Integration | `IS-2.1.a` — HTTP + DB or multi-layer without a browser driver |
| **`ES-n.m.*`** | End-to-end | `ES-3.3.a` — Playwright user journey |

Use the same `describe` / `it` title pattern when adding tests so failures map cleanly to backlog stories.

## Before you open a PR

From the repo root:

```bash
npm install
npm run check:readme
npm run lint
npm run test
```

API integration tests need **`DATABASE_URL`** (see root **`README.md`**). E2E needs Playwright Chromium (`npx playwright install chromium`) and a reachable Postgres for **`npm run test:e2e`**.

## Docs

Contributor orientation and links to specs live in **`docs/DEVELOPER_GUIDE.md`**. Product behavior for end users is in **`docs/USER_GUIDE.md`**.
