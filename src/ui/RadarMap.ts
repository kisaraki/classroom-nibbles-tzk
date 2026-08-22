import { Arena, BoundaryMode } from "../gameplay/Arena";
import { directionVector, type Direction } from "../gameplay/Direction";
import {
  PowerUpKind,
  powerUpDisplayLabel,
  type PowerUpEntity,
} from "../gameplay/PowerUpPool";
import type { TokenEntity } from "../gameplay/TokenPool";
import type { XZPoint } from "../gameplay/Trail";
import type { BulletEntity } from "../gameplay/WeaponSystem";
import type { CharacterToken } from "../vocabulary/types";

export interface RadarMapSnapshot {
  readonly snakeSegments: readonly XZPoint[];
  readonly snakeDirection: Direction;
  readonly tokens: readonly TokenEntity[];
  readonly powerUps: readonly PowerUpEntity[];
  readonly bullets: readonly BulletEntity[];
  readonly obstacles: readonly RadarObstacle[];
  readonly nextToken: CharacterToken | null;
}

export interface RadarObstacle {
  readonly position: XZPoint;
  readonly radius: number;
}

export type RadarToggleListener = () => void;

interface CanvasPoint {
  readonly x: number;
  readonly y: number;
}

const MINI_MAP_PADDING = 13;
const EXPANDED_MAP_PADDING = 34;

function powerUpColor(kind: PowerUpEntity["kind"]): string {
  if (kind === PowerUpKind.TIME_PLUS_10 || kind === PowerUpKind.TIME_PLUS_5) {
    return "#50e3c2";
  }
  if (kind === PowerUpKind.TIME_MINUS_10 || kind === PowerUpKind.TIME_MINUS_5) {
    return "#ff8e8e";
  }
  return "#ffd166";
}

export class RadarMap {
  readonly #arena: Arena;
  readonly #element: HTMLElement;
  readonly #button: HTMLButtonElement;
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D;
  readonly #status: HTMLElement;
  readonly #listener: RadarToggleListener;
  #expanded = false;
  #snapshot: RadarMapSnapshot | null = null;

  constructor(container: HTMLElement, arena: Arena, listener: RadarToggleListener) {
    this.#arena = arena;
    this.#listener = listener;
    this.#element = document.createElement("section");
    this.#element.className = "radar-map";
    this.#element.dataset.testid = "mini-map";
    this.#element.dataset.expanded = "false";
    this.#element.dataset.timeScale = "1";

    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.className = "radar-map__button";
    this.#button.dataset.testid = "tactical-map-toggle";
    this.#button.setAttribute("aria-expanded", "false");
    this.#button.addEventListener("click", this.#onClick);

    const heading = document.createElement("span");
    heading.className = "radar-map__heading";
    heading.textContent = "戰術雷達";
    this.#status = document.createElement("span");
    this.#status.className = "radar-map__status";
    this.#status.dataset.testid = "tactical-map-status";
    this.#status.textContent = "點擊或按 M 展開";
    this.#canvas = document.createElement("canvas");
    this.#canvas.className = "radar-map__canvas";
    this.#canvas.dataset.testid = "radar-canvas";
    this.#canvas.setAttribute("aria-hidden", "true");
    const context = this.#canvas.getContext("2d");
    if (!context) throw new Error("Unable to create radar canvas context.");
    this.#context = context;

    const legend = document.createElement("span");
    legend.className = "radar-map__legend";
    legend.textContent = "蛇身 · 字元 · 道具 · 實體牆 / WRAP 閘門";
    this.#button.append(heading, this.#status, this.#canvas, legend);
    this.#element.append(this.#button);
    container.append(this.#element);
  }

  setExpanded(expanded: boolean, timeScale: number): void {
    this.#expanded = expanded;
    this.#element.dataset.expanded = String(expanded);
    this.#element.dataset.timeScale = String(timeScale);
    this.#button.setAttribute("aria-expanded", String(expanded));
    this.#status.textContent = expanded
      ? `戰術地圖啟用 · ${timeScale.toFixed(2)}× · Esc 關閉`
      : "點擊或按 M 展開";
    this.#draw();
  }

  update(snapshot: RadarMapSnapshot): void {
    this.#snapshot = snapshot;
    this.#element.dataset.snakePoints = String(snapshot.snakeSegments.length);
    this.#element.dataset.tokenCount = String(snapshot.tokens.length);
    this.#element.dataset.powerUpCount = String(snapshot.powerUps.length);
    this.#element.dataset.bulletCount = String(snapshot.bullets.length);
    this.#element.dataset.obstacleCount = String(snapshot.obstacles.length);
    const head = snapshot.snakeSegments[0];
    if (head) {
      const displayHead = this.#arena.toDisplayPoint(head);
      this.#element.dataset.headX = displayHead.x.toFixed(3);
      this.#element.dataset.headZ = displayHead.z.toFixed(3);
    }
    this.#button.setAttribute(
      "aria-label",
      `迷你地圖：${snapshot.tokens.length} 個字元、${snapshot.powerUps.length} 個道具、蛇身 ${snapshot.snakeSegments.length} 節。點擊或按 M 展開戰術地圖。`,
    );
    this.#draw();
  }

  dispose(): void {
    this.#button.removeEventListener("click", this.#onClick);
    this.#element.remove();
  }

  readonly #onClick = (): void => {
    this.#listener();
  };

  #draw(): void {
    if (!this.#snapshot) return;
    const cssWidth = Math.max(this.#canvas.clientWidth, this.#expanded ? 640 : 230);
    const cssHeight = Math.max(this.#canvas.clientHeight, this.#expanded ? 520 : 170);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const width = Math.round(cssWidth * pixelRatio);
    const height = Math.round(cssHeight * pixelRatio);
    if (this.#canvas.width !== width || this.#canvas.height !== height) {
      this.#canvas.width = width;
      this.#canvas.height = height;
    }
    this.#context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.#context.clearRect(0, 0, cssWidth, cssHeight);
    this.#context.fillStyle = "rgba(2, 11, 21, 0.96)";
    this.#context.fillRect(0, 0, cssWidth, cssHeight);
    const padding = this.#expanded ? EXPANDED_MAP_PADDING : MINI_MAP_PADDING;

    this.#drawGrid(cssWidth, cssHeight, padding);
    this.#drawBoundaries(cssWidth, cssHeight, padding);
    this.#drawTokens(cssWidth, cssHeight, padding);
    this.#drawPowerUps(cssWidth, cssHeight, padding);
    this.#drawObstacles(cssWidth, cssHeight, padding);
    this.#drawBullets(cssWidth, cssHeight, padding);
    this.#drawSnake(cssWidth, cssHeight, padding);
  }

  #project(
    point: XZPoint,
    width: number,
    height: number,
    padding: number,
  ): CanvasPoint {
    const display = this.#arena.toDisplayPoint(point);
    const { halfWidth, halfDepth } = this.#arena.config;
    return {
      x: padding + ((display.x + halfWidth) / (halfWidth * 2)) * (width - padding * 2),
      y: padding + ((display.z + halfDepth) / (halfDepth * 2)) * (height - padding * 2),
    };
  }

  #drawGrid(width: number, height: number, padding: number): void {
    this.#context.save();
    this.#context.strokeStyle = "rgba(80, 227, 194, 0.12)";
    this.#context.lineWidth = 1;
    for (let index = 1; index < 4; index += 1) {
      const x = padding + ((width - padding * 2) * index) / 4;
      const y = padding + ((height - padding * 2) * index) / 4;
      this.#context.beginPath();
      this.#context.moveTo(x, padding);
      this.#context.lineTo(x, height - padding);
      this.#context.moveTo(padding, y);
      this.#context.lineTo(width - padding, y);
      this.#context.stroke();
    }
    this.#context.restore();
  }

  #drawBoundaries(width: number, height: number, padding: number): void {
    const { xBoundaryMode, zBoundaryMode } = this.#arena.config;
    this.#context.save();
    this.#context.lineWidth = this.#expanded ? 4 : 2;
    this.#context.strokeStyle = xBoundaryMode === BoundaryMode.SOLID ? "#ff6b6b" : "#6f8cff";
    this.#context.setLineDash(xBoundaryMode === BoundaryMode.WRAP ? [6, 5] : []);
    this.#context.beginPath();
    this.#context.moveTo(padding, padding);
    this.#context.lineTo(padding, height - padding);
    this.#context.moveTo(width - padding, padding);
    this.#context.lineTo(width - padding, height - padding);
    this.#context.stroke();

    this.#context.strokeStyle = zBoundaryMode === BoundaryMode.SOLID ? "#ff6b6b" : "#6f8cff";
    this.#context.setLineDash(zBoundaryMode === BoundaryMode.WRAP ? [6, 5] : []);
    this.#context.beginPath();
    this.#context.moveTo(padding, padding);
    this.#context.lineTo(width - padding, padding);
    this.#context.moveTo(padding, height - padding);
    this.#context.lineTo(width - padding, height - padding);
    this.#context.stroke();
    this.#context.restore();
  }

  #drawTokens(width: number, height: number, padding: number): void {
    if (!this.#snapshot) return;
    for (const token of this.#snapshot.tokens) {
      const point = this.#project(token.position, width, height, padding);
      const isNext = token.token === this.#snapshot.nextToken;
      this.#context.beginPath();
      this.#context.arc(point.x, point.y, isNext ? 4 : 2.2, 0, Math.PI * 2);
      this.#context.fillStyle = isNext ? "#ffffff" : "#50e3c2";
      this.#context.fill();
      if (isNext) {
        this.#context.strokeStyle = "#50e3c2";
        this.#context.lineWidth = 2;
        this.#context.stroke();
      }
    }
  }

  #drawPowerUps(width: number, height: number, padding: number): void {
    if (!this.#snapshot) return;
    for (const powerUp of this.#snapshot.powerUps) {
      const point = this.#project(powerUp.position, width, height, padding);
      const size = this.#expanded ? 7 : 5;
      this.#context.save();
      this.#context.translate(point.x, point.y);
      this.#context.rotate(Math.PI / 4);
      this.#context.fillStyle = powerUpColor(powerUp.kind);
      this.#context.fillRect(-size / 2, -size / 2, size, size);
      this.#context.restore();
      if (this.#expanded) {
        this.#context.fillStyle = powerUpColor(powerUp.kind);
        this.#context.font = "700 11px ui-monospace, monospace";
        this.#context.fillText(powerUpDisplayLabel(powerUp.kind), point.x + 6, point.y - 6);
      }
    }
  }

  #drawBullets(width: number, height: number, padding: number): void {
    if (!this.#snapshot) return;
    this.#context.fillStyle = "#fff3a6";
    for (const bullet of this.#snapshot.bullets) {
      const point = this.#project(bullet.position, width, height, padding);
      this.#context.fillRect(point.x - 1.5, point.y - 1.5, 3, 3);
    }
  }

  #drawObstacles(width: number, height: number, padding: number): void {
    if (!this.#snapshot) return;
    this.#context.fillStyle = "#70808f";
    for (const obstacle of this.#snapshot.obstacles) {
      const point = this.#project(obstacle.position, width, height, padding);
      const size = Math.max(4, obstacle.radius * 6);
      this.#context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    }
  }

  #drawSnake(width: number, height: number, padding: number): void {
    if (!this.#snapshot || this.#snapshot.snakeSegments.length === 0) return;
    this.#context.save();
    this.#context.strokeStyle = "#86ffe1";
    this.#context.lineWidth = this.#expanded ? 4 : 2.5;
    this.#context.lineCap = "round";
    this.#context.lineJoin = "round";
    this.#context.beginPath();
    let previousWorld: XZPoint | null = null;
    this.#snapshot.snakeSegments.forEach((segment) => {
      const point = this.#project(segment, width, height, padding);
      if (!previousWorld || this.#trailWraps(previousWorld, segment)) {
        this.#context.moveTo(point.x, point.y);
      } else {
        this.#context.lineTo(point.x, point.y);
      }
      previousWorld = segment;
    });
    this.#context.stroke();

    const head = this.#project(this.#snapshot.snakeSegments[0]!, width, height, padding);
    const forward = directionVector(this.#snapshot.snakeDirection);
    const size = this.#expanded ? 10 : 7;
    this.#context.translate(head.x, head.y);
    this.#context.rotate(Math.atan2(forward.z, forward.x));
    this.#context.fillStyle = "#ffffff";
    this.#context.beginPath();
    this.#context.moveTo(size, 0);
    this.#context.lineTo(-size * 0.65, size * 0.65);
    this.#context.lineTo(-size * 0.65, -size * 0.65);
    this.#context.closePath();
    this.#context.fill();
    this.#context.restore();
  }

  #trailWraps(previous: XZPoint, current: XZPoint): boolean {
    const previousDisplay = this.#arena.toDisplayPoint(previous);
    const currentDisplay = this.#arena.toDisplayPoint(current);
    const { halfWidth, halfDepth, xBoundaryMode, zBoundaryMode } = this.#arena.config;
    return (
      (xBoundaryMode === BoundaryMode.WRAP &&
        Math.abs(previousDisplay.x - currentDisplay.x) > halfWidth) ||
      (zBoundaryMode === BoundaryMode.WRAP &&
        Math.abs(previousDisplay.z - currentDisplay.z) > halfDepth)
    );
  }
}
