import { APP_CONFIG, GAMEPLAY_CONFIG } from "../core/Config";
import { CollisionKind } from "../gameplay/CollisionSystem";
import type { EnvironmentProfile } from "../gameplay/Environment";
import { PowerUpKind } from "../gameplay/PowerUpPool";
import type { PowerUpWeaponStatus } from "../gameplay/PowerUpWeaponSession";
import type { SnakeSimulationStatus } from "../gameplay/SnakeSimulation";
import {
  TokenCollectionKind,
  type VocabularyGameplayStatus,
} from "../gameplay/VocabularyGameplaySession";
import { Direction } from "../gameplay/Direction";
import { tokenDisplayLabel } from "../gameplay/TokenPool";
import { BulletImpactKind } from "../gameplay/WeaponSystem";

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
  if (collision === CollisionKind.SOLID_OBSTACLE) return "撞上環境障礙";
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

function powerUpLabel(powerUp: PowerUpWeaponStatus["latestPowerUp"]): string {
  if (powerUp === PowerUpKind.TIME_PLUS_10) return "主計時 +10 秒";
  if (powerUp === PowerUpKind.TIME_PLUS_5) return "主計時 +5 秒";
  if (powerUp === PowerUpKind.TIME_MINUS_10) return "主計時 −10 秒";
  if (powerUp === PowerUpKind.TIME_MINUS_5) return "主計時 −5 秒";
  if (powerUp === PowerUpKind.ATTACK) {
    return `彈藥 +${GAMEPLAY_CONFIG.powerUp.attackAmmoReward}`;
  }
  return "無";
}

function bulletImpactLabel(impact: PowerUpWeaponStatus["latestBulletImpact"]): string {
  if (impact === BulletImpactKind.TOKEN) return "字元已重新配置";
  if (impact === BulletImpactKind.POWER_UP) return "道具已重新配置";
  if (impact === BulletImpactKind.SOLID_WALL) return "命中實體牆";
  if (impact === BulletImpactKind.SOLID_OBSTACLE) return "命中環境障礙";
  return "無";
}

export class PhaseThreePanel {
  readonly #element: HTMLElement;
  readonly #gameLevel: HTMLElement;
  readonly #vocabularyLevel: HTMLElement;
  readonly #wordNumber: HTMLElement;
  readonly #timer: HTMLElement;
  readonly #environmentFeature: HTMLElement;
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
  readonly #ammo: HTMLElement;
  readonly #powerUp: HTMLElement;
  readonly #shot: HTMLElement;
  readonly #phaseMessage: HTMLElement;
  #renderedEntryId = "";
  #renderedProgress = -1;

  constructor(container: HTMLElement) {
    this.#element = createElement("section", "phase-three-panel");
    this.#element.dataset.testid = "phase-three-panel";
    const heading = createElement("header", "phase-three-panel__heading");
    heading.append(
      createElement("p", "phase-three-panel__eyebrow", "座艙任務 / 08"),
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
    this.#environmentFeature = createElement(
      "p",
      "phase-three-panel__environment",
      "環境機制：—",
    );
    this.#environmentFeature.dataset.testid = "environment-feature";

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

    const telemetry = createElement("dl", "phase-three-panel__telemetry");
    this.#state = this.#appendMetric(telemetry, "狀態", "—", "simulation-state");
    this.#heading = this.#appendMetric(telemetry, "方向", "—", "snake-heading");
    this.#speed = this.#appendMetric(telemetry, "速度", "—", "snake-speed");
    this.#length = this.#appendMetric(telemetry, "長度", "—", "snake-length");
    this.#collision = this.#appendMetric(telemetry, "碰撞", "無", "latest-collision");
    this.#collection = this.#appendMetric(telemetry, "字元", "無", "latest-collection");
    this.#ammo = this.#appendMetric(telemetry, "彈藥", "0", "ammo-count");
    this.#powerUp = this.#appendMetric(telemetry, "道具", "無", "latest-power-up");
    this.#shot = this.#appendMetric(telemetry, "射擊", "無", "latest-shot");

    this.#phaseMessage = createElement("p", "phase-three-panel__message");
    this.#phaseMessage.dataset.testid = "phase-message";
    this.#phaseMessage.hidden = true;
    const controls = createElement(
      "p",
      "phase-three-panel__controls",
      "WASD / 方向鍵轉向 · 空白鍵發射 · M 戰術地圖 · P 暫停 · Esc 關閉",
    );
    this.#element.append(
      heading,
      mission,
      this.#environmentFeature,
      targetBlock,
      telemetry,
      this.#phaseMessage,
      controls,
    );
    container.append(this.#element);
  }

  update(
    gameplay: VocabularyGameplayStatus,
    snake: SnakeSimulationStatus,
    powerUpWeapon: PowerUpWeaponStatus,
    environment: EnvironmentProfile,
  ): void {
    this.#element.dataset.state = gameplay.state;
    this.#element.dataset.environment = environment.kind;
    this.#gameLevel.textContent = `第 ${gameplay.gameLevel} 關 · ${gameplay.sceneName}`;
    this.#vocabularyLevel.textContent = gameplay.vocabularyMode;
    this.#wordNumber.textContent = `${gameplay.wordNumber}/${gameplay.totalWords}`;
    this.#timer.textContent = formatTime(gameplay.timeRemainingSeconds);
    this.#environmentFeature.textContent = `環境機制：${environment.featureLabel}`;
    this.#state.textContent = stateLabel(gameplay.state);
    this.#heading.textContent = directionLabel(snake.direction);
    this.#speed.textContent = `${snake.speed.toFixed(1)} 單位/秒`;
    this.#length.textContent = String(snake.length);
    this.#collision.textContent = collisionLabel(snake.latestCollision);
    this.#collection.textContent = collectionLabel(gameplay.latestCollection);
    this.#ammo.textContent = String(powerUpWeapon.ammo);
    this.#powerUp.textContent = powerUpLabel(powerUpWeapon.latestPowerUp);
    this.#shot.textContent = bulletImpactLabel(powerUpWeapon.latestBulletImpact);
    this.#meaning.textContent = gameplay.entry.meaningZh;
    this.#partOfSpeech.textContent = gameplay.entry.partOfSpeech ?? "";
    this.#progress.textContent =
      `${gameplay.progressIndex}/${gameplay.entry.tokenLength} 個字元 · 下一個：${tokenName(gameplay.nextToken)}`;

    if (
      this.#renderedEntryId !== gameplay.entry.id ||
      this.#renderedProgress !== gameplay.progressIndex
    ) {
      this.#renderTarget(gameplay);
    }

    this.#phaseMessage.hidden =
      gameplay.state !== "TYPING_TEST" &&
      gameplay.state !== "LEVEL_FAILED" &&
      gameplay.state !== "GAME_CLEAR" &&
      !gameplay.typingTimeoutNoticeActive;
    this.#phaseMessage.textContent =
      gameplay.state === "TYPING_TEST"
        ? "單字已收集完成—正在進行 30 秒打字強化測驗"
        : gameplay.state === "LEVEL_FAILED"
          ? "本關主計時已結束"
          : gameplay.state === "GAME_CLEAR"
            ? "25 個單字皆已完成打字強化測驗"
            : gameplay.typingTimeoutNoticeActive
              ? `打字測驗逾時：已補回主計時 5 秒，請重新收集最後一個字元（第 ${gameplay.typingTimeoutCount} 次）`
              : "";
  }

  dispose(): void {
    this.#element.remove();
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
