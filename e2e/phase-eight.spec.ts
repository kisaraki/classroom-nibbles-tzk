import { expect, test } from "@playwright/test";

async function startRun(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.getByTestId("run-seed").fill("phase-eight-presentation");
  await page.getByTestId("start-run").click();
  await expect(page.getByTestId("transition-overlay")).toHaveAttribute(
    "data-mode",
    "scene",
  );
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
  await expect(page.getByTestId("transition-overlay")).toBeHidden();
}

test("P 鍵以艙門轉場暫停並在開門後精確恢復", async ({ page }) => {
  await startRun(page);

  await page.keyboard.press("p");
  const overlay = page.getByTestId("transition-overlay");
  await expect(page.getByTestId("simulation-state")).toHaveText("暫停");
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute("data-mode", "pause");
  await expect(page.getByTestId("transition-title")).toHaveText("遊戲暫停");
  await expect(overlay).toHaveAttribute("data-door", "closed");

  const pausedHeadZ = await page.getByTestId("mini-map").getAttribute("data-head-z");
  await page.waitForTimeout(350);
  await expect(page.getByTestId("mini-map")).toHaveAttribute(
    "data-head-z",
    pausedHeadZ!,
  );

  await page.keyboard.press("p");
  await expect(overlay).toHaveAttribute("data-door", "open");
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
  await expect(overlay).toBeHidden();
});

test("頁面隱藏會自動暫停且不會自行恢復", async ({ page }) => {
  await startRun(page);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByTestId("simulation-state")).toHaveText("暫停");
  await expect(page.getByTestId("transition-subtitle")).toContainText("自動暫停");

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByTestId("simulation-state")).toHaveText("暫停");
  await page.keyboard.press("p");
  await expect(page.getByTestId("simulation-state")).toHaveText("進行中");
});

test("中文音效控制會保存靜音偏好", async ({ page }) => {
  await page.goto("./");
  const audio = page.getByTestId("audio-control");
  await expect(audio).toHaveText("音效：開");
  await audio.click();
  await expect(audio).toHaveText("音效：關");
  await page.reload();
  await expect(page.getByTestId("audio-control")).toHaveText("音效：關");
});

test("完成畫面顯示 KOSMOS TOOLKITS 製作名單並提供重玩入口", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();
  await page.evaluate(async () => {
    const modulePath = "/src/ui/CreditsScreen.ts";
    const { CreditsScreen } = (await import(modulePath)) as typeof import(
      "../src/ui/CreditsScreen"
    );
    const container = document.querySelector<HTMLElement>("#app")!;
    new CreditsScreen(container, () => {
      container.dataset.replayRequested = "true";
    });
  });

  const credits = page.getByTestId("credits-screen");
  await expect(credits).toBeVisible();
  await expect(credits.getByText("KOSMOS TOOLKITS")).toBeVisible();
  await expect(credits.getByText("探真拓知酷")).toBeVisible();
  await expect(credits.getByText("25/25")).toBeVisible();
  await page.getByTestId("replay-run").click();
  await expect(page.locator("#app")).toHaveAttribute("data-replay-requested", "true");
});
