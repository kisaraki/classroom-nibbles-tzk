import { expect, test, type Page } from "@playwright/test";

async function startRun(page: Page): Promise<void> {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("run-seed").fill("table-motion-e2e");
  await page.getByTestId("start-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
}

async function shift(page: Page, type: "keydown" | "keyup", code: string) {
  await page.evaluate(({ eventType, eventCode }) => {
    window.dispatchEvent(new KeyboardEvent(eventType, {
      code: eventCode,
      key: "Shift",
      bubbles: true,
    }));
  }, { eventType: type, eventCode: code });
}

test("左右 Shift 分別抬高單側桌面，放開後停止側向重力", async ({ page }) => {
  await startRun(page);
  const canvas = page.getByTestId("phase-three-canvas");
  const hud = page.getByTestId("game-hud");
  const initialHeadX = Number(await hud.getAttribute("data-head-x"));

  await shift(page, "keydown", "ShiftLeft");
  await expect(canvas).toHaveAttribute("data-table-motion", "TILT_LEFT");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-table-motion",
    "TILT_LEFT",
  );
  await expect(page.getByTestId("table-motion-status")).toHaveText(
    "桌面：左側抬高",
  );
  await page.waitForTimeout(450);
  const leftTiltHeadX = Number(await hud.getAttribute("data-head-x"));
  expect(leftTiltHeadX).toBeGreaterThan(initialHeadX + 0.25);

  await shift(page, "keyup", "ShiftLeft");
  await expect(canvas).toHaveAttribute("data-table-motion", "LEVEL");
  await page.waitForTimeout(150);
  const releasedHeadX = Number(await hud.getAttribute("data-head-x"));
  await page.waitForTimeout(300);
  expect(Number(await hud.getAttribute("data-head-x"))).toBeCloseTo(
    releasedHeadX,
    2,
  );

  await shift(page, "keydown", "ShiftRight");
  await expect(canvas).toHaveAttribute("data-table-motion", "TILT_RIGHT");
  await page.waitForTimeout(350);
  expect(Number(await hud.getAttribute("data-head-x"))).toBeLessThan(
    leftTiltHeadX - 0.2,
  );
  await shift(page, "keyup", "ShiftRight");
  await expect(page.getByTestId("table-motion-status")).toHaveText("桌面：水平");
});

test("左右 Shift 同時按住會持續震桌，放開任一鍵立即停止", async ({ page }) => {
  await startRun(page);
  const canvas = page.getByTestId("phase-three-canvas");
  const initialTokenChecksum = await canvas.getAttribute(
    "data-token-position-checksum",
  );

  await shift(page, "keydown", "ShiftLeft");
  await shift(page, "keydown", "ShiftRight");
  await expect(canvas).toHaveAttribute("data-table-motion", "SHAKE");
  await expect(page.getByTestId("table-motion-status")).toContainText(
    "桌面：持續震動中",
  );

  await page.waitForTimeout(2_250);
  await expect(canvas).toHaveAttribute("data-table-motion", "SHAKE");
  expect(await canvas.getAttribute("data-token-position-checksum")).not.toBe(
    initialTokenChecksum,
  );

  await shift(page, "keyup", "ShiftRight");
  await expect(canvas).toHaveAttribute("data-table-motion", "TILT_LEFT");
  await expect(page.getByTestId("table-motion-status")).toHaveText(
    "桌面：左側抬高",
  );

  await shift(page, "keyup", "ShiftLeft");
  await expect(canvas).toHaveAttribute("data-table-motion", "LEVEL");
  await expect(page.getByTestId("table-motion-status")).toHaveText("桌面：水平");
});
