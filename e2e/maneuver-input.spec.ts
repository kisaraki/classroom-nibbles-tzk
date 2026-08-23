import { expect, test } from "@playwright/test";

async function startRun(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("run-seed").fill("version-1-1-maneuvers");
  await page.getByTestId("start-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
  await expect(page.getByTestId("transition-overlay")).toBeHidden();
}

test("向下鍵安全後退且 J 鍵執行第一人稱後空翻", async ({ page }) => {
  await startRun(page);
  const heading = page.getByTestId("snake-heading");
  const canvas = page.getByTestId("phase-three-canvas");
  await expect(heading).toHaveText("北");

  await page.keyboard.press("ArrowDown");
  await expect.poll(() => heading.textContent()).toBe("南");
  await expect(page.getByTestId("phase-three-panel")).toHaveAttribute(
    "data-backward-maneuver",
    "false",
  );

  await page.keyboard.press("ArrowUp");
  await expect(heading).toHaveText("南");

  await page.keyboard.press("j");
  await expect(canvas).toHaveAttribute("data-backflip-state", "active");
  await expect.poll(() => canvas.getAttribute("data-backflip-state")).toBe("idle");
  await expect(canvas).toHaveAttribute("data-backflip-progress", "0.000");
});
