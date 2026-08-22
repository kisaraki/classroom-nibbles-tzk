import { expect, test } from "@playwright/test";

test("boots Three.js and loads Phase 0 vocabulary metadata", async ({ page }) => {
  await page.goto("./");

  await expect(page).toHaveTitle(/NIBBLES/i);
  await expect(page.getByRole("heading", { level: 1, name: "NIBBLES" })).toBeVisible();
  await expect(page.getByTestId("phase-1-boot")).toBeVisible();
  await expect(page.getByTestId("boot-status")).toHaveText("DATASET ONLINE");
  await expect(page.getByTestId("data-version")).not.toHaveText("—");
  await expect(page.getByTestId("total-entries")).not.toHaveText("—");
  await expect(page.getByTestId("vocabulary-error")).toBeHidden();
  await expect(page.locator("canvas.smoke-scene")).toBeVisible();
});
