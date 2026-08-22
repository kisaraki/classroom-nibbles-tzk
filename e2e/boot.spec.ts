import { expect, test } from "@playwright/test";

test("selects vocabulary independently and boots the Phase 3 token hunt", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("./");

  await expect(page).toHaveTitle(/NIBBLES — Phase 3/i);
  await expect(page.getByTestId("vocabulary-select")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "NIBBLES" })).toBeVisible();
  await expect(page.getByTestId("phase-three-data-version")).toContainText("1.0.0-phase0");
  await expect(page.getByTestId("vocabulary-error")).toBeHidden();
  await expect(page.getByTestId("phase-three-canvas")).toBeVisible();

  await page.getByTestId("vocabulary-mode").selectOption("CEEC_3");
  await page.getByTestId("run-seed").fill("phase-three-e2e");
  await page.getByTestId("start-run").click();

  await expect(page.getByTestId("vocabulary-select")).toBeHidden();
  await expect(page.getByTestId("phase-three-panel")).toBeVisible();
  await expect(page.getByTestId("simulation-state")).toHaveText("HUNTING");
  await expect(page.getByTestId("game-level")).toContainText("L1 · Cargo Bay");
  await expect(page.getByTestId("vocabulary-level")).toHaveText("CEEC Level 3");
  await expect(page.getByTestId("word-number")).toHaveText("1/25");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-token-count", "30");
  await expect(page.getByTestId("target-tokens").locator('[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByTestId("phase-message")).toBeHidden();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("snake-heading")).toHaveText("EAST");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("snake-heading")).toHaveText("EAST");
  expect(pageErrors).toEqual([]);
});
