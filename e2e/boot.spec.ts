import { expect, test } from "@playwright/test";

test("以中文介面選擇獨立字彙並開始第四階段", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("./");

  await expect(page).toHaveTitle("NIBBLES — 第四階段");
  await expect(page.getByTestId("vocabulary-select")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "NIBBLES" })).toBeVisible();
  await expect(page.getByText("字彙級別與遊戲關卡彼此獨立。", { exact: false })).toBeVisible();
  await expect(page.getByTestId("phase-three-data-version")).toContainText("1.0.0-phase0");
  await expect(page.getByTestId("vocabulary-error")).toBeHidden();
  await expect(page.getByTestId("phase-three-canvas")).toBeVisible();

  await page.getByTestId("vocabulary-mode").selectOption("CEEC_3");
  await page.getByTestId("run-seed").fill("phase-four-e2e");
  await page.getByTestId("start-run").click();

  await expect(page.getByTestId("vocabulary-select")).toBeHidden();
  await expect(page.getByTestId("phase-three-panel")).toBeVisible();
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
  await expect(page.getByTestId("game-level")).toContainText("第 1 關 · 貨艙");
  await expect(page.getByTestId("vocabulary-level")).toHaveText("CEEC 第 3 級");
  await expect(page.getByTestId("word-number")).toHaveText("1/25");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-token-count", "30");
  await expect(page.getByTestId("target-tokens").locator('[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByTestId("phase-message")).toBeHidden();
  await expect(page.getByTestId("no-progress-countdown")).toBeHidden();

  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("snake-heading")).toHaveText("東");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("snake-heading")).toHaveText("東");
  expect(pageErrors).toEqual([]);
});
