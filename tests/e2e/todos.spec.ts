import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("todo journeys", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/todos`);
    expect(listRes.ok()).toBeTruthy();
    const todos = (await listRes.json()) as { id: string }[];
    for (const t of todos) {
      const del = await request.delete(`${API_BASE}/api/v1/todos/${t.id}`);
      expect([204, 404]).toContain(del.status());
    }
  });

  test("empty state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("todo-empty")).toBeVisible();
  });

  test("create todo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/what needs doing/i).fill("Buy oat milk");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Buy oat milk")).toBeVisible();
    await expect(page.getByTestId("todo-empty")).toHaveCount(0);
    const first = page.getByRole("list", { name: /todo list/i }).locator("li").first();
    await expect(first).toContainText("Buy oat milk");
  });

  test("complete todo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/what needs doing/i).fill("Walk dog");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Walk dog")).toBeVisible();
    const item = page.locator("li").filter({ hasText: "Walk dog" });
    await item.getByRole("checkbox").click();
    await expect(item.getByRole("checkbox")).toBeChecked();
  });

  test("ES-2.3.a / ES-2.4.a: delete todo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/what needs doing/i).fill("Temp item");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Temp item")).toBeVisible();
    await page.getByRole("button", { name: /delete temp item/i }).click();
    await expect(page.getByText("Temp item")).toHaveCount(0);
    await expect(page.getByTestId("todo-empty")).toBeVisible();
  });

  test("ES-3.2.a: keyboard Space on checkbox toggles done styling", async ({ page }) => {
    let patchCalls = 0;
    await page.route("**/api/v1/todos/*", async (route) => {
      if (route.request().method() === "PATCH") {
        patchCalls += 1;
      }
      await route.continue();
    });

    await page.goto("/");
    await page.getByPlaceholder(/what needs doing/i).fill("Keyboard toggle test");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Keyboard toggle test")).toBeVisible();

    const row = page.locator("li").filter({ hasText: "Keyboard toggle test" });
    const checkbox = row.getByRole("checkbox", {
      name: /toggle done for keyboard toggle test/i,
    });
    await checkbox.focus();
    await page.keyboard.press("Space");

    await expect(checkbox).toBeChecked();
    await expect(row.locator(".todo-text.done")).toContainText("Keyboard toggle test");
    expect(patchCalls).toBeGreaterThan(0);
  });

  test("error handling on create", async ({ page }) => {
    await page.route("**/api/v1/todos", async (route) => {
      const req = route.request();
      if (req.method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "VALIDATION",
              message: "Server could not save this todo",
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/");
    await page.getByPlaceholder(/what needs doing/i).fill("Bad");
    await page.getByRole("button", { name: /^add$/i }).click();
    const createAlert = page.getByRole("alert").filter({
      hasText: "Server could not save this todo",
    });
    await expect(createAlert).toBeVisible();
  });
});
