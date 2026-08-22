import {
  TypingAttemptKind,
  TypingTestState,
  type TypingTestStatus,
} from "../gameplay/TypingTestSession";
import type { VocabularyEntry } from "../vocabulary/types";

export type TypingSubmitListener = (value: string) => void;

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

function formatTime(seconds: number): string {
  return `0:${String(Math.max(0, Math.ceil(seconds))).padStart(2, "0")}`;
}

export class TypingTestModal {
  readonly #element: HTMLElement;
  readonly #form: HTMLFormElement;
  readonly #input: HTMLInputElement;
  readonly #timer: HTMLElement;
  readonly #streak: HTMLElement;
  readonly #feedback: HTMLElement;
  readonly #listener: TypingSubmitListener;

  constructor(
    container: HTMLElement,
    entry: VocabularyEntry,
    initialStatus: TypingTestStatus,
    listener: TypingSubmitListener,
  ) {
    this.#listener = listener;
    this.#element = createElement("section", "typing-test-modal");
    this.#element.dataset.testid = "typing-test-modal";
    this.#element.setAttribute("role", "dialog");
    this.#element.setAttribute("aria-modal", "true");
    this.#element.setAttribute("aria-labelledby", "typing-test-title");

    const panel = createElement("div", "typing-test-modal__panel");
    const heading = createElement("h2", "typing-test-modal__title", "打字強化測驗");
    heading.id = "typing-test-title";
    panel.append(
      createElement("p", "typing-test-modal__eyebrow", "打字強化 / 04"),
      heading,
      createElement(
        "p",
        "typing-test-modal__intro",
        "請在 30 秒內連續正確輸入目標單字 3 次。任何錯誤都會將連續次數歸零。",
      ),
    );

    const target = createElement("article", "typing-test-modal__target");
    target.append(
      createElement("p", "typing-test-modal__label", "目標單字"),
      createElement("p", "typing-test-modal__word", entry.displayTarget),
      createElement("p", "typing-test-modal__meaning", entry.meaningZh),
    );
    if (entry.partOfSpeech) {
      target.append(createElement("p", "typing-test-modal__part-of-speech", entry.partOfSpeech));
    }

    const metrics = createElement("dl", "typing-test-modal__metrics");
    this.#timer = this.#appendMetric(metrics, "剩餘時間", "0:30", "typing-test-timer");
    this.#streak = this.#appendMetric(metrics, "連續正確", "0/3", "typing-test-streak");

    this.#form = createElement("form", "typing-test-modal__form");
    const field = createElement("label", "typing-test-modal__field");
    field.append(createElement("span", "typing-test-modal__label", "輸入目標單字"));
    this.#input = createElement("input", "typing-test-modal__input");
    this.#input.dataset.testid = "typing-test-input";
    this.#input.name = "typing-answer";
    this.#input.type = "text";
    this.#input.autocomplete = "off";
    this.#input.autocapitalize = "off";
    this.#input.spellcheck = false;
    this.#input.setAttribute("aria-describedby", "typing-test-feedback typing-test-clipboard");
    field.append(this.#input);
    const submit = createElement("button", "typing-test-modal__submit", "送出答案");
    submit.type = "submit";
    submit.dataset.testid = "typing-test-submit";
    this.#feedback = createElement("p", "typing-test-modal__feedback");
    this.#feedback.id = "typing-test-feedback";
    this.#feedback.dataset.testid = "typing-test-feedback";
    this.#feedback.setAttribute("role", "status");
    this.#feedback.setAttribute("aria-live", "polite");
    const clipboardNotice = createElement(
      "p",
      "typing-test-modal__clipboard",
      "為確保練習效果，本測驗視窗內已停用剪下、複製與貼上。",
    );
    clipboardNotice.id = "typing-test-clipboard";
    this.#form.append(field, submit, this.#feedback, clipboardNotice);

    panel.append(target, metrics, this.#form);
    this.#element.append(panel);
    container.append(this.#element);
    this.#form.addEventListener("submit", this.#onSubmit);
    this.#element.addEventListener("copy", this.#blockClipboard);
    this.#element.addEventListener("cut", this.#blockClipboard);
    this.#element.addEventListener("paste", this.#blockClipboard);
    this.update(initialStatus);
    queueMicrotask(() => this.#input.focus());
  }

  update(status: TypingTestStatus): void {
    this.#element.dataset.state = status.state;
    this.#element.dataset.warning = String(
      status.state === TypingTestState.ACTIVE && status.remainingSeconds <= 10,
    );
    this.#timer.textContent = formatTime(status.remainingSeconds);
    this.#streak.textContent =
      `${status.consecutiveSuccesses}/${status.requiredConsecutiveSuccesses}`;
    if (status.latestAttempt === TypingAttemptKind.CORRECT) {
      this.#feedback.textContent =
        `輸入正確，已連續答對 ${status.consecutiveSuccesses} 次。`;
    } else if (status.latestAttempt === TypingAttemptKind.WRONG) {
      this.#feedback.textContent = "輸入錯誤，連續正確次數已歸零。";
    } else if (status.latestAttempt === TypingAttemptKind.TIMED_OUT) {
      this.#feedback.textContent = "測驗時間結束，返回遊戲重新收集最後一個字元。";
    } else {
      this.#feedback.textContent = "輸入後按 Enter 或選擇「送出答案」。";
    }
  }

  dispose(): void {
    this.#form.removeEventListener("submit", this.#onSubmit);
    this.#element.removeEventListener("copy", this.#blockClipboard);
    this.#element.removeEventListener("cut", this.#blockClipboard);
    this.#element.removeEventListener("paste", this.#blockClipboard);
    this.#element.remove();
  }

  readonly #onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    const value = this.#input.value;
    this.#input.value = "";
    this.#listener(value);
    this.#input.focus();
  };

  readonly #blockClipboard = (event: ClipboardEvent): void => {
    event.preventDefault();
  };

  #appendMetric(
    list: HTMLDListElement,
    label: string,
    initialValue: string,
    testId: string,
  ): HTMLElement {
    const metric = createElement("div", "typing-test-modal__metric");
    metric.append(createElement("dt", "typing-test-modal__metric-label", label));
    const value = createElement("dd", "typing-test-modal__metric-value", initialValue);
    value.dataset.testid = testId;
    metric.append(value);
    list.append(metric);
    return value;
  }
}
