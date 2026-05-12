# AI integration and MCP usage log (NFR-11)

**Course artifact:** how AI tooling was used to build **lets-do-it**, what worked, what failed, and where human judgment was required. Update this file when workflows materially change.

## Agents and roles

- **Composer / Cursor agent (implementation):** primary coding agent for stories, refactors, and test fixes across **`api`**, **`web`**, Docker, CI, and docs.  
- **BMAD-skilled prompts:** `bmad-create-story`, `bmad-dev-story`, `bmad-code-review`, `bmad-help`, `bmad-retrospective` patterns — story files under **`_bmad-output/implementation-artifacts/`** and sprint YAML as the contract with the agent.

## MCP and IDE integration

- **Cursor MCP (filesystem descriptors):** Used to discover tool schemas (e.g. browser, app-control) when relevant; **browser MCP** available for UI verification — not required for every change.  
- **Substitutes:** No Postman MCP in this repo; **OpenAPI** is served by the API (**`/documentation/json`**) and **Vitest / Playwright** provide machine-checked behavior instead of external API clients.

## Prompt patterns that worked

- **Story-first:** Paste or point to **`epics.md`** + **`sprint-status.yaml`** + acceptance criteria before large edits — reduces wrong-file edits.  
- **Diff-scoped commits:** User rule to commit per story (`feat(epic-4): story 4.x …`) keeps history reviewable for assessors.  
- **Explicit verification:** Ask for **`npm run test:api`** with **`DATABASE_URL`**, **`docker-compose --profile full`**, and **`check:readme`** in the same session as infra changes.

## Testing and debugging

- **Vitest coverage + gate:** Agent added **`@vitest/coverage-v8`**, workspace scripts, and CI step; discovered **AJV `coerceTypes`** caused **`done: 1`** to pass as boolean — fixed with **`coerceTypes: false`** in **`api/src/app.ts`** so integration tests match Zod contract.  
- **ESLint vs coverage HTML:** Generated **`web/coverage/`** triggered lint warnings — fixed by **`globalIgnores(['coverage'])`** in **`web/eslint.config.js`**.

## Limitations and human overrides

- **Docker CLI variance:** Some hosts lack **`docker compose` plugin**; human chose to document **`docker-compose`** and **`COMPOSE_PROFILES=full`** in **`docker-compose.yml`** header and README.  
- **Commit boundaries:** Human specified **one commit per story** and excluded unrelated untracked files (e.g. stray retros).  
- **Security / audit:** `npm audit` output is advisory; org policy decides upgrades — not auto-applied by agent.

## Honesty on automation gaps

- **E2E in agent sandbox:** Full Playwright runs may depend on local Docker / display; CI remains the canonical green path.  
- **Performance hard gate:** Deferred per PRD/README; agent documented posture in **`docs/qa/index.md`** rather than inventing thresholds.
