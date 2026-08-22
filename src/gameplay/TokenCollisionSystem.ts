import { Arena } from "./Arena";
import type { TokenEntity } from "./TokenPool";
import type { XZPoint } from "./Trail";

export class TokenCollisionSystem {
  readonly #headRadius: number;

  constructor(headRadius: number) {
    if (headRadius <= 0) throw new Error("Token collision head radius must be positive.");
    this.#headRadius = headRadius;
  }

  detect(
    headPosition: XZPoint,
    entities: readonly TokenEntity[],
    arena: Arena,
  ): TokenEntity | null {
    for (const entity of entities) {
      const collisionDistance = this.#headRadius + entity.radius;
      if (
        arena.distanceSquared(headPosition, entity.position) <=
        collisionDistance * collisionDistance
      ) {
        return entity;
      }
    }
    return null;
  }
}
