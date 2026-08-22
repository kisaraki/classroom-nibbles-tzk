import { expect, test } from "@playwright/test";

test("boots the Phase 2 movement sandbox and accepts legal steering", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("./");

  await expect(page).toHaveTitle(/NIBBLES — Phase 2/i);
  await expect(page.getByRole("heading", { level: 1, name: "NIBBLES" })).toBeVisible();
  await expect(page.getByTestId("phase-two-panel")).toBeVisible();
  await expect(page.getByTestId("simulation-state")).toHaveText("HUNTING");
  await expect(page.getByTestId("phase-two-data-version")).toContainText("1.0.0-phase0");
  await expect(page.getByTestId("vocabulary-error")).toBeHidden();
  await expect(page.getByTestId("phase-two-canvas")).toBeVisible();

  const positionBeforeTurn = await page.getByTestId("head-position").textContent();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("snake-heading")).toHaveText("EAST");
  await page.waitForTimeout(150);
  await expect(page.getByTestId("head-position")).not.toHaveText(positionBeforeTurn ?? "");

  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("snake-heading")).toHaveText("EAST");
  await expect(page.getByTestId("snake-length")).toHaveText("8");
  await expect(page.getByTestId("latest-collision")).toHaveText("SOLID WALL", {
    timeout: 4_000,
  });
  expect(pageErrors).toEqual([]);
});
