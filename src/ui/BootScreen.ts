import { APP_CONFIG } from "../core/Config";

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

export class BootScreen {
  readonly #element: HTMLElement;
  readonly #status: HTMLElement;
  readonly #errorPanel: HTMLElement;
  readonly #errorMessage: HTMLElement;

  constructor(container: HTMLElement) {
    this.#element = createElement("section", "boot-screen");
    this.#element.dataset.testid = "boot-screen";

    const eyebrow = createElement("p", "boot-screen__eyebrow", "深空航行準備");
    const heading = createElement("h1", "boot-screen__title", APP_CONFIG.title);
    const phase = createElement(
      "p",
      "boot-screen__phase",
      "正在校準星圖與字彙庫",
    );

    this.#status = createElement("p", "boot-screen__status", "正在載入字彙資料…");
    this.#status.dataset.testid = "boot-status";
    this.#status.setAttribute("role", "status");

    this.#errorMessage = createElement("p", "boot-error__message");
    this.#errorPanel = createElement("aside", "boot-error");
    this.#errorPanel.dataset.testid = "vocabulary-error";
    this.#errorPanel.setAttribute("role", "alert");
    this.#errorPanel.hidden = true;
    this.#errorPanel.append(
      createElement("h2", "boot-error__title", "字彙資料連線失敗"),
      this.#errorMessage,
    );

    const panel = createElement("div", "boot-screen__panel");
    panel.append(
      eyebrow,
      heading,
      phase,
      this.#status,
      this.#errorPanel,
    );
    this.#element.append(panel);
    container.append(this.#element);
  }

  setLoading(): void {
    this.#element.dataset.state = "loading";
    this.#status.textContent = "正在載入字彙資料…";
    this.#errorPanel.hidden = true;
  }

  showError(error: unknown): void {
    console.error("字彙資料載入失敗", error);
    this.#element.hidden = false;
    this.#element.dataset.state = "error";
    this.#status.textContent = "系統啟動異常";
    this.#errorMessage.textContent = "無法載入字彙資料，請重新整理頁面後再試。";
    this.#errorPanel.hidden = false;
  }

  hide(): void {
    this.#element.hidden = true;
  }

}
