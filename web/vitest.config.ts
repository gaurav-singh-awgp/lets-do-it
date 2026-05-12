import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const coverageGate = process.env.CI_COVERAGE_GATE === "1";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/test/**",
        "src/setupTests.ts",
        "src/main.tsx",
        "**/vite-env.d.ts",
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
