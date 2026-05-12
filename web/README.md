# `web` — Vite + React todo client

This workspace is the **browser UI** for **lets-do-it** (list, add, toggle done, delete). It talks to the **`api`** package over HTTP (`fetch` + TanStack Query).

## Documentation

- **Run / test / API:** root [**README**](../README.md)  
- **Using the app (end users):** [**docs/USER_GUIDE.md**](../docs/USER_GUIDE.md)  
- **Contributors (layout, env, CI):** [**docs/DEVELOPER_GUIDE.md**](../docs/DEVELOPER_GUIDE.md)  
- **Full doc index:** [**docs/README.md**](../docs/README.md)

## Scripts (this package)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (default **http://127.0.0.1:5173**). |
| `npm run build` | Typecheck + production bundle. |
| `npm run test` | Vitest (see `vitest.config.ts`). |
| `npm run lint` | ESLint. |

Root **`package.json`** defines **`npm run dev:web`** and workspace-wide test/lint shortcuts.
