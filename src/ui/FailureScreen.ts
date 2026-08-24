export interface FailureSummary {
  readonly gameLevel: number;
  readonly sceneName: string;
  readonly wordNumber: number;
  readonly totalWords: number;
}

export type FailureExitListener = () => void;

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

export class FailureScreen {
  readonly #element: HTMLElement;
  readonly #exitButton: HTMLButtonElement;
  readonly #listener: FailureExitListener;

  constructor(
    container: HTMLElement,
    summary: FailureSummary,
    listener: FailureExitListener,
  ) {
    this.#listener = listener;
    this.#element = createElement("section", "failure-screen");
    this.#element.dataset.testid = "failure-screen";
    this.#element.setAttribute("role", "alertdialog");
    this.#element.setAttribute("aria-modal", "true");
    this.#element.setAttribute("aria-labelledby", "failure-title");
    this.#element.setAttribute("aria-describedby", "failure-description");

    const panel = createElement("div", "failure-screen__panel");
    const title = createElement(
      "h1",
      "failure-screen__title",
      `第 ${summary.gameLevel} 關未完成`,
    );
    title.id = "failure-title";
    const description = createElement(
      "p",
      "failure-screen__description",
      "本關主計時已結束。碰撞不會造成死亡；調整路線後即可重新出發。",
    );
    description.id = "failure-description";
    panel.append(
      createElement("p", "failure-screen__eyebrow", "深空任務回報"),
      createElement("p", "failure-screen__status", "時間結束"),
      title,
      createElement("p", "failure-screen__scene", summary.sceneName),
      description,
      createElement(
        "p",
        "failure-screen__progress",
        `任務進度：第 ${summary.wordNumber}/${summary.totalWords} 個單字`,
      ),
    );

    this.#exitButton = createElement(
      "button",
      "failure-screen__exit",
      "返回任務設定",
    );
    this.#exitButton.type = "button";
    this.#exitButton.dataset.testid = "failure-return";
    this.#exitButton.addEventListener("click", this.#onExit);
    panel.append(this.#exitButton);
    this.#element.append(panel);
    container.append(this.#element);
    queueMicrotask(() => this.#exitButton.focus());
  }

  dispose(): void {
    this.#exitButton.removeEventListener("click", this.#onExit);
    this.#element.remove();
  }

  readonly #onExit = (): void => {
    this.#listener();
  };
}
