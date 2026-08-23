import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { createGameStateMachine, GameState } from "../core/GameState";
import { SeededRandom } from "../core/SeededRandom";
import { Arena, BoundaryMode } from "./Arena";
import { Direction } from "./Direction";
import { POWER_UP_KINDS, PowerUpKind, PowerUpPool } from "./PowerUpPool";
import { PowerUpWeaponSession } from "./PowerUpWeaponSession";
import { Snake } from "./Snake";
import { SpawnManager } from "./SpawnManager";
import { TokenPool } from "./TokenPool";
import { WeaponSystem } from "./WeaponSystem";

function createFixture(): {
  readonly session: PowerUpWeaponSession;
  readonly stateMachine: ReturnType<typeof createGameStateMachine>;
  readonly arena: Arena;
  readonly tokenPool: TokenPool;
  readonly powerUpPool: PowerUpPool;
  readonly weapon: WeaponSystem;
  readonly timeAdjustments: number[];
} {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.VOCABULARY_SELECT);
  stateMachine.transition(GameState.TRANSITION_IN);
  stateMachine.transition(GameState.HUNTING);
  const arena = new Arena({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: BoundaryMode.SOLID,
    zBoundaryMode: BoundaryMode.WRAP,
  });
  const snake = new Snake(GAMEPLAY_CONFIG.snake);
  const spawnManager = new SpawnManager(
    arena,
    new SeededRandom("phase-five-session"),
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
  const timeAdjustments: number[] = [];
  const weapon = new WeaponSystem(arena, GAMEPLAY_CONFIG.weapon);
  const session = new PowerUpWeaponSession(
    stateMachine,
    snake,
    arena,
    tokenPool,
    powerUpPool,
    weapon,
    GAMEPLAY_CONFIG.snake.headCollisionRadius,
    GAMEPLAY_CONFIG.powerUp.attackAmmoReward,
    (deltaSeconds) => timeAdjustments.push(deltaSeconds),
  );
  return {
    session,
    stateMachine,
    arena,
    tokenPool,
    powerUpPool,
    weapon,
    timeAdjustments,
  };
}

describe("PowerUpWeaponSession", () => {
  it("publishes power-up collection and non-expiry bullet-impact events", () => {
    const { session, tokenPool, weapon } = createFixture();
    const powerUps: string[] = [];
    const impacts: string[] = [];
    session.subscribeToPowerUpCollections((result) => powerUps.push(result.kind));
    session.subscribeToBulletImpacts((kind) => impacts.push(kind));

    const attack = session.powerUpEntities.find(
      (entity) => entity.kind === PowerUpKind.ATTACK,
    )!;
    session.resolvePowerUpCollision(attack.id);
    const token = tokenPool.entities[0]!;
    weapon.fire({ x: token.position.x, z: token.position.z + 1.88 }, Direction.NORTH);
    session.update(0.1);

    expect(powerUps).toEqual([PowerUpKind.ATTACK]);
    expect(impacts).toEqual(["TOKEN"]);
  });

  it("always keeps one of each power-up without overlapping tokens", () => {
    const { session, arena, tokenPool, powerUpPool } = createFixture();

    expect(session.powerUpEntities).toHaveLength(5);
    expect(new Set(session.powerUpEntities.map((entity) => entity.kind))).toEqual(
      new Set(POWER_UP_KINDS),
    );
    expect(powerUpPool.spawnOccupants).toHaveLength(5);
    for (const powerUp of session.powerUpEntities) {
      expect(arena.distanceSquared(powerUp.position, { x: 0, z: 0 })).toBeGreaterThanOrEqual(16);
      for (const token of tokenPool.entities) {
        expect(arena.distanceSquared(powerUp.position, token.position)).toBeGreaterThanOrEqual(
          GAMEPLAY_CONFIG.token.minimumEntitySpacing ** 2,
        );
      }
    }
  });

  it("applies every signed time power-up and immediately respawns each kind", () => {
    const { session, timeAdjustments } = createFixture();
    const cases = [
      [PowerUpKind.TIME_PLUS_10, 10],
      [PowerUpKind.TIME_PLUS_5, 5],
      [PowerUpKind.TIME_MINUS_10, -10],
      [PowerUpKind.TIME_MINUS_5, -5],
    ] as const;

    for (const [kind, timeDeltaSeconds] of cases) {
      const powerUp = session.powerUpEntities.find((entity) => entity.kind === kind)!;
      expect(session.resolvePowerUpCollision(powerUp.id)).toEqual({
        kind,
        timeDeltaSeconds,
        ammoDelta: 0,
      });
      expect(session.powerUpEntities.some((entity) => entity.id === powerUp.id)).toBe(false);
      expect(session.powerUpEntities.filter((entity) => entity.kind === kind)).toHaveLength(1);
    }

    expect(timeAdjustments).toEqual([10, 5, -10, -5]);
    expect(session.powerUpEntities).toHaveLength(5);
  });

  it("adds cumulative ammo, fires while hunting, and rejects stun firing", () => {
    const { session, stateMachine } = createFixture();
    const attack = session.powerUpEntities.find(
      (entity) => entity.kind === PowerUpKind.ATTACK,
    )!;

    expect(session.resolvePowerUpCollision(attack.id)?.ammoDelta).toBe(5);
    const respawnedAttack = session.powerUpEntities.find(
      (entity) => entity.kind === PowerUpKind.ATTACK,
    )!;
    expect(session.resolvePowerUpCollision(respawnedAttack.id)?.ammoDelta).toBe(5);
    expect(session.status.ammo).toBe(10);
    expect(session.fire()).toBe(true);
    expect(session.status.ammo).toBe(9);
    expect(session.status.bulletCount).toBe(1);

    stateMachine.transition(GameState.STUNNED);
    expect(session.fire()).toBe(false);
    expect(session.status.ammo).toBe(9);
  });

  it("repositions shot tokens and power-ups without collecting or activating them", () => {
    const tokenFixture = createFixture();
    const token = tokenFixture.tokenPool.entities[0]!;
    tokenFixture.weapon.addAmmo(1);
    tokenFixture.weapon.fire(
      { x: token.position.x, z: token.position.z + 1.88 },
      Direction.NORTH,
    );

    tokenFixture.session.update(0.1);

    expect(tokenFixture.tokenPool.getById(token.id)).toBeNull();
    expect(tokenFixture.tokenPool.entities).toHaveLength(30);
    expect(tokenFixture.session.status.latestBulletImpact).toBe("TOKEN");
    expect(tokenFixture.timeAdjustments).toEqual([]);

    const powerUpFixture = createFixture();
    const attack = powerUpFixture.powerUpPool.entities.find(
      (entity) => entity.kind === PowerUpKind.ATTACK,
    )!;
    powerUpFixture.weapon.addAmmo(1);
    powerUpFixture.weapon.fire(
      { x: attack.position.x, z: attack.position.z + 1.88 },
      Direction.NORTH,
    );

    powerUpFixture.session.update(0.1);

    expect(powerUpFixture.powerUpPool.getById(attack.id)).toBeNull();
    expect(powerUpFixture.session.powerUpEntities).toHaveLength(5);
    expect(powerUpFixture.session.status.latestBulletImpact).toBe("POWER_UP");
    expect(powerUpFixture.session.status.latestPowerUp).toBeNull();
    expect(powerUpFixture.session.status.ammo).toBe(0);
  });
});
