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
      createElement("p", "vocabulary-select__eyebrow", "MISSION CONFIGURATION / 03"),
      createElement("h1", "vocabulary-select__title", APP_CONFIG.title),
      createElement("p", "vocabulary-select__phase", `${APP_CONFIG.phaseLabel} — TOKEN HUNT`),
      createElement(
        "p",
        "vocabulary-select__intro",
        "Vocabulary Level and Game Level are independent. Choose the vocabulary source for a deterministic five-scene run.",
      ),
    );

    this.#form = createElement("form", "vocabulary-select__form");
    const modeLabel = createElement("label", "vocabulary-select__field");
    modeLabel.append(createElement("span", "vocabulary-select__label", "Vocabulary mode"));
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
    seedLabel.append(createElement("span", "vocabulary-select__label", "Deterministic seed"));
    this.#seed = createElement("input", "vocabulary-select__input");
    this.#seed.dataset.testid = "run-seed";
    this.#seed.name = "run-seed";
    this.#seed.value = "NIBBLES-PHASE-3";
    this.#seed.maxLength = 80;
    this.#seed.required = true;
    seedLabel.append(this.#seed);

    const submit = createElement("button", "vocabulary-select__submit", "START TOKEN HUNT");
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
      `${metadata.dataVersion} · ${metadata.eligibleEntries.toLocaleString("en-US")} eligible entries`,
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
    this.#error.textContent = error instanceof Error ? error.message : "Unable to start run.";
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
      this.showError(new Error("Choose a valid vocabulary mode."));
      return;
    }
    const seed = this.#seed.value.trim();
    if (!seed) {
      this.showError(new Error("Enter a deterministic seed."));
      return;
    }
    this.#listener(Object.freeze({ mode, seed }));
  };
}
