import { APP_CONFIG } from "../core/Config";
import { CEEC_LEVELS, type VocabularyMetadata } from "../vocabulary/types";

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

function setValue(element: HTMLElement, value: string | number): void {
  element.textContent = String(value);
}

export class BootScreen {
  readonly #element: HTMLElement;
  readonly #status: HTMLElement;
  readonly #dataVersion: HTMLElement;
  readonly #totalEntries: HTMLElement;
  readonly #eligibleEntries: HTMLElement;
  readonly #levelCounts = new Map<number, HTMLElement>();
  readonly #errorPanel: HTMLElement;
  readonly #errorMessage: HTMLElement;

  constructor(container: HTMLElement) {
    this.#element = createElement("section", "boot-screen");
    this.#element.dataset.testid = "boot-screen";

    const eyebrow = createElement("p", "boot-screen__eyebrow", "系統啟動 / 06");
    const heading = createElement("h1", "boot-screen__title", APP_CONFIG.title);
    const phase = createElement("p", "boot-screen__phase", `${APP_CONFIG.phaseLabel} — 資料連線`);

    this.#status = createElement("p", "boot-screen__status", "正在載入字彙資料…");
    this.#status.dataset.testid = "boot-status";
    this.#status.setAttribute("role", "status");

    const summary = createElement("dl", "boot-screen__summary");
    this.#dataVersion = this.#appendMetric(summary, "資料版本", "—", "data-version");
    this.#totalEntries = this.#appendMetric(summary, "字彙總數", "—", "total-entries");
    this.#eligibleEntries = this.#appendMetric(
      summary,
      "可遊玩字彙",
      "—",
      "eligible-entries",
    );

    const levelHeading = createElement("h2", "boot-screen__level-heading", "CEEC 級別索引");
    const levelGrid = createElement("div", "boot-screen__levels");
    for (const level of CEEC_LEVELS) {
      const card = createElement("article", "level-card");
      card.append(createElement("h3", "level-card__name", `CEEC 第 ${level} 級`));
      const count = createElement("p", "level-card__count", "—");
      count.dataset.testid = `level-${level}-count`;
      card.append(count);
      this.#levelCounts.set(level, count);
      levelGrid.append(card);
    }

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
      summary,
      levelHeading,
      levelGrid,
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

  showMetadata(metadata: VocabularyMetadata): void {
    this.#element.dataset.state = "ready";
    this.#status.textContent = "字彙資料已就緒";
    setValue(this.#dataVersion, metadata.dataVersion);
    setValue(this.#totalEntries, metadata.totalEntries.toLocaleString("en-US"));
    setValue(this.#eligibleEntries, metadata.eligibleEntries.toLocaleString("en-US"));
    for (const level of CEEC_LEVELS) {
      const count = metadata.levels[level];
      setValue(
        this.#levelCounts.get(level)!,
        `${count.eligible.toLocaleString("zh-TW")} 筆可用`,
      );
    }
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

  #appendMetric(
    list: HTMLDListElement,
    label: string,
    initialValue: string,
    testId: string,
  ): HTMLElement {
    const group = createElement("div", "boot-screen__metric");
    group.append(createElement("dt", "boot-screen__metric-label", label));
    const value = createElement("dd", "boot-screen__metric-value", initialValue);
    value.dataset.testid = testId;
    group.append(value);
    list.append(group);
    return value;
  }
}
