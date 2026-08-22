import { APP_CONFIG } from "../core/Config";
import type { ArenaConfig } from "../gameplay/Arena";
import { CollisionKind } from "../gameplay/CollisionSystem";
import type { SnakeSimulationStatus } from "../gameplay/SnakeSimulation";
import type { VocabularyMetadata } from "../vocabulary/types";

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

function collisionLabel(collision: SnakeSimulationStatus["latestCollision"]): string {
  if (collision === CollisionKind.SOLID_WALL) return "SOLID WALL";
  if (collision === CollisionKind.SELF) return "SELF COLLISION";
  return "NONE";
}

export class PhaseTwoPanel {
  readonly #element: HTMLElement;
  readonly #state: HTMLElement;
  readonly #direction: HTMLElement;
  readonly #length: HTMLElement;
  readonly #speed: HTMLElement;
  readonly #position: HTMLElement;
  readonly #collision: HTMLElement;

  constructor(
    container: HTMLElement,
    metadata: VocabularyMetadata,
    arenaConfig: ArenaConfig,
  ) {
    this.#element = createElement("section", "phase-two-panel");
    this.#element.dataset.testid = "phase-two-panel";

    const headingGroup = createElement("header", "phase-two-panel__heading");
    headingGroup.append(
      createElement("p", "phase-two-panel__eyebrow", "MOVEMENT LAB / 02"),
      createElement("h1", "phase-two-panel__title", APP_CONFIG.title),
      createElement("p", "phase-two-panel__phase", `${APP_CONFIG.phaseLabel} — FLIGHT TEST`),
    );

    const dataStatus = createElement(
      "p",
      "phase-two-panel__data",
      `DATA ${metadata.dataVersion} · ${metadata.eligibleEntries.toLocaleString("en-US")} READY`,
    );
    dataStatus.dataset.testid = "phase-two-data-version";

    const metrics = createElement("dl", "phase-two-panel__metrics");
    this.#state = this.#appendMetric(metrics, "State", "BOOT", "simulation-state");
    this.#direction = this.#appendMetric(metrics, "Heading", "NORTH", "snake-heading");
    this.#length = this.#appendMetric(metrics, "Length", "8", "snake-length");
    this.#speed = this.#appendMetric(metrics, "Speed", "4.5 u/s", "snake-speed");
    this.#position = this.#appendMetric(metrics, "Position", "X 0.00 · Z 0.00", "head-position");
    this.#collision = this.#appendMetric(metrics, "Last impact", "NONE", "latest-collision");

    const boundaryStatus = createElement(
      "p",
      "phase-two-panel__boundaries",
      `X ${arenaConfig.xBoundaryMode} · Z ${arenaConfig.zBoundaryMode}`,
    );
    const controls = createElement("p", "phase-two-panel__controls");
    controls.append(
      createElement("span", "phase-two-panel__key", "WASD"),
      document.createTextNode(" or "),
      createElement("span", "phase-two-panel__key", "ARROW KEYS"),
      document.createTextNode(" to steer · direct reversal locked"),
    );

    this.#element.append(headingGroup, dataStatus, metrics, boundaryStatus, controls);
    container.append(this.#element);
  }

  update(status: SnakeSimulationStatus): void {
    this.#element.dataset.state = status.state;
    this.#state.textContent = status.state;
    this.#direction.textContent = status.direction;
    this.#length.textContent = String(status.length);
    this.#speed.textContent = `${status.speed.toFixed(1)} u/s`;
    this.#position.textContent =
      `X ${status.headPosition.x.toFixed(2)} · Z ${status.headPosition.z.toFixed(2)}`;
    this.#collision.textContent = collisionLabel(status.latestCollision);
  }

  #appendMetric(
    list: HTMLDListElement,
    label: string,
    initialValue: string,
    testId: string,
  ): HTMLElement {
    const metric = createElement("div", "phase-two-panel__metric");
    metric.append(createElement("dt", "phase-two-panel__metric-label", label));
    const value = createElement("dd", "phase-two-panel__metric-value", initialValue);
    value.dataset.testid = testId;
    metric.append(value);
    list.append(metric);
    return value;
  }
}
