import { GameState, type GameState as GameStateValue } from "../core/GameState";
import type { StateMachine } from "../core/StateMachine";
import type { Arena } from "./Arena";
import {
  PowerUpKind,
  type PowerUpEntity,
  type PowerUpKind as PowerUpKindValue,
  PowerUpPool,
  powerUpTimeDelta,
} from "./PowerUpPool";
import type { Snake } from "./Snake";
import { TokenPool } from "./TokenPool";
import {
  BulletImpactKind,
  type BulletEntity,
  type BulletImpactKind as BulletImpactKindValue,
  WeaponSystem,
} from "./WeaponSystem";

const ACTIVE_WORLD_STATES = new Set<GameStateValue>([
  GameState.HUNTING,
  GameState.STUNNED,
  GameState.RECOVERY,
  GameState.MAP_EXPANDED,
]);

const INTERACTION_STATES = new Set<GameStateValue>([
  GameState.HUNTING,
  GameState.MAP_EXPANDED,
]);

export interface PowerUpCollectionResult {
  readonly kind: PowerUpKindValue;
  readonly timeDeltaSeconds: number;
  readonly ammoDelta: number;
}

export interface PowerUpWeaponStatus {
  readonly ammo: number;
  readonly bulletCount: number;
  readonly latestPowerUp: PowerUpKindValue | null;
  readonly latestBulletImpact: BulletImpactKindValue | null;
}

export type PowerUpCollectionListener = (result: PowerUpCollectionResult) => void;
export type BulletImpactListener = (kind: BulletImpactKindValue) => void;

export class PowerUpWeaponSession {
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #snake: Snake;
  readonly #arena: Arena;
  readonly #tokenPool: TokenPool;
  readonly #powerUpPool: PowerUpPool;
  readonly #weapon: WeaponSystem;
  readonly #headRadius: number;
  readonly #attackAmmoReward: number;
  readonly #adjustMainTime: (deltaSeconds: number) => void;
  readonly #powerUpCollectionListeners = new Set<PowerUpCollectionListener>();
  readonly #bulletImpactListeners = new Set<BulletImpactListener>();
  #latestPowerUp: PowerUpKindValue | null = null;
  #latestBulletImpact: BulletImpactKindValue | null = null;

  constructor(
    stateMachine: StateMachine<GameStateValue>,
    snake: Snake,
    arena: Arena,
    tokenPool: TokenPool,
    powerUpPool: PowerUpPool,
    weapon: WeaponSystem,
    headRadius: number,
    attackAmmoReward: number,
    adjustMainTime: (deltaSeconds: number) => void,
  ) {
    if (headRadius <= 0 || !Number.isInteger(attackAmmoReward) || attackAmmoReward <= 0) {
      throw new Error("Invalid power-up and weapon session configuration.");
    }
    this.#stateMachine = stateMachine;
    this.#snake = snake;
    this.#arena = arena;
    this.#tokenPool = tokenPool;
    this.#powerUpPool = powerUpPool;
    this.#weapon = weapon;
    this.#headRadius = headRadius;
    this.#attackAmmoReward = attackAmmoReward;
    this.#adjustMainTime = adjustMainTime;
    this.#powerUpPool.normalize(this.#snake);
  }

  get powerUpEntities(): readonly PowerUpEntity[] {
    return this.#powerUpPool.entities;
  }

  get bulletEntities(): readonly BulletEntity[] {
    return this.#weapon.bullets;
  }

  get status(): PowerUpWeaponStatus {
    return Object.freeze({
      ammo: this.#weapon.ammo,
      bulletCount: this.#weapon.bulletCount,
      latestPowerUp: this.#latestPowerUp,
      latestBulletImpact: this.#latestBulletImpact,
    });
  }

  fire(): boolean {
    if (!INTERACTION_STATES.has(this.#stateMachine.state)) return false;
    return this.#weapon.fire(this.#snake.headPosition, this.#snake.direction) !== null;
  }

  resetEnvironment(): void {
    this.#weapon.clearBullets();
    this.#powerUpPool.reset(this.#snake);
    this.#latestPowerUp = null;
    this.#latestBulletImpact = null;
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Power-up and weapon deltaSeconds must be finite and non-negative.");
    }
    if (!ACTIVE_WORLD_STATES.has(this.#stateMachine.state)) return;

    const impacts = this.#weapon.update(
      deltaSeconds,
      this.#tokenPool.entities,
      this.#powerUpPool.entities,
    );
    for (const impact of impacts) {
      if (impact.kind !== BulletImpactKind.EXPIRED) {
        this.#latestBulletImpact = impact.kind;
        for (const listener of this.#bulletImpactListeners) listener(impact.kind);
      }
      if (impact.kind === BulletImpactKind.TOKEN && impact.targetId) {
        this.#tokenPool.reposition(impact.targetId, this.#snake);
      } else if (impact.kind === BulletImpactKind.POWER_UP && impact.targetId) {
        this.#powerUpPool.reposition(impact.targetId, this.#snake);
      }
    }

    if (!INTERACTION_STATES.has(this.#stateMachine.state)) return;
    const collision = this.#detectPowerUpCollision();
    if (collision) this.resolvePowerUpCollision(collision.id);
  }

  resolvePowerUpCollision(entityId: string): PowerUpCollectionResult | null {
    if (!INTERACTION_STATES.has(this.#stateMachine.state)) return null;
    const entity = this.#powerUpPool.getById(entityId);
    if (!entity) return null;

    const timeDeltaSeconds = powerUpTimeDelta(entity.kind);
    const ammoDelta = entity.kind === PowerUpKind.ATTACK ? this.#attackAmmoReward : 0;
    this.#powerUpPool.reposition(entity.id, this.#snake);
    if (timeDeltaSeconds !== 0) this.#adjustMainTime(timeDeltaSeconds);
    if (ammoDelta !== 0) this.#weapon.addAmmo(ammoDelta);
    this.#latestPowerUp = entity.kind;
    const result = Object.freeze({ kind: entity.kind, timeDeltaSeconds, ammoDelta });
    for (const listener of this.#powerUpCollectionListeners) listener(result);
    return result;
  }

  subscribeToPowerUpCollections(listener: PowerUpCollectionListener): () => void {
    this.#powerUpCollectionListeners.add(listener);
    return () => this.#powerUpCollectionListeners.delete(listener);
  }

  subscribeToBulletImpacts(listener: BulletImpactListener): () => void {
    this.#bulletImpactListeners.add(listener);
    return () => this.#bulletImpactListeners.delete(listener);
  }

  #detectPowerUpCollision(): PowerUpEntity | null {
    for (const entity of this.#powerUpPool.entities) {
      const collisionDistance = this.#headRadius + entity.radius;
      if (
        this.#arena.distanceSquared(this.#snake.headPosition, entity.position) <=
        collisionDistance * collisionDistance
      ) {
        return entity;
      }
    }
    return null;
  }
}
