import { expect, test } from "@playwright/test";

test("以中文座艙介面選擇獨立字彙並開始第九階段貨艙環境", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("./");

  await expect(page).toHaveTitle("NIBBLES — 第九階段");
  await expect(page.getByTestId("vocabulary-select")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "NIBBLES" })).toBeVisible();
  await expect(page.getByText("字彙級別與遊戲關卡彼此獨立。", { exact: false })).toBeVisible();
  await expect(page.getByTestId("phase-three-data-version")).toContainText("1.0.0-phase0");
  await expect(page.getByTestId("phase-three-data-version")).toContainText("NIBBLES 1.0.0");
  await expect(page.getByTestId("vocabulary-error")).toBeHidden();
  await expect(page.getByTestId("phase-three-canvas")).toBeVisible();

  await page.getByTestId("vocabulary-mode").selectOption("CEEC_3");
  await page.getByTestId("run-seed").fill("phase-seven-e2e");
  await page.getByTestId("start-run").click();

  await expect(page.getByTestId("vocabulary-select")).toBeHidden();
  await expect(page.getByTestId("phase-three-panel")).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
  await expect(page.locator("#app")).toHaveAttribute("data-release-version", "1.0.0");
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
  await expect(page.getByTestId("game-level")).toContainText("第 1 關 · 貨艙");
  await expect(page.getByTestId("vocabulary-level")).toHaveText("CEEC 第 3 級");
  await expect(page.getByTestId("word-number")).toHaveText("1/25");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-token-count", "30");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-power-up-count", "5");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-bullet-count", "0");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-camera-mode", "snake-eye");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-camera-count", "1");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute(
    "data-environment-kind",
    "cargo-bay",
  );
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute(
    "data-environment-name",
    "貨艙",
  );
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute(
    "data-obstacle-count",
    "6",
  );
  await expect(page.getByTestId("cockpit-overlay")).toBeVisible();
  await expect(page.getByTestId("mini-map")).toBeVisible();
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-snake-points", "8");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-token-count", "30");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-power-up-count", "5");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-obstacle-count", "6");
  await expect(page.getByTestId("environment-feature")).toHaveText(
    "環境機制：貨櫃形成實體掩體",
  );
  await expect(page.getByTestId("ammo-count")).toHaveText("0");
  await expect(page.getByTestId("target-tokens").locator('[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByTestId("phase-message")).toBeHidden();
  await expect(page.getByTestId("no-progress-countdown")).toHaveCount(0);

  await page.getByTestId("tactical-map-toggle").click();
  await expect(page.getByTestId("simulation-state")).toHaveText("戰術地圖");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-expanded", "true");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-time-scale", "0.25");
  await expect(page.getByTestId("tactical-map-status")).toContainText("0.25×");
  const expandedHeadZ = await page.getByTestId("mini-map").getAttribute("data-head-z");
  await expect.poll(
    () => page.getByTestId("mini-map").getAttribute("data-head-z"),
  ).not.toBe(expandedHeadZ);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-expanded", "false");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-time-scale", "1");
  await page.keyboard.press("m");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-expanded", "true");
  await page.keyboard.press("m");
  await expect(page.getByTestId("mini-map")).toHaveAttribute("data-expanded", "false");

  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowDown" }));
  });
  await expect(page.getByTestId("snake-heading")).toHaveText("東");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("snake-heading")).toHaveText("東");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-bullet-count", "0");
  await expect(page.getByTestId("ammo-count")).toHaveText("0");
  expect(pageErrors).toEqual([]);
});
