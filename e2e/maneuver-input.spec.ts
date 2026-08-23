import { expect, test } from "@playwright/test";

async function startRun(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("run-seed").fill("version-1-3-player-controls");
  await page.getByTestId("start-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
  await expect(page.getByTestId("transition-overlay")).toBeHidden();
}

test("J 鍵頭尾反轉脫困且只在機身執行後空翻", async ({ page }) => {
  await startRun(page);
  const heading = page.getByTestId("snake-heading");
  const canvas = page.getByTestId("phase-three-canvas");
  const hud = page.getByTestId("game-hud");
  await expect(heading).toHaveText("北");
  const headBeforeBackflip = Number(await hud.getAttribute("data-head-z"));

  await page.keyboard.press("j");
  await expect(canvas).toHaveAttribute("data-backflip-state", "active");
  await expect(canvas).toHaveAttribute("data-backflip-scope", "mecha");
  await expect(heading).toHaveText("南");
  await expect.poll(async () => Number(await hud.getAttribute("data-head-z")))
    .toBeGreaterThan(headBeforeBackflip + 4);

  await expect.poll(() => canvas.getAttribute("data-backflip-state")).toBe("idle");
  await expect(canvas).toHaveAttribute("data-backflip-progress", "0.000");
});

test("方向鍵固定使用玩家視角而非機頭相對方向", async ({ page }) => {
  await startRun(page);
  const heading = page.getByTestId("snake-heading");
  await expect(heading).toHaveText("北");

  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText("東");
  await page.waitForTimeout(300);

  await page.keyboard.press("ArrowDown");
  await expect(heading).toHaveText("南");
  await page.waitForTimeout(350);
  await expect(heading).toHaveText("南");
  await expect(page.getByTestId("game-hud")).toHaveAttribute(
    "data-safe-u-turn",
    "false",
  );
});
