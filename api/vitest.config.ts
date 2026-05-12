import { defineConfig } from "vitest/config";

const coverageGate = process.env.CI_COVERAGE_GATE === "1";

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
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/db/migrations/**",
        "src/db/migrate-cli.ts",
        "src/server.ts",
      ],
      ...(coverageGate
        ? {
            thresholds: {
              lines: 70,
              statements: 70,
              branches: 60,
              functions: 70,
            },
          }
        : {}),
    },
  },
});
