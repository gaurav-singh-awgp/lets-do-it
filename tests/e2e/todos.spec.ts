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

  test("delete todo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder(/what needs doing/i).fill("Temp item");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Temp item")).toBeVisible();
    await page.getByRole("button", { name: /delete temp item/i }).click();
    await expect(page.getByText("Temp item")).toHaveCount(0);
    await expect(page.getByTestId("todo-empty")).toBeVisible();
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
    await expect(page.getByRole("alert")).toContainText(
      "Server could not save this todo",
    );
  });
});
