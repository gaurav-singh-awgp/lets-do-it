import { defineConfig, devices } from "@playwright/test";

const defaultDatabaseUrl =
  "postgres://todo:todo@127.0.0.1:5432/todos";

export default defineConfig({
  globalSetup: "./tests/e2e/global-setup.mjs",
  testDir: "tests/e2e",
  // Specs share one Postgres database; parallel workers would race on `todos`.
  // `fullyParallel` is off so intent matches `workers: 1` (serial suite).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev:e2e",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? defaultDatabaseUrl,
      WEB_ORIGIN: "http://127.0.0.1:5173",
    },
  },
});
