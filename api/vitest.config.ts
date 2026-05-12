import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    passWithNoTests: false,
    // Integration tests share a single Postgres database (DATABASE_URL).
    // Parallel workers cause cross-test row interference via concurrent
    // truncate/insert cycles. A single fork serializes execution safely.
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
