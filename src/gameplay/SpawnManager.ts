import type { RandomSource } from "../core/SeededRandom";
import { Arena } from "./Arena";
import type { XZPoint } from "./Trail";

export interface SpawnManagerConfig {
  readonly minimumHeadDistance: number;
  readonly minimumEntitySpacing: number;
  readonly bodyClearance: number;
  readonly maximumRandomAttempts: number;
  readonly fallbackGridSpacing: number;
}

export interface SpawnOccupant {
  readonly position: XZPoint;
  readonly radius: number;
}

export interface SpawnRequest {
  readonly radius: number;
  readonly snakeHead: XZPoint;
  readonly snakeSegments: readonly XZPoint[];
  readonly occupied: readonly SpawnOccupant[];
}

export type SolidGeometryProvider = () => readonly SpawnOccupant[];

export class SpawnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpawnError";
  }
}

export class SpawnManager {
  readonly #arena: Arena;
  readonly #random: RandomSource;
  readonly #config: SpawnManagerConfig;
  readonly #fallbackPoints: readonly XZPoint[];
  readonly #solidGeometry: SolidGeometryProvider;

  constructor(
    arena: Arena,
    random: RandomSource,
    config: SpawnManagerConfig,
    solidGeometry: SolidGeometryProvider = () => [],
  ) {
    if (
      config.minimumHeadDistance < 0 ||
      config.minimumEntitySpacing <= 0 ||
      config.bodyClearance <= 0 ||
      !Number.isInteger(config.maximumRandomAttempts) ||
      config.maximumRandomAttempts < 1 ||
      config.fallbackGridSpacing <= 0
    ) {
      throw new Error("Invalid spawn manager configuration.");
    }
    this.#arena = arena;
    this.#random = random;
    this.#config = Object.freeze({ ...config });
    this.#solidGeometry = solidGeometry;
    this.#fallbackPoints = Object.freeze(this.#createFallbackPoints());
  }

  findPosition(request: SpawnRequest): XZPoint {
    if (request.radius <= 0) throw new Error("Spawn radius must be positive.");
    for (let attempt = 0; attempt < this.#config.maximumRandomAttempts; attempt += 1) {
      const candidate = this.#randomPoint(request.radius);
      if (this.#isValid(candidate, request)) return Object.freeze(candidate);
    }

    for (const fallback of this.#fallbackPoints) {
      if (this.#insideArena(fallback, request.radius) && this.#isValid(fallback, request)) {
        return Object.freeze({ ...fallback });
      }
    }
    throw new SpawnError("No valid random or fallback spawn position is available.");
  }

  #randomPoint(radius: number): XZPoint {
    const { halfWidth, halfDepth } = this.#arena.config;
    const minimumX = -halfWidth + radius;
    const maximumX = halfWidth - radius;
    const minimumZ = -halfDepth + radius;
    const maximumZ = halfDepth - radius;
    return {
      x: minimumX + this.#random.next() * (maximumX - minimumX),
      z: minimumZ + this.#random.next() * (maximumZ - minimumZ),
    };
  }

  #isValid(candidate: XZPoint, request: SpawnRequest): boolean {
    if (!this.#insideArena(candidate, request.radius)) return false;
    const minimumHeadDistanceSquared =
      this.#config.minimumHeadDistance * this.#config.minimumHeadDistance;
    if (this.#arena.distanceSquared(candidate, request.snakeHead) < minimumHeadDistanceSquared) {
      return false;
    }

    const bodyClearanceSquared = this.#config.bodyClearance * this.#config.bodyClearance;
    if (
      request.snakeSegments.some(
        (segment) => this.#arena.distanceSquared(candidate, segment) < bodyClearanceSquared,
      )
    ) {
      return false;
    }

    if (
      this.#solidGeometry().some((obstacle) => {
        const clearance = request.radius + obstacle.radius;
        return (
          this.#arena.distanceSquared(candidate, obstacle.position) <
          clearance * clearance
        );
      })
    ) {
      return false;
    }

    return request.occupied.every((occupant) => {
      const minimumDistance = Math.max(
        this.#config.minimumEntitySpacing,
        request.radius + occupant.radius,
      );
      return (
        this.#arena.distanceSquared(candidate, occupant.position) >=
        minimumDistance * minimumDistance
      );
    });
  }

  #insideArena(point: XZPoint, radius: number): boolean {
    const { halfWidth, halfDepth } = this.#arena.config;
    return (
      point.x - radius > -halfWidth &&
      point.x + radius < halfWidth &&
      point.z - radius > -halfDepth &&
      point.z + radius < halfDepth
    );
  }

  #createFallbackPoints(): XZPoint[] {
    const { halfWidth, halfDepth } = this.#arena.config;
    const points: XZPoint[] = [];
    const spacing = this.#config.fallbackGridSpacing;
    for (let z = -halfDepth + spacing; z <= halfDepth - spacing; z += spacing) {
      for (let x = -halfWidth + spacing; x <= halfWidth - spacing; x += spacing) {
        points.push(Object.freeze({ x, z }));
      }
    }
    return points.sort((first, second) => {
      const firstDistance = first.x * first.x + first.z * first.z;
      const secondDistance = second.x * second.x + second.z * second.z;
      if (firstDistance !== secondDistance) return secondDistance - firstDistance;
      if (first.z !== second.z) return first.z - second.z;
      return first.x - second.x;
    });
  }
}
