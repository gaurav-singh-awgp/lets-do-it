import { test, expect } from "@playwright/test";

test.describe("web app shell", () => {
  test("loads the todo app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /todos/i })).toBeVisible();
  });
});
