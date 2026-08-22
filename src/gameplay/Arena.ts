import type { XZPoint } from "./Trail";

export const BoundaryMode = Object.freeze({
  SOLID: "SOLID",
  WRAP: "WRAP",
} as const);

export type BoundaryMode = (typeof BoundaryMode)[keyof typeof BoundaryMode];

export interface ArenaConfig {
  readonly halfWidth: number;
  readonly halfDepth: number;
  readonly xBoundaryMode: BoundaryMode;
  readonly zBoundaryMode: BoundaryMode;
}

function wrapCoordinate(value: number, halfExtent: number): number {
  const span = halfExtent * 2;
  return ((((value + halfExtent) % span) + span) % span) - halfExtent;
}

function wrappedAxisDistance(first: number, second: number, halfExtent: number): number {
  const span = halfExtent * 2;
  const direct = Math.abs(first - second) % span;
  return Math.min(direct, span - direct);
}

export class Arena {
  readonly #config: ArenaConfig;

  constructor(config: ArenaConfig) {
    if (config.halfWidth <= 0 || config.halfDepth <= 0) {
      throw new Error("Arena extents must be positive.");
    }
    this.#config = Object.freeze({ ...config });
  }

  get config(): ArenaConfig {
    return this.#config;
  }

  toDisplayPoint(point: XZPoint): XZPoint {
    return Object.freeze({
      x:
        this.#config.xBoundaryMode === BoundaryMode.WRAP
          ? wrapCoordinate(point.x, this.#config.halfWidth)
          : point.x,
      z:
        this.#config.zBoundaryMode === BoundaryMode.WRAP
          ? wrapCoordinate(point.z, this.#config.halfDepth)
          : point.z,
    });
  }

  hitsSolidBoundary(point: XZPoint, radius: number): boolean {
    if (radius < 0) throw new Error("Collision radius cannot be negative.");
    const hitsX =
      this.#config.xBoundaryMode === BoundaryMode.SOLID &&
      (point.x - radius <= -this.#config.halfWidth ||
        point.x + radius >= this.#config.halfWidth);
    const hitsZ =
      this.#config.zBoundaryMode === BoundaryMode.SOLID &&
      (point.z - radius <= -this.#config.halfDepth ||
        point.z + radius >= this.#config.halfDepth);
    return hitsX || hitsZ;
  }

  distanceSquared(first: XZPoint, second: XZPoint): number {
    const deltaX =
      this.#config.xBoundaryMode === BoundaryMode.WRAP
        ? wrappedAxisDistance(first.x, second.x, this.#config.halfWidth)
        : Math.abs(first.x - second.x);
    const deltaZ =
      this.#config.zBoundaryMode === BoundaryMode.WRAP
        ? wrappedAxisDistance(first.z, second.z, this.#config.halfDepth)
        : Math.abs(first.z - second.z);
    return deltaX * deltaX + deltaZ * deltaZ;
  }
}
