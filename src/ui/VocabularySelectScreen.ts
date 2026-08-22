import { APP_CONFIG } from "../core/Config";
import type { VocabularyMetadata } from "../vocabulary/types";
import {
  VOCABULARY_MODE_OPTIONS,
  VocabularyMode,
  vocabularyModeLabel,
  type VocabularyMode as VocabularyModeValue,
} from "../vocabulary/VocabularyMode";

export interface VocabularySelection {
  readonly mode: VocabularyModeValue;
  readonly seed: string;
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
  readonly #seed: HTMLInputElement;
  readonly #error: HTMLElement;
  readonly #listener: VocabularySelectionListener;

  constructor(
    container: HTMLElement,
    metadata: VocabularyMetadata,
    listener: VocabularySelectionListener,
  ) {
    this.#listener = listener;
    this.#element = createElement("section", "vocabulary-select");
    this.#element.dataset.testid = "vocabulary-select";
    const panel = createElement("div", "vocabulary-select__panel");
    panel.append(
      createElement("p", "vocabulary-select__eyebrow", "任務設定 / 06"),
      createElement("h1", "vocabulary-select__title", APP_CONFIG.title),
      createElement("p", "vocabulary-select__phase", `${APP_CONFIG.phaseLabel} — 字元獵取`),
      createElement(
        "p",
        "vocabulary-select__intro",
        "字彙級別與遊戲關卡彼此獨立。請選擇字彙來源；使用相同種子即可重現相同的五關任務。",
      ),
    );

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

    const seedLabel = createElement("label", "vocabulary-select__field");
    seedLabel.append(createElement("span", "vocabulary-select__label", "關卡種子"));
    this.#seed = createElement("input", "vocabulary-select__input");
    this.#seed.dataset.testid = "run-seed";
    this.#seed.name = "run-seed";
    this.#seed.value = "NIBBLES-PHASE-6";
    this.#seed.maxLength = 80;
    this.#seed.required = true;
    seedLabel.append(this.#seed);

    const submit = createElement("button", "vocabulary-select__submit", "開始字元獵取");
    submit.type = "submit";
    submit.dataset.testid = "start-run";
    this.#error = createElement("p", "vocabulary-select__error");
    this.#error.dataset.testid = "selection-error";
    this.#error.setAttribute("role", "alert");
    this.#error.hidden = true;
    this.#form.append(modeLabel, seedLabel, submit, this.#error);

    const dataset = createElement(
      "p",
      "vocabulary-select__dataset",
      `資料版本 ${metadata.dataVersion} · ${metadata.eligibleEntries.toLocaleString("zh-TW")} 筆可遊玩字彙`,
    );
    dataset.dataset.testid = "phase-three-data-version";
    panel.append(this.#form, dataset);
    this.#element.append(panel);
    container.append(this.#element);
    this.#form.addEventListener("submit", this.#onSubmit);
  }

  hide(): void {
    this.#element.hidden = true;
  }

  showError(error: unknown): void {
    console.error("無法開始關卡", error);
    const message = error instanceof Error ? error.message : "";
    this.#error.textContent = /[\u3400-\u9fff]/u.test(message)
      ? message
      : "無法建立關卡，請更換字彙模式或種子後再試。";
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
    const seed = this.#seed.value.trim();
    if (!seed) {
      this.showError(new Error("請輸入關卡種子。"));
      return;
    }
    this.#listener(Object.freeze({ mode, seed }));
  };
}
