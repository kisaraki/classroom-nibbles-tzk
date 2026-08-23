import type { RandomSource } from "../core/SeededRandom";
import { GameState, type GameState as GameStateValue } from "../core/GameState";
import type { StateMachine } from "../core/StateMachine";
import type { TableMotionControls } from "../input/TableMotionInput";
import { Arena } from "./Arena";
import type { SolidObstacle } from "./CollisionSystem";
import { PowerUpPool } from "./PowerUpPool";
import { Snake } from "./Snake";
import { TokenPool } from "./TokenPool";
import type { XZPoint } from "./Trail";
import { WeaponSystem } from "./WeaponSystem";

const ACTIVE_WORLD_STATES = new Set<GameStateValue>([
  GameState.HUNTING,
  GameState.STUNNED,
  GameState.RECOVERY,
]);
const TAU = Math.PI * 2;
const TIME_EPSILON_SECONDS = 1e-9;

export const TableMotionMode = Object.freeze({
  LEVEL: "LEVEL",
  TILT_LEFT: "TILT_LEFT",
  TILT_RIGHT: "TILT_RIGHT",
  SHAKE: "SHAKE",
} as const);

export type TableMotionMode =
  (typeof TableMotionMode)[keyof typeof TableMotionMode];

export interface TableMotionConfig {
  readonly tiltAngleRadians: number;
  readonly tiltSlideSpeed: number;
  readonly shakeDurationSeconds: number;
  readonly shakeDisplacementSpeed: number;
  readonly shakeAngleRadians: number;
  readonly shakeLift: number;
  readonly snakeCollisionRadius: number;
}

export interface TableMotionStatus extends TableMotionControls {
  readonly mode: TableMotionMode;
  readonly shakeRemainingSeconds: number;
  readonly tiltRadians: number;
  readonly shakeAngleRadians: number;
  readonly shakeLift: number;
}

export type TableMotionObstacleProvider = () => readonly SolidObstacle[];

export class TableMotionSystem {
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #arena: Arena;
  readonly #snake: Snake;
  readonly #tokenPool: TokenPool;
  readonly #powerUpPool: PowerUpPool;
  readonly #weapon: WeaponSystem;
  readonly #random: RandomSource;
  readonly #config: TableMotionConfig;
  readonly #obstacles: TableMotionObstacleProvider;
  #leftLifted = false;
  #rightLifted = false;
  #bothHeld = false;
  #shakeRemainingSeconds = 0;
  #cachedStatus: TableMotionStatus | null = null;

  constructor(
    stateMachine: StateMachine<GameStateValue>,
    arena: Arena,
    snake: Snake,
    tokenPool: TokenPool,
    powerUpPool: PowerUpPool,
    weapon: WeaponSystem,
    random: RandomSource,
    config: TableMotionConfig,
    obstacles: TableMotionObstacleProvider = () => [],
  ) {
    if (
      config.tiltAngleRadians <= 0 ||
      config.tiltSlideSpeed <= 0 ||
      config.shakeDurationSeconds <= 0 ||
      config.shakeDisplacementSpeed <= 0 ||
      config.shakeAngleRadians <= 0 ||
      config.shakeLift <= 0 ||
      config.snakeCollisionRadius <= 0
    ) {
      throw new Error("Invalid table-motion configuration.");
    }
    this.#stateMachine = stateMachine;
    this.#arena = arena;
    this.#snake = snake;
    this.#tokenPool = tokenPool;
    this.#powerUpPool = powerUpPool;
    this.#weapon = weapon;
    this.#random = random;
    this.#config = Object.freeze({ ...config });
    this.#obstacles = obstacles;
  }

  get status(): TableMotionStatus {
    if (this.#cachedStatus) return this.#cachedStatus;
    const mode = this.#mode;
    this.#cachedStatus = Object.freeze({
      mode,
      leftLifted: this.#leftLifted,
      rightLifted: this.#rightLifted,
      shakeRemainingSeconds: this.#shakeRemainingSeconds,
      tiltRadians:
        mode === TableMotionMode.TILT_LEFT
          ? -this.#config.tiltAngleRadians
          : mode === TableMotionMode.TILT_RIGHT
            ? this.#config.tiltAngleRadians
            : 0,
      shakeAngleRadians: this.#config.shakeAngleRadians,
      shakeLift: this.#config.shakeLift,
    });
    return this.#cachedStatus;
  }

  setControls(controls: TableMotionControls): void {
    const bothHeld = controls.leftLifted && controls.rightLifted;
    this.#leftLifted = controls.leftLifted;
    this.#rightLifted = controls.rightLifted;
    if (
      bothHeld &&
      !this.#bothHeld &&
      ACTIVE_WORLD_STATES.has(this.#stateMachine.state)
    ) {
      this.#shakeRemainingSeconds = this.#config.shakeDurationSeconds;
    }
    this.#bothHeld = bothHeld;
    this.#cachedStatus = null;
  }

  reset(): void {
    this.#leftLifted = false;
    this.#rightLifted = false;
    this.#bothHeld = false;
    this.#shakeRemainingSeconds = 0;
    this.#cachedStatus = null;
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Table-motion deltaSeconds must be finite and non-negative.");
    }
    if (deltaSeconds === 0 || !ACTIVE_WORLD_STATES.has(this.#stateMachine.state)) {
      return;
    }

    if (this.#shakeRemainingSeconds > 0) {
      const activeSeconds = Math.min(deltaSeconds, this.#shakeRemainingSeconds);
      this.#applyShake(activeSeconds);
      const remaining = Math.max(
        0,
        this.#shakeRemainingSeconds - deltaSeconds,
      );
      this.#shakeRemainingSeconds = remaining <= TIME_EPSILON_SECONDS
        ? 0
        : remaining;
      this.#cachedStatus = null;
      return;
    }

    if (this.#leftLifted === this.#rightLifted) return;
    const direction = this.#leftLifted ? 1 : -1;
    this.#moveAll({
      x: direction * this.#config.tiltSlideSpeed * deltaSeconds,
      z: 0,
    });
  }

  get #mode(): TableMotionMode {
    if (this.#shakeRemainingSeconds > 0) return TableMotionMode.SHAKE;
    if (this.#leftLifted && !this.#rightLifted) return TableMotionMode.TILT_LEFT;
    if (this.#rightLifted && !this.#leftLifted) return TableMotionMode.TILT_RIGHT;
    return TableMotionMode.LEVEL;
  }

  #applyShake(deltaSeconds: number): void {
    this.#moveSnake(this.#randomDisplacement(deltaSeconds));
    for (const entity of this.#tokenPool.entities) {
      this.#tokenPool.move(
        entity.id,
        this.#resolveEntityPosition(
          entity.position,
          entity.radius,
          this.#randomDisplacement(deltaSeconds),
        ),
      );
    }
    for (const entity of this.#powerUpPool.entities) {
      this.#powerUpPool.move(
        entity.id,
        this.#resolveEntityPosition(
          entity.position,
          entity.radius,
          this.#randomDisplacement(deltaSeconds),
        ),
      );
    }
    for (const bullet of this.#weapon.bullets) {
      this.#weapon.moveBullet(
        bullet.id,
        this.#resolveEntityPosition(
          bullet.position,
          bullet.radius,
          this.#randomDisplacement(deltaSeconds),
        ),
      );
    }
  }

  #randomDisplacement(deltaSeconds: number): XZPoint {
    const angle = this.#random.next() * TAU;
    const magnitude =
      (0.35 + this.#random.next() * 0.65) *
      this.#config.shakeDisplacementSpeed *
      deltaSeconds;
    return {
      x: Math.cos(angle) * magnitude,
      z: Math.sin(angle) * magnitude,
    };
  }

  #moveAll(displacement: XZPoint): void {
    this.#moveSnake(displacement);
    for (const entity of this.#tokenPool.entities) {
      this.#tokenPool.move(
        entity.id,
        this.#resolveEntityPosition(entity.position, entity.radius, displacement),
      );
    }
    for (const entity of this.#powerUpPool.entities) {
      this.#powerUpPool.move(
        entity.id,
        this.#resolveEntityPosition(entity.position, entity.radius, displacement),
      );
    }
    for (const bullet of this.#weapon.bullets) {
      this.#weapon.moveBullet(
        bullet.id,
        this.#resolveEntityPosition(bullet.position, bullet.radius, displacement),
      );
    }
  }

  #moveSnake(displacement: XZPoint): void {
    const resolved = this.#resolveSnakeDisplacement(displacement);
    if (resolved.x !== 0 || resolved.z !== 0) this.#snake.translate(resolved);
  }

  #resolveSnakeDisplacement(displacement: XZPoint): XZPoint {
    if (this.#snakeCanOccupy(displacement)) return displacement;
    const xOnly = { x: displacement.x, z: 0 };
    if (xOnly.x !== 0 && this.#snakeCanOccupy(xOnly)) return xOnly;
    const zOnly = { x: 0, z: displacement.z };
    if (zOnly.z !== 0 && this.#snakeCanOccupy(zOnly)) return zOnly;
    return { x: 0, z: 0 };
  }

  #snakeCanOccupy(displacement: XZPoint): boolean {
    for (const segment of this.#snake.getSegmentPositions()) {
      const candidate = {
        x: segment.x + displacement.x,
        z: segment.z + displacement.z,
      };
      if (this.#arena.hitsSolidBoundary(candidate, this.#config.snakeCollisionRadius)) {
        return false;
      }
      if (this.#hitsObstacle(candidate, this.#config.snakeCollisionRadius)) return false;
    }
    return true;
  }

  #resolveEntityPosition(
    current: XZPoint,
    radius: number,
    displacement: XZPoint,
  ): XZPoint {
    const full = this.#candidate(current, displacement);
    if (this.#entityCanOccupy(full, radius)) return this.#arena.toDisplayPoint(full);

    const xOnly = this.#candidate(current, { x: displacement.x, z: 0 });
    if (displacement.x !== 0 && this.#entityCanOccupy(xOnly, radius)) {
      return this.#arena.toDisplayPoint(xOnly);
    }
    const zOnly = this.#candidate(current, { x: 0, z: displacement.z });
    if (displacement.z !== 0 && this.#entityCanOccupy(zOnly, radius)) {
      return this.#arena.toDisplayPoint(zOnly);
    }
    return current;
  }

  #entityCanOccupy(position: XZPoint, radius: number): boolean {
    return !this.#arena.hitsSolidBoundary(position, radius) &&
      !this.#hitsObstacle(position, radius);
  }

  #hitsObstacle(position: XZPoint, radius: number): boolean {
    return this.#obstacles().some((obstacle) => {
      const collisionDistance = radius + obstacle.radius;
      return this.#arena.distanceSquared(position, obstacle.position) <=
        collisionDistance * collisionDistance;
    });
  }

  #candidate(current: XZPoint, displacement: XZPoint): XZPoint {
    return {
      x: current.x + displacement.x,
      z: current.z + displacement.z,
    };
  }
}
