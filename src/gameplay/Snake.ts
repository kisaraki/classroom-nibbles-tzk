import {
  Direction,
  directionVector,
  isOppositeDirection,
  type Direction as DirectionValue,
} from "./Direction";
import { Trail, type XZPoint } from "./Trail";

export interface SnakeConfig {
  readonly initialLength: number;
  readonly minimumLength: number;
  readonly maximumLength: number;
  readonly segmentSpacing: number;
  readonly minimumUTurnDistance: number;
  readonly speed: number;
}

export interface SnakeInitialState {
  readonly position?: XZPoint;
  readonly direction?: DirectionValue;
  readonly length?: number;
}

function clampLength(length: number, config: SnakeConfig): number {
  return Math.min(config.maximumLength, Math.max(config.minimumLength, Math.trunc(length)));
}

export class Snake {
  readonly #config: SnakeConfig;
  readonly #trail: Trail;
  readonly #initialPosition: XZPoint;
  readonly #initialDirection: DirectionValue;
  readonly #initialLength: number;
  #headPosition: XZPoint;
  #direction: DirectionValue;
  #directionBeforeLastTurn: DirectionValue;
  #distanceSinceLastTurn = Number.POSITIVE_INFINITY;
  #length: number;

  constructor(config: SnakeConfig, initial: SnakeInitialState = {}) {
    if (
      config.minimumLength < 1 ||
      config.maximumLength < config.minimumLength ||
      config.segmentSpacing <= 0 ||
      config.minimumUTurnDistance < config.segmentSpacing ||
      config.speed <= 0
    ) {
      throw new Error("Invalid snake configuration.");
    }
    this.#config = config;
    this.#initialPosition = initial.position ? { ...initial.position } : { x: 0, z: 0 };
    this.#initialDirection = initial.direction ?? Direction.NORTH;
    this.#initialLength = clampLength(initial.length ?? config.initialLength, config);
    this.#headPosition = { ...this.#initialPosition };
    this.#direction = this.#initialDirection;
    this.#directionBeforeLastTurn = this.#initialDirection;
    this.#length = this.#initialLength;
    const maximumTrailDistance = config.maximumLength * config.segmentSpacing;
    this.#trail = new Trail(this.#headPosition, this.#direction, maximumTrailDistance);
  }

  get direction(): DirectionValue {
    return this.#direction;
  }

  get length(): number {
    return this.#length;
  }

  get speed(): number {
    return this.#config.speed;
  }

  get headPosition(): XZPoint {
    return { ...this.#headPosition };
  }

  trySetDirection(requested: DirectionValue, allowStationaryRecoveryTurn = false): boolean {
    if (requested === this.#direction || isOppositeDirection(this.#direction, requested)) {
      return requested === this.#direction;
    }
    const wouldCurlInward = isOppositeDirection(
      this.#directionBeforeLastTurn,
      requested,
    );
    if (
      wouldCurlInward &&
      !allowStationaryRecoveryTurn &&
      this.#distanceSinceLastTurn < this.#config.minimumUTurnDistance
    ) {
      return false;
    }
    this.#directionBeforeLastTurn = this.#direction;
    this.#direction = requested;
    this.#distanceSinceLastTurn = 0;
    return true;
  }

  previewPosition(deltaSeconds: number): XZPoint {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Snake deltaSeconds must be a finite non-negative number.");
    }
    const forward = directionVector(this.#direction);
    const distance = this.#config.speed * deltaSeconds;
    return {
      x: this.#headPosition.x + forward.x * distance,
      z: this.#headPosition.z + forward.z * distance,
    };
  }

  advance(deltaSeconds: number): void {
    this.#headPosition = this.previewPosition(deltaSeconds);
    this.#distanceSinceLastTurn += this.#config.speed * deltaSeconds;
    this.#trail.record(this.#headPosition);
  }

  setLength(length: number): void {
    this.#length = clampLength(length, this.#config);
  }

  grow(amount = 1): void {
    this.setLength(this.#length + amount);
  }

  shrink(amount = 1): void {
    this.setLength(this.#length - amount);
  }

  reset(): void {
    this.#headPosition = { ...this.#initialPosition };
    this.#direction = this.#initialDirection;
    this.#directionBeforeLastTurn = this.#initialDirection;
    this.#distanceSinceLastTurn = Number.POSITIVE_INFINITY;
    this.#length = this.#initialLength;
    this.#trail.reset(this.#headPosition, this.#direction);
  }

  getSegmentPositions(): readonly XZPoint[] {
    return Object.freeze(
      Array.from({ length: this.#length }, (_, index) =>
        Object.freeze(this.#trail.sample(index * this.#config.segmentSpacing)),
      ),
    );
  }
}
