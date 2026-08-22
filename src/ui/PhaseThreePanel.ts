import { APP_CONFIG } from "../core/Config";
import { CollisionKind } from "../gameplay/CollisionSystem";
import type { SnakeSimulationStatus } from "../gameplay/SnakeSimulation";
import {
  TokenCollectionKind,
  type VocabularyGameplayStatus,
} from "../gameplay/VocabularyGameplaySession";
import { Direction } from "../gameplay/Direction";
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
  if (collision === CollisionKind.SOLID_WALL) return "撞上實體牆";
  if (collision === CollisionKind.SELF) return "撞到自身";
  if (collision === CollisionKind.WRONG_TOKEN) return "錯誤字元";
  return "無";
}

function stateLabel(state: VocabularyGameplayStatus["state"]): string {
  const labels: Readonly<Record<VocabularyGameplayStatus["state"], string>> = {
    BOOT: "啟動中",
    MAIN_MENU: "主選單",
    VOCABULARY_SELECT: "選擇字彙",
    TRANSITION_IN: "進入關卡",
    HUNTING: "進行中",
    STUNNED: "暈眩",
    RECOVERY: "復原中",
    MAP_EXPANDED: "戰術地圖",
    TYPING_TEST: "打字測驗",
    PAUSED: "暫停",
    LEVEL_CLEAR: "關卡完成",
    LEVEL_FAILED: "關卡失敗",
    GAME_CLEAR: "全部完成",
    CREDITS: "製作名單",
  };
  return labels[state];
}

function directionLabel(direction: SnakeSimulationStatus["direction"]): string {
  if (direction === Direction.NORTH) return "北";
  if (direction === Direction.SOUTH) return "南";
  if (direction === Direction.EAST) return "東";
  return "西";
}

function collectionLabel(collection: VocabularyGameplayStatus["latestCollection"]): string {
  if (collection === TokenCollectionKind.CORRECT) return "正確";
  if (collection === TokenCollectionKind.WRONG) return "錯誤";
  return "無";
}

function tokenName(token: VocabularyGameplayStatus["nextToken"]): string {
  if (token === "SPACE") return "空格";
  if (token === "PERIOD") return "句點";
  if (token === "APOSTROPHE") return "撇號";
  if (token === "HYPHEN") return "連字號";
  return token ?? "—";
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
  readonly #noProgressWarning: HTMLElement;
  readonly #phaseMessage: HTMLElement;
  #renderedEntryId = "";
  #renderedProgress = -1;

  constructor(container: HTMLElement) {
    this.#element = createElement("section", "phase-three-panel");
    this.#element.dataset.testid = "phase-three-panel";
    const heading = createElement("header", "phase-three-panel__heading");
    heading.append(
      createElement("p", "phase-three-panel__eyebrow", "字元獵取 / 03"),
      createElement("h1", "phase-three-panel__title", APP_CONFIG.title),
    );

    const mission = createElement("dl", "phase-three-panel__mission");
    this.#gameLevel = this.#appendMetric(mission, "關卡", "—", "game-level");
    this.#vocabularyLevel = this.#appendMetric(
      mission,
      "字彙",
      "—",
      "vocabulary-level",
    );
    this.#wordNumber = this.#appendMetric(mission, "單字", "—", "word-number");
    this.#timer = this.#appendMetric(mission, "主計時", "—", "main-timer");

    const targetBlock = createElement("article", "phase-three-panel__target-block");
    targetBlock.append(createElement("p", "phase-three-panel__label", "目標單字"));
    this.#target = createElement("div", "phase-three-panel__target");
    this.#target.dataset.testid = "target-tokens";
    this.#meaning = createElement("p", "phase-three-panel__meaning");
    this.#meaning.dataset.testid = "target-meaning";
    this.#partOfSpeech = createElement("p", "phase-three-panel__part-of-speech");
    this.#progress = createElement("p", "phase-three-panel__progress");
    this.#progress.dataset.testid = "token-progress";
    targetBlock.append(this.#target, this.#meaning, this.#partOfSpeech, this.#progress);

    this.#noProgressWarning = createElement("p", "phase-three-panel__countdown");
    this.#noProgressWarning.dataset.testid = "no-progress-countdown";
    this.#noProgressWarning.setAttribute("role", "timer");
    this.#noProgressWarning.setAttribute("aria-live", "assertive");
    this.#noProgressWarning.hidden = true;

    const telemetry = createElement("dl", "phase-three-panel__telemetry");
    this.#state = this.#appendMetric(telemetry, "狀態", "—", "simulation-state");
    this.#heading = this.#appendMetric(telemetry, "方向", "—", "snake-heading");
    this.#speed = this.#appendMetric(telemetry, "速度", "—", "snake-speed");
    this.#length = this.#appendMetric(telemetry, "長度", "—", "snake-length");
    this.#collision = this.#appendMetric(telemetry, "碰撞", "無", "latest-collision");
    this.#collection = this.#appendMetric(telemetry, "字元", "無", "latest-collection");

    this.#phaseMessage = createElement("p", "phase-three-panel__message");
    this.#phaseMessage.dataset.testid = "phase-message";
    this.#phaseMessage.hidden = true;
    const controls = createElement(
      "p",
      "phase-three-panel__controls",
      "使用 WASD 或方向鍵轉向 · 收集有外框的下一個字元",
    );
    this.#element.append(
      heading,
      mission,
      targetBlock,
      this.#noProgressWarning,
      telemetry,
      this.#phaseMessage,
      controls,
    );
    container.append(this.#element);
  }

  update(gameplay: VocabularyGameplayStatus, snake: SnakeSimulationStatus): void {
    this.#element.dataset.state = gameplay.state;
    this.#gameLevel.textContent = `第 ${gameplay.gameLevel} 關 · ${gameplay.sceneName}`;
    this.#vocabularyLevel.textContent = gameplay.vocabularyMode;
    this.#wordNumber.textContent = `${gameplay.wordNumber}/${gameplay.totalWords}`;
    this.#timer.textContent = formatTime(gameplay.timeRemainingSeconds);
    this.#state.textContent = stateLabel(gameplay.state);
    this.#heading.textContent = directionLabel(snake.direction);
    this.#speed.textContent = `${snake.speed.toFixed(1)} 單位/秒`;
    this.#length.textContent = String(snake.length);
    this.#collision.textContent = collisionLabel(snake.latestCollision);
    this.#collection.textContent = collectionLabel(gameplay.latestCollection);
    this.#meaning.textContent = gameplay.entry.meaningZh;
    this.#partOfSpeech.textContent = gameplay.entry.partOfSpeech ?? "";
    this.#progress.textContent =
      `${gameplay.progressIndex}/${gameplay.entry.tokenLength} 個字元 · 下一個：${tokenName(gameplay.nextToken)}`;

    const countdownSeconds = Math.max(0, Math.ceil(gameplay.noProgressTimeRemainingSeconds));
    this.#noProgressWarning.hidden = !gameplay.noProgressWarningActive;
    this.#noProgressWarning.textContent = gameplay.noProgressWarningActive
      ? `尚未取得正確字元，本關將在 ${countdownSeconds} 秒後重新開始`
      : "";

    if (
      this.#renderedEntryId !== gameplay.entry.id ||
      this.#renderedProgress !== gameplay.progressIndex
    ) {
      this.#renderTarget(gameplay);
    }

    this.#phaseMessage.hidden =
      gameplay.state !== "TYPING_TEST" &&
      gameplay.state !== "LEVEL_FAILED" &&
      !gameplay.restartNoticeActive;
    this.#phaseMessage.textContent =
      gameplay.state === "TYPING_TEST"
        ? "單字已收集完成—打字強化測驗將於第四階段加入"
        : gameplay.state === "LEVEL_FAILED"
          ? "本關主計時已結束"
          : gameplay.restartNoticeActive
            ? `20 秒未取得正確字元，本關已重新開始（第 ${gameplay.levelRestartCount} 次）`
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
