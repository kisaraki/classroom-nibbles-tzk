import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { createGameStateMachine, GameState } from "../core/GameState";
import { SeededRandom } from "../core/SeededRandom";
import { Arena } from "./Arena";
import { PowerUpPool } from "./PowerUpPool";
import { Snake } from "./Snake";
import { SpawnManager } from "./SpawnManager";
import { TableMotionMode, TableMotionSystem } from "./TableMotionSystem";
import { TokenPool } from "./TokenPool";
import { WeaponSystem } from "./WeaponSystem";

function createFixture(seed = "table-motion-test") {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.VOCABULARY_SELECT);
  stateMachine.transition(GameState.TRANSITION_IN);
  stateMachine.transition(GameState.HUNTING);
  const arena = new Arena(GAMEPLAY_CONFIG.arena);
  const snake = new Snake(GAMEPLAY_CONFIG.snake);
  const spawnManager = new SpawnManager(
    arena,
    new SeededRandom(`${seed}:spawns`),
    {
      minimumHeadDistance: GAMEPLAY_CONFIG.token.minimumHeadDistance,
      minimumEntitySpacing: GAMEPLAY_CONFIG.token.minimumEntitySpacing,
      bodyClearance: GAMEPLAY_CONFIG.token.bodyClearance,
      maximumRandomAttempts: GAMEPLAY_CONFIG.token.maximumRandomAttempts,
      fallbackGridSpacing: GAMEPLAY_CONFIG.token.fallbackGridSpacing,
    },
  );
  let powerUpPool: PowerUpPool | null = null;
  const tokenPool = new TokenPool(
    spawnManager,
    GAMEPLAY_CONFIG.token.collisionRadius,
    () => powerUpPool?.spawnOccupants ?? [],
  );
  tokenPool.normalize(snake);
  powerUpPool = new PowerUpPool(
    spawnManager,
    GAMEPLAY_CONFIG.powerUp.collisionRadius,
    () => tokenPool.entities.map((entity) => ({
      position: entity.position,
      radius: entity.radius,
    })),
  );
  powerUpPool.normalize(snake);
  const weapon = new WeaponSystem(arena, GAMEPLAY_CONFIG.weapon);
  const system = new TableMotionSystem(
    stateMachine,
    arena,
    snake,
    tokenPool,
    powerUpPool,
    weapon,
    new SeededRandom(`${seed}:motion`),
    GAMEPLAY_CONFIG.tableMotion,
  );
  return { stateMachine, arena, snake, tokenPool, powerUpPool, weapon, system };
}

describe("TableMotionSystem", () => {
  it("slides every tabletop object away from the lifted side until release", () => {
    const fixture = createFixture();
    const token = fixture.tokenPool.entities.find(
      (entity) => Math.abs(entity.position.x) < 7,
    )!;
    const powerUp = fixture.powerUpPool.entities.find(
      (entity) => Math.abs(entity.position.x) < 7,
    )!;
    const initialHeadX = fixture.snake.headPosition.x;
    const initialTokenX = token.position.x;
    const initialPowerUpX = powerUp.position.x;

    fixture.system.setControls({ leftLifted: true, rightLifted: false });
    fixture.system.update(0.5);

    expect(fixture.system.status.mode).toBe(TableMotionMode.TILT_LEFT);
    expect(fixture.snake.headPosition.x).toBeGreaterThan(initialHeadX);
    expect(fixture.tokenPool.getById(token.id)!.position.x).toBeGreaterThan(
      initialTokenX,
    );
    expect(fixture.powerUpPool.getById(powerUp.id)!.position.x).toBeGreaterThan(
      initialPowerUpX,
    );

    fixture.system.setControls({ leftLifted: false, rightLifted: false });
    const releasedHeadX = fixture.snake.headPosition.x;
    fixture.system.update(0.5);
    expect(fixture.system.status.mode).toBe(TableMotionMode.LEVEL);
    expect(fixture.snake.headPosition.x).toBeCloseTo(releasedHeadX);

    fixture.system.setControls({ leftLifted: false, rightLifted: true });
    fixture.system.update(0.25);
    expect(fixture.system.status.mode).toBe(TableMotionMode.TILT_RIGHT);
    expect(fixture.snake.headPosition.x).toBeLessThan(releasedHeadX);
  });

  it("shakes deterministically for as long as both Shift keys remain held", () => {
    const first = createFixture("same-seed");
    const second = createFixture("same-seed");
    const initialHead = first.snake.headPosition;
    const initialToken = first.tokenPool.entities[0]!.position;

    for (const fixture of [first, second]) {
      fixture.system.setControls({ leftLifted: true, rightLifted: true });
      expect(fixture.system.status.mode).toBe(TableMotionMode.SHAKE);
      for (let index = 0; index < 180; index += 1) {
        fixture.system.update(1 / 60);
      }
      expect(fixture.system.status.mode).toBe(TableMotionMode.SHAKE);
    }

    expect(first.snake.headPosition).toEqual(second.snake.headPosition);
    expect(first.tokenPool.entities.map((entity) => entity.position)).toEqual(
      second.tokenPool.entities.map((entity) => entity.position),
    );
    expect(first.snake.headPosition).not.toEqual(initialHead);
    expect(first.tokenPool.entities[0]!.position).not.toEqual(initialToken);

    first.system.setControls({ leftLifted: false, rightLifted: false });
    const releasedHead = first.snake.headPosition;
    first.system.update(1);
    expect(first.system.status.mode).toBe(TableMotionMode.LEVEL);
    expect(first.snake.headPosition).toEqual(releasedHead);
  });

  it("does not move the world while a held shake is paused", () => {
    const fixture = createFixture();
    fixture.system.setControls({ leftLifted: true, rightLifted: true });
    fixture.stateMachine.transition(GameState.PAUSED);
    const before = fixture.snake.headPosition;

    fixture.system.update(1);

    expect(fixture.snake.headPosition).toEqual(before);
    expect(fixture.system.status.mode).toBe(TableMotionMode.SHAKE);
  });
});
