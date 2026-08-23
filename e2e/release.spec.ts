import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1920, height: 1080 } });

async function startReleaseRun(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("run-seed").fill("phase-nine-release");
  await page.getByTestId("start-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
  await expect(page.getByTestId("transition-overlay")).toBeHidden();
}

test("1920×1080 發行場景維持繪圖呼叫與幀率預算", async ({ page }) => {
  const pageErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") pageErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await startReleaseRun(page);
  const canvas = page.getByTestId("phase-three-canvas");
  await expect(canvas).toHaveAttribute("data-draw-call-count", /\d+/u);
  const drawCalls = Number(await canvas.getAttribute("data-draw-call-count"));
  expect(drawCalls).toBeGreaterThan(0);
  expect(drawCalls).toBeLessThan(30);

  const framesPerSecond = await page.evaluate(async () => {
    const sampleMilliseconds = 1_500;
    return await new Promise<number>((resolve) => {
      let frames = 0;
      const startedAt = performance.now();
      const measure = (now: number): void => {
        frames += 1;
        const elapsed = now - startedAt;
        if (elapsed >= sampleMilliseconds) {
          resolve((frames * 1_000) / elapsed);
          return;
        }
        requestAnimationFrame(measure);
      };
      requestAnimationFrame(measure);
    });
  });
  expect(framesPerSecond).toBeGreaterThanOrEqual(30);

  const viewport = await canvas.evaluate((element) => {
    const htmlCanvas = element as HTMLCanvasElement;
    const rectangle = element.getBoundingClientRect();
    return {
      cssWidth: rectangle.width,
      cssHeight: rectangle.height,
      renderWidth: htmlCanvas.width,
      renderHeight: htmlCanvas.height,
    };
  });
  expect(viewport.cssWidth).toBe(1920);
  expect(viewport.cssHeight).toBe(1080);
  expect(viewport.renderWidth).toBeGreaterThan(0);
  expect(viewport.renderHeight).toBeGreaterThan(0);
  expect(viewport.renderWidth * viewport.renderHeight).toBeGreaterThan(800 * 450);
  expect(viewport.renderWidth * viewport.renderHeight).toBeLessThanOrEqual(1152 * 648);
  expect(pageErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});

test("發行介面保有中文可及名稱、焦點與唯一識別碼", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();

  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant-TW");
  await expect(page.locator("#app")).toHaveAttribute("aria-label", "NIBBLES 遊戲");
  await expect(page.getByLabel("字彙模式")).toBeVisible();
  await expect(page.getByLabel("關卡種子")).toBeVisible();
  await expect(page.getByRole("button", { name: "開始字元獵取" })).toBeVisible();
  await expect(page.getByRole("button", { name: "關閉音效" })).toBeVisible();

  const duplicateIds = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const element of document.querySelectorAll<HTMLElement>("[id]")) {
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1);
  });
  expect(duplicateIds).toEqual([]);

  await startReleaseRun(page);
  await expect(page.getByTestId("phase-three-canvas")).toHaveAttribute(
    "aria-label",
    /第九階段.*貨艙/u,
  );
  await expect(page.getByTestId("target-tokens").locator('[aria-current="step"]')).toHaveCount(1);
  await page.keyboard.press("p");
  await expect(page.getByRole("heading", { name: "遊戲暫停" })).toBeVisible();
  await page.keyboard.press("p");
  await expect(page.locator("#app")).toHaveAttribute("data-game-state", "HUNTING");
});
