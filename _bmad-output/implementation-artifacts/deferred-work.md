# Deferred work

## Deferred from: code review of 1-2-local-postgresql-and-drizzle-schema-for-todos.md (2026-05-04)

- Integration tests use a shared database and truncate `todos` per test; running Vitest with multiple workers against a single `DATABASE_URL` can cause cross-test interference. Address via `poolOptions.max: 1`, serial integration projects, or per-worker databases when CI enables parallelism.
