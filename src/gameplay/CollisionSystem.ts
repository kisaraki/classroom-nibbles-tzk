import { Arena } from "./Arena";
import type { Snake } from "./Snake";
import type { XZPoint } from "./Trail";

export const CollisionKind = Object.freeze({
  SOLID_WALL: "SOLID_WALL",
  SOLID_OBSTACLE: "SOLID_OBSTACLE",
  SELF: "SELF",
  WRONG_TOKEN: "WRONG_TOKEN",
} as const);

export type CollisionKind = (typeof CollisionKind)[keyof typeof CollisionKind];

export interface CollisionSystemConfig {
  readonly headRadius: number;
  readonly bodyRadius: number;
  readonly ignoredLeadingSegments: number;
}

export interface SolidObstacle {
  readonly position: XZPoint;
  readonly radius: number;
}

export class CollisionSystem {
  readonly #config: CollisionSystemConfig;

  constructor(config: CollisionSystemConfig) {
    if (
      config.headRadius <= 0 ||
      config.bodyRadius <= 0 ||
      !Number.isInteger(config.ignoredLeadingSegments) ||
      config.ignoredLeadingSegments < 1
    ) {
      throw new Error("Invalid collision configuration.");
    }
    this.#config = Object.freeze({ ...config });
  }

  detect(
    candidateHead: XZPoint,
    snake: Snake,
    arena: Arena,
    obstacles: readonly SolidObstacle[] = [],
  ): CollisionKind | null {
    if (arena.hitsSolidBoundary(candidateHead, this.#config.headRadius)) {
      return CollisionKind.SOLID_WALL;
    }

    for (const obstacle of obstacles) {
      const collisionDistance = this.#config.headRadius + obstacle.radius;
      if (
        arena.distanceSquared(candidateHead, obstacle.position) <=
        collisionDistance * collisionDistance
      ) {
        return CollisionKind.SOLID_OBSTACLE;
      }
    }

    const collisionDistance = this.#config.headRadius + this.#config.bodyRadius;
    const collisionDistanceSquared = collisionDistance * collisionDistance;
    const segments = snake.getSegmentPositions();
    for (let index = this.#config.ignoredLeadingSegments; index < segments.length; index += 1) {
      const segment = segments[index];
      if (segment && arena.distanceSquared(candidateHead, segment) <= collisionDistanceSquared) {
        return CollisionKind.SELF;
      }
    }
    return null;
  }
}
