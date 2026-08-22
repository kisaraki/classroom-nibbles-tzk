import { expect, test } from "@playwright/test";

type WeaponInputModule = typeof import("../src/input/WeaponInput");

test("空白鍵每次按下只觸發一次射擊並阻止頁面捲動", async ({ page }) => {
  await page.goto("./");
  await page.getByTestId("vocabulary-select").waitFor();

  const result = await page.evaluate(async () => {
    const modulePath = "/src/input/WeaponInput.ts";
    const { WeaponInput } = (await import(modulePath)) as WeaponInputModule;
    let fireCount = 0;
    const input = new WeaponInput(() => {
      fireCount += 1;
    });
    input.attach();
    const firstPress = new KeyboardEvent("keydown", {
      code: "Space",
      cancelable: true,
    });
    const repeatedPress = new KeyboardEvent("keydown", {
      code: "Space",
      cancelable: true,
      repeat: true,
    });
    window.dispatchEvent(firstPress);
    window.dispatchEvent(repeatedPress);
    input.detach();
    return {
      fireCount,
      firstPrevented: firstPress.defaultPrevented,
      repeatPrevented: repeatedPress.defaultPrevented,
    };
  });

  expect(result).toEqual({
    fireCount: 1,
    firstPrevented: true,
    repeatPrevented: true,
  });
});
