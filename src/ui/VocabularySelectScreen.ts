import { APP_CONFIG, GAME_LEVEL_CONFIGS } from "../core/Config";
import {
  VOCABULARY_MODE_OPTIONS,
  VocabularyMode,
  vocabularyModeLabel,
  type VocabularyMode as VocabularyModeValue,
} from "../vocabulary/VocabularyMode";

export interface VocabularySelection {
  readonly mode: VocabularyModeValue;
}

export type VocabularySelectionListener = (selection: VocabularySelection) => void;

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

export class VocabularySelectScreen {
  readonly #element: HTMLElement;
  readonly #form: HTMLFormElement;
  readonly #mode: HTMLSelectElement;
  readonly #error: HTMLElement;
  readonly #listener: VocabularySelectionListener;

  constructor(
    container: HTMLElement,
    listener: VocabularySelectionListener,
  ) {
    this.#listener = listener;
    this.#element = createElement("section", "vocabulary-select");
    this.#element.dataset.testid = "vocabulary-select";
    const panel = createElement("div", "vocabulary-select__panel");
    panel.append(
      createElement("p", "vocabulary-select__eyebrow", "深空字彙任務"),
      createElement("h1", "vocabulary-select__title", APP_CONFIG.title),
      createElement("p", "vocabulary-select__phase", "選擇航行字彙"),
      createElement(
        "p",
        "vocabulary-select__intro",
        "字彙級別與遊戲關卡彼此獨立。選擇字彙來源後，系統會自動建立不重複的五關深空任務。",
      ),
    );

    const route = createElement("ol", "vocabulary-select__route");
    for (const level of GAME_LEVEL_CONFIGS) {
      const item = createElement("li", "vocabulary-select__route-item");
      item.append(
        createElement("span", "vocabulary-select__route-level", `第 ${level.gameLevel} 關`),
        createElement("strong", "vocabulary-select__route-count", `${level.wordsPerScene} 個單字`),
      );
      route.append(item);
    }
    panel.append(route);

    this.#form = createElement("form", "vocabulary-select__form");
    const modeLabel = createElement("label", "vocabulary-select__field");
    modeLabel.append(createElement("span", "vocabulary-select__label", "字彙模式"));
    this.#mode = createElement("select", "vocabulary-select__input");
    this.#mode.dataset.testid = "vocabulary-mode";
    this.#mode.name = "vocabulary-mode";
    for (const mode of VOCABULARY_MODE_OPTIONS) {
      const option = createElement("option", undefined, vocabularyModeLabel(mode));
      option.value = mode;
      option.selected = mode === VocabularyMode.CEEC_1;
      this.#mode.append(option);
    }
    modeLabel.append(this.#mode);

    const submit = createElement("button", "vocabulary-select__submit", "開始字元獵取");
    submit.type = "submit";
    submit.dataset.testid = "start-run";
    this.#error = createElement("p", "vocabulary-select__error");
    this.#error.dataset.testid = "selection-error";
    this.#error.setAttribute("role", "alert");
    this.#error.hidden = true;
    this.#form.append(modeLabel, submit, this.#error);
    panel.append(this.#form);
    this.#element.append(panel);
    container.append(this.#element);
    this.#form.addEventListener("submit", this.#onSubmit);
  }

  hide(): void {
    this.#element.hidden = true;
  }

  show(): void {
    this.#error.hidden = true;
    this.#element.hidden = false;
  }

  showError(error: unknown): void {
    console.error("無法開始關卡", error);
    const message = error instanceof Error ? error.message : "";
    this.#error.textContent = /[\u3400-\u9fff]/u.test(message)
      ? message
      : "無法建立關卡，請更換字彙模式後再試。";
    this.#error.hidden = false;
  }

  dispose(): void {
    this.#form.removeEventListener("submit", this.#onSubmit);
  }

  readonly #onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    this.#error.hidden = true;
    const mode = VOCABULARY_MODE_OPTIONS.find((option) => option === this.#mode.value);
    if (!mode) {
      this.showError(new Error("請選擇有效的字彙模式。"));
      return;
    }
    this.#listener(Object.freeze({ mode }));
  };
}
