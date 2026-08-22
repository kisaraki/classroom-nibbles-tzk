import { APP_CONFIG } from "../core/Config";

export type ReplayListener = () => void;

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

export class CreditsScreen {
  readonly #element: HTMLElement;
  readonly #replayButton: HTMLButtonElement;
  readonly #listener: ReplayListener;

  constructor(container: HTMLElement, listener: ReplayListener) {
    this.#listener = listener;
    this.#element = createElement("section", "credits-screen");
    this.#element.dataset.testid = "credits-screen";
    this.#element.setAttribute("aria-labelledby", "credits-title");

    const panel = createElement("div", "credits-screen__panel");
    panel.append(
      createElement("p", "credits-screen__eyebrow", "任務紀錄 / 08"),
      createElement("p", "credits-screen__status", "MISSION COMPLETE"),
    );
    const title = createElement("h1", "credits-screen__title", APP_CONFIG.title);
    title.id = "credits-title";
    panel.append(
      title,
      createElement(
        "p",
        "credits-screen__summary",
        "你已穿越五個環境，完成二十五個單字與每次三連續正確的打字強化。",
      ),
    );

    const metrics = createElement("dl", "credits-screen__metrics");
    for (const [label, value] of [
      ["環境", "5/5"],
      ["單字", "25/25"],
      ["打字強化", "全數完成"],
    ] as const) {
      const metric = createElement("div", "credits-screen__metric");
      metric.append(
        createElement("dt", "credits-screen__metric-label", label),
        createElement("dd", "credits-screen__metric-value", value),
      );
      metrics.append(metric);
    }

    const credit = createElement("div", "credits-screen__credit");
    credit.append(
      createElement("p", "credits-screen__credit-label", "設計與製作"),
      createElement("p", "credits-screen__credit-name", "KOSMOS TOOLKITS"),
      createElement("p", "credits-screen__credit-zh", "探真拓知酷"),
    );

    this.#replayButton = createElement(
      "button",
      "credits-screen__replay",
      "返回任務設定",
    );
    this.#replayButton.type = "button";
    this.#replayButton.dataset.testid = "replay-run";
    this.#replayButton.addEventListener("click", this.#onReplay);
    panel.append(metrics, credit, this.#replayButton);
    this.#element.append(panel);
    container.append(this.#element);
    queueMicrotask(() => this.#replayButton.focus());
  }

  dispose(): void {
    this.#replayButton.removeEventListener("click", this.#onReplay);
    this.#element.remove();
  }

  readonly #onReplay = (): void => {
    this.#listener();
  };
}
