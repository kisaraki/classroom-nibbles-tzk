import { APP_CONFIG } from "../core/Config";
import { CollisionKind } from "../gameplay/CollisionSystem";
import type { SnakeSimulationStatus } from "../gameplay/SnakeSimulation";
import type { VocabularyGameplayStatus } from "../gameplay/VocabularyGameplaySession";
import { tokenDisplayLabel } from "../gameplay/TokenPool";

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
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function collisionLabel(collision: SnakeSimulationStatus["latestCollision"]): string {
  if (collision === CollisionKind.SOLID_WALL) return "SOLID WALL";
  if (collision === CollisionKind.SELF) return "SELF COLLISION";
  if (collision === CollisionKind.WRONG_TOKEN) return "WRONG TOKEN";
  return "NONE";
}

export class PhaseThreePanel {
  readonly #element: HTMLElement;
  readonly #gameLevel: HTMLElement;
  readonly #vocabularyLevel: HTMLElement;
  readonly #wordNumber: HTMLElement;
  readonly #timer: HTMLElement;
  readonly #state: HTMLElement;
  readonly #heading: HTMLElement;
  readonly #speed: HTMLElement;
  readonly #length: HTMLElement;
  readonly #target: HTMLElement;
  readonly #meaning: HTMLElement;
  readonly #partOfSpeech: HTMLElement;
  readonly #progress: HTMLElement;
  readonly #collision: HTMLElement;
  readonly #collection: HTMLElement;
  readonly #phaseMessage: HTMLElement;
  #renderedEntryId = "";
  #renderedProgress = -1;

  constructor(container: HTMLElement) {
    this.#element = createElement("section", "phase-three-panel");
    this.#element.dataset.testid = "phase-three-panel";
    const heading = createElement("header", "phase-three-panel__heading");
    heading.append(
      createElement("p", "phase-three-panel__eyebrow", "TOKEN HUNT / 03"),
      createElement("h1", "phase-three-panel__title", APP_CONFIG.title),
    );

    const mission = createElement("dl", "phase-three-panel__mission");
    this.#gameLevel = this.#appendMetric(mission, "Game", "—", "game-level");
    this.#vocabularyLevel = this.#appendMetric(
      mission,
      "Vocabulary",
      "—",
      "vocabulary-level",
    );
    this.#wordNumber = this.#appendMetric(mission, "Word", "—", "word-number");
    this.#timer = this.#appendMetric(mission, "Time", "—", "main-timer");

    const targetBlock = createElement("article", "phase-three-panel__target-block");
    targetBlock.append(createElement("p", "phase-three-panel__label", "TARGET"));
    this.#target = createElement("div", "phase-three-panel__target");
    this.#target.dataset.testid = "target-tokens";
    this.#meaning = createElement("p", "phase-three-panel__meaning");
    this.#meaning.dataset.testid = "target-meaning";
    this.#partOfSpeech = createElement("p", "phase-three-panel__part-of-speech");
    this.#progress = createElement("p", "phase-three-panel__progress");
    this.#progress.dataset.testid = "token-progress";
    targetBlock.append(this.#target, this.#meaning, this.#partOfSpeech, this.#progress);

    const telemetry = createElement("dl", "phase-three-panel__telemetry");
    this.#state = this.#appendMetric(telemetry, "State", "—", "simulation-state");
    this.#heading = this.#appendMetric(telemetry, "Heading", "—", "snake-heading");
    this.#speed = this.#appendMetric(telemetry, "Speed", "—", "snake-speed");
    this.#length = this.#appendMetric(telemetry, "Length", "—", "snake-length");
    this.#collision = this.#appendMetric(telemetry, "Impact", "NONE", "latest-collision");
    this.#collection = this.#appendMetric(telemetry, "Token", "NONE", "latest-collection");

    this.#phaseMessage = createElement("p", "phase-three-panel__message");
    this.#phaseMessage.dataset.testid = "phase-message";
    this.#phaseMessage.hidden = true;
    const controls = createElement(
      "p",
      "phase-three-panel__controls",
      "WASD / ARROWS TO STEER · COLLECT THE OUTLINED NEXT TOKEN",
    );
    this.#element.append(heading, mission, targetBlock, telemetry, this.#phaseMessage, controls);
    container.append(this.#element);
  }

  update(gameplay: VocabularyGameplayStatus, snake: SnakeSimulationStatus): void {
    this.#element.dataset.state = gameplay.state;
    this.#gameLevel.textContent = `L${gameplay.gameLevel} · ${gameplay.sceneName}`;
    this.#vocabularyLevel.textContent = gameplay.vocabularyMode;
    this.#wordNumber.textContent = `${gameplay.wordNumber}/${gameplay.totalWords}`;
    this.#timer.textContent = formatTime(gameplay.timeRemainingSeconds);
    this.#state.textContent = gameplay.state;
    this.#heading.textContent = snake.direction;
    this.#speed.textContent = `${snake.speed.toFixed(1)} u/s`;
    this.#length.textContent = String(snake.length);
    this.#collision.textContent = collisionLabel(snake.latestCollision);
    this.#collection.textContent = gameplay.latestCollection ?? "NONE";
    this.#meaning.textContent = gameplay.entry.meaningZh;
    this.#partOfSpeech.textContent = gameplay.entry.partOfSpeech ?? "";
    this.#progress.textContent =
      `${gameplay.progressIndex}/${gameplay.entry.tokenLength} TOKENS · NEXT ${gameplay.nextToken ? tokenDisplayLabel(gameplay.nextToken) : "—"}`;

    if (
      this.#renderedEntryId !== gameplay.entry.id ||
      this.#renderedProgress !== gameplay.progressIndex
    ) {
      this.#renderTarget(gameplay);
    }

    this.#phaseMessage.hidden = gameplay.state !== "TYPING_TEST" && gameplay.state !== "LEVEL_FAILED";
    this.#phaseMessage.textContent =
      gameplay.state === "TYPING_TEST"
        ? "WORD COLLECTED — TYPING REINFORCEMENT ARRIVES IN PHASE 4"
        : gameplay.state === "LEVEL_FAILED"
          ? "LEVEL TIMER EXPIRED"
          : "";
  }

  #renderTarget(gameplay: VocabularyGameplayStatus): void {
    this.#target.replaceChildren();
    gameplay.entry.tokens.forEach((token, index) => {
      const tokenElement = createElement(
        "span",
        "phase-three-panel__target-token",
        tokenDisplayLabel(token),
      );
      if (index < gameplay.progressIndex) tokenElement.dataset.status = "collected";
      else if (index === gameplay.progressIndex) {
        tokenElement.dataset.status = "next";
        tokenElement.setAttribute("aria-current", "step");
      } else tokenElement.dataset.status = "remaining";
      this.#target.append(tokenElement);
    });
    this.#renderedEntryId = gameplay.entry.id;
    this.#renderedProgress = gameplay.progressIndex;
  }

  #appendMetric(
    list: HTMLDListElement,
    label: string,
    initialValue: string,
    testId: string,
  ): HTMLElement {
    const metric = createElement("div", "phase-three-panel__metric");
    metric.append(createElement("dt", "phase-three-panel__metric-label", label));
    const value = createElement("dd", "phase-three-panel__metric-value", initialValue);
    value.dataset.testid = testId;
    metric.append(value);
    list.append(metric);
    return value;
  }
}
