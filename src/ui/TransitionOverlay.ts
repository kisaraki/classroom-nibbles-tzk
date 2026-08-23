import { PRESENTATION_CONFIG } from "../core/Config";
import { PauseReason, type PausePresentation } from "../core/PauseController";
import type { EnvironmentProfile } from "../gameplay/Environment";

export class TransitionOverlay implements PausePresentation {
  readonly #element: HTMLElement;
  readonly #title: HTMLElement;
  readonly #subtitle: HTMLElement;
  readonly #reducedMotion: boolean;
  readonly #timers = new Set<number>();
  #generation = 0;

  constructor(container: HTMLElement) {
    this.#reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.#element = document.createElement("section");
    this.#element.className = "transition-overlay";
    this.#element.dataset.testid = "transition-overlay";
    this.#element.dataset.mode = "hidden";
    this.#element.dataset.door = "open";
    this.#element.hidden = true;
    this.#element.setAttribute("aria-live", "polite");

    const leftDoor = document.createElement("div");
    leftDoor.className = "transition-overlay__door transition-overlay__door--left";
    const rightDoor = document.createElement("div");
    rightDoor.className = "transition-overlay__door transition-overlay__door--right";
    const content = document.createElement("div");
    content.className = "transition-overlay__content";
    this.#title = document.createElement("h2");
    this.#title.className = "transition-overlay__title";
    this.#title.dataset.testid = "transition-title";
    this.#subtitle = document.createElement("p");
    this.#subtitle.className = "transition-overlay__subtitle";
    this.#subtitle.dataset.testid = "transition-subtitle";
    content.append(this.#title, this.#subtitle);
    this.#element.append(leftDoor, rightDoor, content);
    container.append(this.#element);
  }

  playSceneTransition(environment: EnvironmentProfile, complete: () => void): void {
    this.#clearTimers();
    this.#show(
      "scene",
      `第 ${environment.gameLevel} 關 · ${environment.sceneName}`,
      environment.featureLabel,
    );
    this.#element.dataset.door = "open";
    this.#nextFrame(() => {
      this.#element.dataset.door = "closed";
    });
    const timings = PRESENTATION_CONFIG.sceneTransition;
    this.#schedule(() => {
      this.#element.dataset.door = "open";
    }, timings.closeMilliseconds + timings.holdMilliseconds);
    this.#schedule(() => {
      this.#hide();
      complete();
    }, timings.closeMilliseconds + timings.holdMilliseconds + timings.openMilliseconds);
  }

  playMissionComplete(complete: () => void): void {
    this.#clearTimers();
    this.#show("complete", "任務完成", "五個環境、二十五個單字全部完成");
    this.#element.dataset.door = "closed";
    const timings = PRESENTATION_CONFIG.sceneTransition;
    this.#schedule(() => {
      this.#element.dataset.door = "open";
    }, timings.holdMilliseconds);
    this.#schedule(() => {
      this.#hide();
      complete();
    }, timings.holdMilliseconds + timings.openMilliseconds);
  }

  closeForPause(reason: PauseReason): void {
    this.#clearTimers();
    this.#show(
      "pause",
      "遊戲暫停",
      reason === PauseReason.VISIBILITY
        ? "偵測到視窗離開，已自動暫停 · 按 P 繼續"
        : "彈珠台護板已關閉 · 按 P 繼續",
    );
    this.#element.dataset.door = "open";
    this.#nextFrame(() => {
      this.#element.dataset.door = "closed";
    });
  }

  openFromPause(complete: () => void): void {
    this.#clearTimers();
    this.#title.textContent = "返回任務";
    this.#subtitle.textContent = "彈珠台護板開啟中";
    this.#element.dataset.door = "open";
    this.#schedule(() => {
      this.#hide();
      complete();
    }, PRESENTATION_CONFIG.pauseTransitionMilliseconds);
  }

  dispose(): void {
    this.#clearTimers();
    this.#element.remove();
  }

  #show(mode: string, title: string, subtitle: string): void {
    this.#element.hidden = false;
    this.#element.dataset.mode = mode;
    this.#title.textContent = title;
    this.#subtitle.textContent = subtitle;
  }

  #hide(): void {
    this.#element.hidden = true;
    this.#element.dataset.mode = "hidden";
  }

  #nextFrame(callback: () => void): void {
    const generation = this.#generation;
    if (this.#reducedMotion) {
      if (generation === this.#generation) callback();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (generation === this.#generation) callback();
    }));
  }

  #schedule(callback: () => void, delayMilliseconds: number): void {
    const generation = this.#generation;
    const delay = this.#reducedMotion ? 0 : delayMilliseconds;
    const timer = window.setTimeout(() => {
      this.#timers.delete(timer);
      if (generation === this.#generation) callback();
    }, delay);
    this.#timers.add(timer);
  }

  #clearTimers(): void {
    this.#generation += 1;
    for (const timer of this.#timers) window.clearTimeout(timer);
    this.#timers.clear();
  }
}
