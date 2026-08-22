import { expect, test } from "@playwright/test";
import type { TypingTestStatus } from "../src/gameplay/TypingTestSession";
import type { VocabularyEntry } from "../src/vocabulary/types";

type TypingModalModule = typeof import("../src/ui/TypingTestModal");

test("打字測驗以 Enter 送出並只在 modal 內封鎖剪貼簿", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();

  await page.evaluate(async () => {
    const modulePath = "/src/ui/TypingTestModal.ts";
    const { TypingTestModal } = (await import(modulePath)) as TypingModalModule;
    const container = document.querySelector<HTMLElement>("#app")!;
    const entry = Object.freeze({
      id: "e2e-green",
      sourceEntryId: "source-e2e-green",
      sourceLevel: 1,
      sourceHeadword: "green",
      target: "GREEN",
      displayTarget: "GREEN",
      meaningZh: "綠色的",
      partOfSpeech: "adj.",
      pronunciation: null,
      tokens: Object.freeze([
        "G" as const,
        "R" as const,
        "E" as const,
        "E" as const,
        "N" as const,
      ]),
      tokenLength: 5,
      variants: Object.freeze(["GREEN"]),
      tags: Object.freeze([]),
      eligible: true,
      needsReview: false,
      reviewReasons: Object.freeze([]),
      normalizationNotes: Object.freeze([]),
    }) satisfies VocabularyEntry;
    const status = Object.freeze({
      state: "ACTIVE",
      remainingSeconds: 30,
      consecutiveSuccesses: 0,
      requiredConsecutiveSuccesses: 3,
      attemptCount: 0,
      latestAttempt: "NONE",
    }) satisfies TypingTestStatus;
    new TypingTestModal(container, entry, status, (value) => {
      container.dataset.typingSubmission = value;
    });
  });

  const modal = page.getByTestId("typing-test-modal");
  const input = page.getByTestId("typing-test-input");
  await expect(modal).toBeVisible();
  await expect(page.getByRole("heading", { name: "打字強化測驗" })).toBeVisible();
  await expect(page.getByTestId("typing-test-timer")).toHaveText("0:30");
  await expect(page.getByTestId("typing-test-streak")).toHaveText("0/3");
  await expect(input).toBeFocused();

  for (const eventType of ["copy", "cut", "paste"] as const) {
    const defaultPrevented = await input.evaluate((element, type) => {
      const event = new ClipboardEvent(type, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    }, eventType);
    expect(defaultPrevented).toBe(true);
  }

  const outsideDefaultPrevented = await page.evaluate(() => {
    const event = new ClipboardEvent("copy", { bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(outsideDefaultPrevented).toBe(false);

  await input.fill("  green  ");
  await input.press("Enter");
  await expect(page.locator("#app")).toHaveAttribute("data-typing-submission", "  green  ");
});
