import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { SeededRandom, type RandomSource } from "../core/SeededRandom";
import { CHARACTER_TOKENS } from "../vocabulary/types";
import { Arena, BoundaryMode } from "./Arena";
import { Snake } from "./Snake";
import { SpawnManager } from "./SpawnManager";
import { TokenPool } from "./TokenPool";

function createArena(): Arena {
  return new Arena({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: BoundaryMode.SOLID,
    zBoundaryMode: BoundaryMode.WRAP,
  });
}

function createSpawnManager(arena: Arena, random: RandomSource): SpawnManager {
  return new SpawnManager(arena, random, {
    minimumHeadDistance: 4,
    minimumEntitySpacing: 0.82,
    bodyClearance: 0.68,
    maximumRandomAttempts: 100,
    fallbackGridSpacing: 1.15,
  });
}

describe("SpawnManager and TokenPool", () => {
  it("normalizes the arena to exactly one of every gameplay token", () => {
    const arena = createArena();
    const snake = new Snake(GAMEPLAY_CONFIG.snake);
    const pool = new TokenPool(
      createSpawnManager(arena, new SeededRandom("token-pool")),
      GAMEPLAY_CONFIG.token.collisionRadius,
    );

    pool.normalize(snake);

    expect(pool.entities).toHaveLength(CHARACTER_TOKENS.length);
    expect(new Set(pool.entities.map((entity) => entity.token))).toEqual(
      new Set(CHARACTER_TOKENS),
    );
    for (const entity of pool.entities) {
      expect(arena.distanceSquared(entity.position, snake.headPosition)).toBeGreaterThanOrEqual(16);
    }
    for (let first = 0; first < pool.entities.length; first += 1) {
      for (let second = first + 1; second < pool.entities.length; second += 1) {
        expect(
          arena.distanceSquared(
            pool.entities[first]!.position,
            pool.entities[second]!.position,
          ),
        ).toBeGreaterThanOrEqual(0.82 ** 2);
      }
    }
  });

  it("produces deterministic spawn positions for a seed", () => {
    const arena = createArena();
    const snake = new Snake(GAMEPLAY_CONFIG.snake);
    const positionsForSeed = (): readonly { readonly x: number; readonly z: number }[] => {
      const pool = new TokenPool(
        createSpawnManager(arena, new SeededRandom("repeatable")),
        GAMEPLAY_CONFIG.token.collisionRadius,
      );
      pool.normalize(snake);
      return pool.entities.map((entity) => entity.position);
    };

    expect(positionsForSeed()).toEqual(positionsForSeed());
  });

  it("falls back to precomputed points after the random-attempt limit", () => {
    let randomCalls = 0;
    const fixedRandom: RandomSource = {
      next: () => {
        randomCalls += 1;
        return 0.5;
      },
    };
    const arena = createArena();
    const manager = new SpawnManager(arena, fixedRandom, {
      minimumHeadDistance: 4,
      minimumEntitySpacing: 0.82,
      bodyClearance: 0.68,
      maximumRandomAttempts: 3,
      fallbackGridSpacing: 1.15,
    });

    const position = manager.findPosition({
      radius: 0.36,
      snakeHead: { x: 0, z: 0 },
      snakeSegments: [{ x: 0, z: 0 }],
      occupied: [],
    });

    expect(randomCalls).toBe(6);
    expect(arena.distanceSquared(position, { x: 0, z: 0 })).toBeGreaterThanOrEqual(16);
  });
});
