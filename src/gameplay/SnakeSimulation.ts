import { GameState, type GameState as GameStateValue } from "../core/GameState";
import type { StateMachine } from "../core/StateMachine";
import { Arena } from "./Arena";
import { CollisionKind, CollisionSystem } from "./CollisionSystem";
import type { Direction } from "./Direction";
import { Snake } from "./Snake";
import type { XZPoint } from "./Trail";

export interface SnakeSimulationConfig {
  readonly stunDurationSeconds: number;
  readonly recoveryDurationSeconds: number;
}

export interface CollisionEvent {
  readonly kind: CollisionKind;
  readonly attemptedPosition: XZPoint;
}

export interface SnakeSimulationStatus {
  readonly state: GameStateValue;
  readonly direction: Direction;
  readonly length: number;
  readonly speed: number;
  readonly headPosition: XZPoint;
  readonly latestCollision: CollisionKind | null;
}

export type CollisionListener = (event: CollisionEvent) => void;

export class SnakeSimulation {
  readonly #snake: Snake;
  readonly #arena: Arena;
  readonly #collisionSystem: CollisionSystem;
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #config: SnakeSimulationConfig;
  readonly #collisionListeners = new Set<CollisionListener>();
  #delayRemainingSeconds = 0;
  #latestCollision: CollisionKind | null = null;
  #recoveryRequired = false;

  constructor(
    snake: Snake,
    arena: Arena,
    collisionSystem: CollisionSystem,
    stateMachine: StateMachine<GameStateValue>,
    config: SnakeSimulationConfig,
  ) {
    if (config.stunDurationSeconds <= 0 || config.recoveryDurationSeconds <= 0) {
      throw new Error("Collision delay durations must be positive.");
    }
    this.#snake = snake;
    this.#arena = arena;
    this.#collisionSystem = collisionSystem;
    this.#stateMachine = stateMachine;
    this.#config = Object.freeze({ ...config });
  }

  get snake(): Snake {
    return this.#snake;
  }

  get arena(): Arena {
    return this.#arena;
  }

  get status(): SnakeSimulationStatus {
    return Object.freeze({
      state: this.#stateMachine.state,
      direction: this.#snake.direction,
      length: this.#snake.length,
      speed: this.#snake.speed,
      headPosition: this.#arena.toDisplayPoint(this.#snake.headPosition),
      latestCollision: this.#latestCollision,
    });
  }

  requestDirection(direction: Direction): boolean {
    if (
      this.#stateMachine.state !== GameState.HUNTING &&
      this.#stateMachine.state !== GameState.RECOVERY
    ) {
      return false;
    }
    return this.#snake.trySetDirection(direction);
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Simulation deltaSeconds must be a finite non-negative number.");
    }

    if (this.#stateMachine.state === GameState.STUNNED) {
      this.#advanceStun(deltaSeconds);
      return;
    }
    if (this.#stateMachine.state === GameState.RECOVERY) {
      this.#advanceRecovery(deltaSeconds);
      return;
    }
    if (this.#stateMachine.state !== GameState.HUNTING) return;

    const candidate = this.#snake.previewPosition(deltaSeconds);
    const collision = this.#collisionSystem.detect(candidate, this.#snake, this.#arena);
    if (collision) {
      this.#enterStun(collision, candidate);
      return;
    }
    this.#snake.advance(deltaSeconds);
  }

  applyWrongTokenCollision(position: XZPoint): boolean {
    if (this.#stateMachine.state !== GameState.HUNTING) return false;
    this.#enterStun(CollisionKind.WRONG_TOKEN, position, false);
    return true;
  }

  subscribeToCollisions(listener: CollisionListener): () => void {
    this.#collisionListeners.add(listener);
    return () => this.#collisionListeners.delete(listener);
  }

  reset(): void {
    this.#snake.reset();
    this.#delayRemainingSeconds = 0;
    this.#latestCollision = null;
    this.#recoveryRequired = false;
  }

  #enterStun(
    kind: CollisionKind,
    attemptedPosition: XZPoint,
    recoveryRequired = true,
  ): void {
    this.#latestCollision = kind;
    this.#recoveryRequired = recoveryRequired;
    this.#delayRemainingSeconds = this.#config.stunDurationSeconds;
    this.#stateMachine.transition(GameState.STUNNED);
    const event = Object.freeze({
      kind,
      attemptedPosition: this.#arena.toDisplayPoint(attemptedPosition),
    });
    for (const listener of this.#collisionListeners) listener(event);
  }

  #advanceStun(deltaSeconds: number): void {
    this.#delayRemainingSeconds -= deltaSeconds;
    if (this.#delayRemainingSeconds > 0) return;
    if (!this.#recoveryRequired) {
      this.#delayRemainingSeconds = 0;
      this.#stateMachine.transition(GameState.HUNTING);
      return;
    }
    this.#delayRemainingSeconds = this.#config.recoveryDurationSeconds;
    this.#stateMachine.transition(GameState.RECOVERY);
  }

  #advanceRecovery(deltaSeconds: number): void {
    this.#delayRemainingSeconds -= deltaSeconds;
    if (this.#delayRemainingSeconds > 0) return;
    this.#delayRemainingSeconds = 0;
    this.#stateMachine.transition(GameState.HUNTING);
  }
}
