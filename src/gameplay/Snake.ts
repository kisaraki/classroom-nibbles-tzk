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
  #headPosition: XZPoint;
  #direction: DirectionValue;
  #directionBeforeLastTurn: DirectionValue;
  #distanceSinceLastTurn = Number.POSITIVE_INFINITY;
  #length: number;
  #speed: number;

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
    this.#headPosition = initial.position ? { ...initial.position } : { x: 0, z: 0 };
    this.#direction = initial.direction ?? Direction.NORTH;
    this.#directionBeforeLastTurn = this.#direction;
    this.#length = clampLength(initial.length ?? config.initialLength, config);
    this.#speed = config.speed;
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
    return this.#speed;
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
    const distance = this.#speed * deltaSeconds;
    return {
      x: this.#headPosition.x + forward.x * distance,
      z: this.#headPosition.z + forward.z * distance,
    };
  }

  advance(deltaSeconds: number): void {
    this.#headPosition = this.previewPosition(deltaSeconds);
    this.#distanceSinceLastTurn += this.#speed * deltaSeconds;
    this.#trail.record(this.#headPosition);
  }

  translate(displacement: XZPoint): void {
    if (!Number.isFinite(displacement.x) || !Number.isFinite(displacement.z)) {
      throw new Error("Snake displacement must contain finite coordinates.");
    }
    this.#headPosition = {
      x: this.#headPosition.x + displacement.x,
      z: this.#headPosition.z + displacement.z,
    };
    this.#trail.translate(displacement);
  }

  setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new Error("Snake speed must be finite and positive.");
    }
    this.#speed = speed;
  }

  reverseOrientation(): void {
    const tailDistance = (this.#length - 1) * this.#config.segmentSpacing;
    const sampleOffset = Math.min(this.#config.segmentSpacing / 100, 0.001);
    const tail = this.#trail.sample(tailDistance);
    const towardBody = this.#trail.sample(tailDistance - sampleOffset);
    const outwardX = tail.x - towardBody.x;
    const outwardZ = tail.z - towardBody.z;
    const nextDirection = Math.abs(outwardX) >= Math.abs(outwardZ)
      ? outwardX >= 0 ? Direction.EAST : Direction.WEST
      : outwardZ >= 0 ? Direction.SOUTH : Direction.NORTH;
    const oldDirection = this.#direction;

    this.#trail.reversePrefix(tailDistance, oldDirection);
    this.#headPosition = tail;
    this.#direction = nextDirection;
    this.#directionBeforeLastTurn = nextDirection;
    this.#distanceSinceLastTurn = Number.POSITIVE_INFINITY;
  }

  setLength(length: number): void {
    this.#length = clampLength(length, this.#config);
  }

  resetPose(initial: SnakeInitialState = {}): void {
    this.#headPosition = initial.position ? { ...initial.position } : { x: 0, z: 0 };
    this.#direction = initial.direction ?? Direction.NORTH;
    this.#directionBeforeLastTurn = this.#direction;
    this.#distanceSinceLastTurn = Number.POSITIVE_INFINITY;
    if (initial.length !== undefined) this.#length = clampLength(initial.length, this.#config);
    this.#trail.reset(this.#headPosition, this.#direction);
  }

  grow(amount = 1): void {
    this.setLength(this.#length + amount);
  }

  shrink(amount = 1): void {
    this.setLength(this.#length - amount);
  }

  getSegmentPositions(): readonly XZPoint[] {
    return Object.freeze(
      Array.from({ length: this.#length }, (_, index) =>
        Object.freeze(this.#trail.sample(index * this.#config.segmentSpacing)),
      ),
    );
  }
}
