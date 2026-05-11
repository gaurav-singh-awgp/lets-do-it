import { expect, test } from "@playwright/test";

test.describe("todo journeys", () => {
  test("ES-1.4.b error path + recovery via Retry", async ({ page }) => {
    // Mode flag driven by the test (not by request counts) so any incidental
    // GET during the failure phase still returns 500. Recovery only happens
    // after the test flips `mode` before clicking Retry.
    let mode: "fail" | "ok" = "fail";
    await page.route("**/api/v1/todos", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      if (mode === "fail") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "INTERNAL",
              message: "Server unavailable",
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText("Server unavailable");
    mode = "ok";
    await page.getByRole("button", { name: /retry/i }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByTestId("todo-empty")).toBeVisible();
  });
});
