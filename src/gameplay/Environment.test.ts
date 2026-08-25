import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG, GAME_LEVEL_CONFIGS } from "../core/Config";
import { SeededRandom } from "../core/SeededRandom";
import { CHARACTER_TOKENS } from "../vocabulary/types";
import { Arena } from "./Arena";
import {
  ENVIRONMENT_PROFILES,
  EnvironmentController,
  environmentForLevel,
} from "./Environment";
import { POWER_UP_KINDS, PowerUpPool } from "./PowerUpPool";
import { Snake } from "./Snake";
import { SpawnManager } from "./SpawnManager";
import { TokenPool } from "./TokenPool";

describe("Phase 7 environments", () => {
  it("defines one distinct functional environment for every Game Level", () => {
    expect(ENVIRONMENT_PROFILES).toHaveLength(5);
    expect(new Set(ENVIRONMENT_PROFILES.map((profile) => profile.kind)).size).toBe(5);
    expect(new Set(ENVIRONMENT_PROFILES.map((profile) => profile.uiTheme.accent)).size).toBe(5);
    expect(new Set(ENVIRONMENT_PROFILES.map((profile) => profile.uiTheme.cabinet)).size).toBe(5);
    expect(new Set(ENVIRONMENT_PROFILES.map((profile) => profile.uiTheme.rail)).size).toBe(5);
    expect(new Set(ENVIRONMENT_PROFILES.map((profile) => profile.uiTheme.lamp)).size).toBe(5);
    expect(
      new Set(ENVIRONMENT_PROFILES.map((profile) => profile.spaceBackdrop.id)).size,
    ).toBe(5);
    expect(
      new Set(
        ENVIRONMENT_PROFILES.map((profile) => profile.palette.mechaPrimaryColor),
      ).size,
    ).toBe(5);

    for (const level of GAME_LEVEL_CONFIGS) {
      const profile = environmentForLevel(level.gameLevel);
      expect(profile.sceneName).toBe(level.sceneName);
      expect(profile.featureLabel.length).toBeGreaterThan(0);
      expect(profile.obstacles.length).toBeGreaterThanOrEqual(6);
      expect(profile.palette.fogFar).toBeGreaterThan(profile.palette.fogNear);
      expect(profile.uiTheme.accent).toMatch(/^#[\da-f]{6}$/iu);
      expect(profile.uiTheme.cabinet).toMatch(/^#[\da-f]{6}$/iu);
      expect(profile.uiTheme.cabinetDeep).toMatch(/^#[\da-f]{6}$/iu);
      expect(profile.uiTheme.rail).toMatch(/^#[\da-f]{6}$/iu);
      expect(profile.uiTheme.lamp).toMatch(/^#[\da-f]{6}$/iu);
      expect(profile.spaceBackdrop.label.length).toBeGreaterThan(0);
      expect(profile.spaceBackdrop.celestialAngularRadius).toBeGreaterThan(0);
    }
  });

  it("uses the requested cumulative word ladder with playable scaled timers", () => {
    expect(GAME_LEVEL_CONFIGS.map((level) => level.wordsPerScene)).toEqual([
      5,
      10,
      15,
      20,
      25,
    ]);
    expect(GAME_LEVEL_CONFIGS.map((level) => level.durationSeconds)).toEqual([
      120,
      180,
      270,
      360,
      300,
    ]);
  });

  it("starts slowly and increases machine speed in every successive level", () => {
    expect(GAME_LEVEL_CONFIGS.map((level) => level.snakeSpeed)).toEqual([
      3,
      3.75,
      4.5,
      5.25,
      6,
    ]);
    for (let index = 1; index < GAME_LEVEL_CONFIGS.length; index += 1) {
      expect(GAME_LEVEL_CONFIGS[index]!.snakeSpeed).toBeGreaterThan(
        GAME_LEVEL_CONFIGS[index - 1]!.snakeSpeed,
      );
    }
  });

  it("keeps every solid obstacle inside the configured arena and clear of the start", () => {
    const { halfWidth, halfDepth } = GAMEPLAY_CONFIG.arena;
    for (const profile of ENVIRONMENT_PROFILES) {
      expect(new Set(profile.obstacles.map((obstacle) => obstacle.id)).size).toBe(
        profile.obstacles.length,
      );
      for (const obstacle of profile.obstacles) {
        expect(Math.abs(obstacle.position.x) + obstacle.radius).toBeLessThan(halfWidth);
        expect(Math.abs(obstacle.position.z) + obstacle.radius).toBeLessThan(halfDepth);
        expect(
          obstacle.position.x ** 2 + obstacle.position.z ** 2,
        ).toBeGreaterThanOrEqual(4 ** 2);
      }
    }
  });

  it("switches obstacle fields atomically by Game Level", () => {
    const controller = new EnvironmentController();
    expect(controller.current.gameLevel).toBe(1);
    expect(controller.obstacles[0]?.id).toMatch(/^cargo-/);

    const selected = controller.select(5);
    expect(selected.gameLevel).toBe(5);
    expect(controller.current).toBe(selected);
    expect(controller.obstacles[0]?.id).toMatch(/^tree-/);
  });

  it("has enough obstacle-free space for every token and persistent power-up", () => {
    const arena = new Arena(GAMEPLAY_CONFIG.arena);
    const snake = new Snake(GAMEPLAY_CONFIG.snake);
    for (const profile of ENVIRONMENT_PROFILES) {
      const spawnManager = new SpawnManager(
        arena,
        new SeededRandom(`environment-capacity-${profile.gameLevel}`),
        {
          minimumHeadDistance: GAMEPLAY_CONFIG.token.minimumHeadDistance,
          minimumEntitySpacing: GAMEPLAY_CONFIG.token.minimumEntitySpacing,
          bodyClearance: GAMEPLAY_CONFIG.token.bodyClearance,
          maximumRandomAttempts: GAMEPLAY_CONFIG.token.maximumRandomAttempts,
          fallbackGridSpacing: GAMEPLAY_CONFIG.token.fallbackGridSpacing,
        },
        () => profile.obstacles,
      );
      let powerUps: PowerUpPool | null = null;
      const tokens = new TokenPool(
        spawnManager,
        GAMEPLAY_CONFIG.token.collisionRadius,
        () => powerUps?.spawnOccupants ?? [],
      );
      powerUps = new PowerUpPool(
        spawnManager,
        GAMEPLAY_CONFIG.powerUp.collisionRadius,
        () => tokens.entities,
      );

      tokens.normalize(snake);
      powerUps.normalize(snake);

      expect(tokens.entities).toHaveLength(CHARACTER_TOKENS.length);
      expect(powerUps.entities).toHaveLength(POWER_UP_KINDS.length);
      for (const entity of [...tokens.entities, ...powerUps.entities]) {
        for (const obstacle of profile.obstacles) {
          const clearance = entity.radius + obstacle.radius;
          expect(
            arena.distanceSquared(entity.position, obstacle.position),
          ).toBeGreaterThanOrEqual(clearance * clearance);
        }
      }
    }
  });
});
