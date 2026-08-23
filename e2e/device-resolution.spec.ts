import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 640, height: 360 },
  deviceScaleFactor: 2,
});

test("WebGL 與雷達自動使用裝置的完整像素比", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("run-seed").fill("native-device-resolution");
  await page.getByTestId("start-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");

  const canvas = page.getByTestId("phase-three-canvas");
  await expect(canvas).toHaveAttribute("data-render-pixel-ratio", "2.000");
  await expect(canvas).toHaveAttribute("data-render-width", "1280");
  await expect(canvas).toHaveAttribute("data-render-height", "720");
  await expect(page.getByTestId("mini-map")).toHaveAttribute(
    "data-render-pixel-ratio",
    "2.000",
  );

  const radarResolution = await page.getByTestId("radar-canvas").evaluate((element) => {
    const radar = element as HTMLCanvasElement;
    const rectangle = radar.getBoundingClientRect();
    return {
      cssWidth: rectangle.width,
      cssHeight: rectangle.height,
      renderWidth: radar.width,
      renderHeight: radar.height,
      devicePixelRatio: window.devicePixelRatio,
    };
  });
  expect(radarResolution.renderWidth).toBeGreaterThanOrEqual(
    Math.round(radarResolution.cssWidth * radarResolution.devicePixelRatio),
  );
  expect(radarResolution.renderHeight).toBeGreaterThanOrEqual(
    Math.round(radarResolution.cssHeight * radarResolution.devicePixelRatio),
  );
});
