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
  // Do not retry axe gate in CI: a pass-on-retry can hide real violations.
  test.describe.configure({ retries: 0 });

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

  /**
   * ES-3.4.a — NFR-07 full-flow axe gate: add → complete → delete.
   * Asserts zero critical violations at each DOM transition.
   */
  test("ES-3.4.a: add → complete → delete — zero critical violations at each step", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("todo-empty")).toBeVisible();

    // Step 1: add todo — assert axe on populated list state
    await page.getByPlaceholder(/what needs doing/i).fill("ES-3.4.a axe todo");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("ES-3.4.a axe todo")).toBeVisible();
    assertNoCriticalViolations(
      await new AxeBuilder({ page }).analyze(),
      "populated list after add",
    );

    // Step 2: toggle complete — assert axe on checked/done state
    const row = page.locator("li").filter({ hasText: "ES-3.4.a axe todo" });
    await row
      .getByRole("checkbox", { name: /toggle done for es-3\.4\.a axe todo/i })
      .click();
    await expect(row.getByRole("checkbox")).toBeChecked();
    await expect(row.locator(".todo-text.done")).toContainText("ES-3.4.a axe todo");
    assertNoCriticalViolations(
      await new AxeBuilder({ page }).analyze(),
      "list with completed item",
    );

    // Step 3: delete — assert axe on empty state restored
    await row.getByRole("button", { name: /delete es-3\.4\.a axe todo/i }).click();
    await expect(page.getByText("ES-3.4.a axe todo")).toHaveCount(0);
    await expect(page.getByTestId("todo-empty")).toBeVisible();
    assertNoCriticalViolations(
      await new AxeBuilder({ page }).analyze(),
      "empty state after delete",
    );
  });
});
