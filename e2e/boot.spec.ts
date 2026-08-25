import { expect, test } from "@playwright/test";

test("以中文彈珠台介面選擇獨立字彙並開始深空貨艙環境", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("./");

  await expect(page).toHaveTitle("NIBBLES — 深空字彙任務");
  await expect(page.getByTestId("vocabulary-select")).toBeVisible();
  await expect(page.getByTestId("vocabulary-select")).toHaveAttribute(
    "data-visual-style",
    "classic-space-pinball",
  );
  await expect(page.getByRole("heading", { level: 1, name: "NIBBLES" })).toBeVisible();
  await expect(page.getByText("字彙級別與遊戲關卡彼此獨立。", { exact: false })).toBeVisible();
  await expect(page.getByLabel("關卡種子")).toHaveCount(0);
  await expect(page.getByText(/資料版本|NIBBLES 1\.9\.0/u)).toHaveCount(0);
  await expect(page.getByText("5 個單字", { exact: true })).toBeVisible();
  await expect(page.getByText("25 個單字", { exact: true })).toBeVisible();
  await expect(page.getByTestId("vocabulary-error")).toBeHidden();
  await expect(page.getByTestId("phase-three-canvas")).toBeVisible();
  await expect(page.getByTestId("deep-space-backdrop")).toBeVisible();
  await expect(page.getByTestId("deep-space-backdrop")).toHaveAttribute(
    "data-space-theme",
    "orbital-dock-nebula",
  );
  await expect(page.getByTestId("deep-space-backdrop")).toHaveAttribute(
    "data-art-style",
    "painted-pinball-backglass",
  );

  await page.getByTestId("vocabulary-mode").selectOption("CEEC_3");
  await page.getByTestId("start-run").click();

  await expect(page.getByTestId("vocabulary-select")).toBeHidden();
  await expect(page.getByTestId("game-hud")).toBeVisible();
  await expect(page.getByTestId("phase-three-panel")).toHaveCount(0);
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
  await expect(page.locator("#app")).toHaveAttribute("data-release-version", "1.9.0");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-visual-style",
    "classic-space-pinball",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-environment-theme",
    "cargo-bay",
  );
  expect(
    await page.locator("#app").evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--accent").trim()
    ),
  ).toBe("#35f2e0");
  expect(
    await page.locator("#app").evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--cabinet").trim()
    ),
  ).toBe("#173376");
  expect(
    await page.locator("#app").evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--rail").trim()
    ),
  ).toBe("#ff5a4f");
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
  await expect(page.getByTestId("snake-speed")).toHaveText("3.0 單位/秒");
  await expect(page.getByTestId("game-level")).toContainText("第 1 關 · 貨艙");
  await expect(page.getByTestId("vocabulary-level")).toHaveText("CEEC 第 3 級");
  await expect(page.getByTestId("scene-word-number")).toHaveText("1/5");
  await expect(page.getByTestId("word-number")).toHaveText("1/75");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-token-count", "30");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-power-up-count", "5");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-bullet-count", "0");
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute("data-camera-mode", "pinball-player");
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
    "data-space-theme",
    "orbital-dock-nebula",
  );
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute(
    "data-obstacle-count",
    "6",
  );
  await expect(page.getByTestId("pinball-table-overlay")).toBeVisible();
  await expect(page.getByTestId("pinball-table-overlay")).toHaveAttribute(
    "data-visual-style",
    "classic-space-pinball",
  );
  await expect(page.getByTestId("cockpit-overlay")).toHaveCount(0);
  await expect(page.getByTestId("mini-map")).toHaveCount(0);
  await expect(page.getByTestId("tactical-map-toggle")).toHaveCount(0);
  await expect(page.getByTestId("environment-feature")).toHaveText(
    "深空環境：青綠船塢星雲 · 貨櫃形成實體掩體",
  );
  await expect(page.getByTestId("ammo-count")).toHaveText("0");
  await expect(page.getByTestId("target-tokens").locator('[aria-current="step"]')).toHaveCount(1);
  await expect(page.getByTestId("phase-message")).toBeHidden();
  await expect(page.getByTestId("no-progress-countdown")).toHaveCount(0);
  await expect(page.getByText(/第九階段|\/ 09|資料版本/u)).toHaveCount(0);

  await page.keyboard.press("m");
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
  expect(pageErrors).toEqual([]);
});

test("資訊直接配置於主遊戲畫面且不再建立側欄或雷達", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("start-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");

  const hud = page.getByTestId("game-hud");
  await expect(hud).toBeVisible();
  expect(
    await hud.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
  await expect(page.getByTestId("phase-three-panel")).toHaveCount(0);
  await expect(page.getByTestId("mini-map")).toHaveCount(0);
  await expect(page.getByTestId("target-tokens")).toBeVisible();
  await expect(page.getByTestId("main-timer")).toBeVisible();
});
