import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * ES-1.6.a — Playwright duplicate of unit axe signal (intentional per epics).
 *
 * Gate: zero violations with impact === "critical" on each DOM state.
 * Story 3.4 will extend this to full add/complete/delete paths (NFR-07 full CI matrix).
 */

/** Delete all existing todos so tests start from a clean slate. */
async function clearTodos(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get(`${API_BASE}/api/v1/todos`);
  const todos = (await res.json()) as { id: string }[];
  for (const t of todos) {
    await request.delete(`${API_BASE}/api/v1/todos/${t.id}`);
  }
}

function assertNoCriticalViolations(
  results: Awaited<ReturnType<AxeBuilder["analyze"]>>,
  label: string,
) {
  const critical = results.violations.filter((v) => v.impact === "critical");
  if (critical.length > 0) {
    const details = critical
      .map((v) => `  [${v.id}] ${v.description}`)
      .join("\n");
    throw new Error(
      `${label}: ${critical.length} critical axe violation(s):\n${details}`,
    );
  }
}

test.describe("ES-1.6.a — axe on list shell (GET states)", () => {
  test.beforeEach(async ({ request }) => {
    await clearTodos(request);
  });

  test("empty state: zero critical violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("todo-empty")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    assertNoCriticalViolations(results, "empty state");
  });

  test("populated list: zero critical violations", async ({
    page,
    request,
  }) => {
    // Seed one todo via API so the list renders in the populated state
    await request.post(`${API_BASE}/api/v1/todos`, {
      data: { text: "a11y seed todo" },
    });

    await page.goto("/");
    await expect(page.getByRole("list", { name: /todo list/i })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    assertNoCriticalViolations(results, "populated list");
  });

  test("load-error banner: zero critical violations", async ({ page }) => {
    // Intercept GET /api/v1/todos before navigation to force the error state
    await page.route("**/api/v1/todos", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "INTERNAL",
            message: "Simulated server error for a11y test",
          },
        }),
      });
    });

    await page.goto("/");
    await expect(page.getByRole("alert")).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    assertNoCriticalViolations(results, "error banner state");
  });

  test("composer client validation: zero critical violations", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("todo-empty")).toBeVisible();
    await page.getByPlaceholder(/what needs doing/i).press("Enter");
    await expect(
      page.getByText(/Enter a short description/i),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    assertNoCriticalViolations(results, "composer validation");
  });
});
