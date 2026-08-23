import { Arena } from "./Arena";
import { directionVector, type Direction } from "./Direction";
import type { PowerUpEntity } from "./PowerUpPool";
import type { TokenEntity } from "./TokenPool";
import type { XZPoint } from "./Trail";

export interface WeaponObstacle {
  readonly id: string;
  readonly position: XZPoint;
  readonly radius: number;
}

export type WeaponObstacleProvider = () => readonly WeaponObstacle[];

export interface WeaponConfig {
  readonly bulletRadius: number;
  readonly bulletSpeed: number;
  readonly muzzleOffset: number;
  readonly bulletLifetimeSeconds: number;
}

export interface BulletEntity {
  readonly id: string;
  readonly position: XZPoint;
  readonly direction: Direction;
  readonly radius: number;
}

interface ActiveBullet {
  readonly id: string;
  readonly direction: Direction;
  readonly radius: number;
  position: XZPoint;
  remainingLifetimeSeconds: number;
}

export const BulletImpactKind = Object.freeze({
  SOLID_WALL: "SOLID_WALL",
  SOLID_OBSTACLE: "SOLID_OBSTACLE",
  TOKEN: "TOKEN",
  POWER_UP: "POWER_UP",
  EXPIRED: "EXPIRED",
} as const);

export type BulletImpactKind =
  (typeof BulletImpactKind)[keyof typeof BulletImpactKind];

export interface BulletImpact {
  readonly bulletId: string;
  readonly kind: BulletImpactKind;
  readonly targetId: string | null;
}

export class WeaponSystem {
  readonly #arena: Arena;
  readonly #config: WeaponConfig;
  readonly #obstacles: WeaponObstacleProvider;
  readonly #bullets = new Map<string, ActiveBullet>();
  #ammo = 0;
  #nextBulletId = 1;

  constructor(
    arena: Arena,
    config: WeaponConfig,
    obstacles: WeaponObstacleProvider = () => [],
  ) {
    if (
      config.bulletRadius <= 0 ||
      config.bulletSpeed <= 0 ||
      config.muzzleOffset < config.bulletRadius ||
      config.bulletLifetimeSeconds <= 0
    ) {
      throw new Error("Invalid weapon configuration.");
    }
    this.#arena = arena;
    this.#config = Object.freeze({ ...config });
    this.#obstacles = obstacles;
  }

  get ammo(): number {
    return this.#ammo;
  }

  get bullets(): readonly BulletEntity[] {
    return Object.freeze(
      [...this.#bullets.values()].map((bullet) =>
        Object.freeze({
          id: bullet.id,
          position: Object.freeze({ ...bullet.position }),
          direction: bullet.direction,
          radius: bullet.radius,
        }),
      ),
    );
  }

  get bulletCount(): number {
    return this.#bullets.size;
  }

  addAmmo(amount: number): number {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Ammo reward must be a positive integer.");
    }
    this.#ammo += amount;
    return this.#ammo;
  }

  clearBullets(): void {
    this.#bullets.clear();
  }

  fire(origin: XZPoint, direction: Direction): BulletEntity | null {
    if (this.#ammo <= 0) return null;
    const forward = directionVector(direction);
    const position = {
      x: origin.x + forward.x * this.#config.muzzleOffset,
      z: origin.z + forward.z * this.#config.muzzleOffset,
    };
    const bullet: ActiveBullet = {
      id: `bullet-${this.#nextBulletId}`,
      position,
      direction,
      radius: this.#config.bulletRadius,
      remainingLifetimeSeconds: this.#config.bulletLifetimeSeconds,
    };
    this.#nextBulletId += 1;
    this.#ammo -= 1;
    this.#bullets.set(bullet.id, bullet);
    return Object.freeze({
      id: bullet.id,
      position: Object.freeze({ ...position }),
      direction,
      radius: bullet.radius,
    });
  }

  update(
    deltaSeconds: number,
    tokens: readonly TokenEntity[],
    powerUps: readonly PowerUpEntity[],
  ): readonly BulletImpact[] {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Weapon deltaSeconds must be finite and non-negative.");
    }
    const impacts: BulletImpact[] = [];
    for (const bullet of [...this.#bullets.values()]) {
      bullet.remainingLifetimeSeconds -= deltaSeconds;
      if (bullet.remainingLifetimeSeconds <= 0) {
        this.#bullets.delete(bullet.id);
        impacts.push(this.#impact(bullet.id, BulletImpactKind.EXPIRED));
        continue;
      }

      const forward = directionVector(bullet.direction);
      const candidate = {
        x: bullet.position.x + forward.x * this.#config.bulletSpeed * deltaSeconds,
        z: bullet.position.z + forward.z * this.#config.bulletSpeed * deltaSeconds,
      };
      if (this.#arena.hitsSolidBoundary(candidate, bullet.radius)) {
        this.#bullets.delete(bullet.id);
        impacts.push(this.#impact(bullet.id, BulletImpactKind.SOLID_WALL));
        continue;
      }
      bullet.position = this.#arena.toDisplayPoint(candidate);

      const obstacle = this.#detectTarget(bullet, this.#obstacles());
      if (obstacle) {
        this.#bullets.delete(bullet.id);
        impacts.push(this.#impact(bullet.id, BulletImpactKind.SOLID_OBSTACLE));
        continue;
      }

      const token = this.#detectTarget(bullet, tokens);
      if (token) {
        this.#bullets.delete(bullet.id);
        impacts.push(this.#impact(bullet.id, BulletImpactKind.TOKEN, token.id));
        continue;
      }
      const powerUp = this.#detectTarget(bullet, powerUps);
      if (powerUp) {
        this.#bullets.delete(bullet.id);
        impacts.push(this.#impact(bullet.id, BulletImpactKind.POWER_UP, powerUp.id));
      }
    }
    return Object.freeze(impacts);
  }

  #detectTarget<T extends { readonly id: string; readonly position: XZPoint; readonly radius: number }>(
    bullet: ActiveBullet,
    targets: readonly T[],
  ): T | null {
    for (const target of targets) {
      const collisionDistance = bullet.radius + target.radius;
      if (
        this.#arena.distanceSquared(bullet.position, target.position) <=
        collisionDistance * collisionDistance
      ) {
        return target;
      }
    }
    return null;
  }

  #impact(
    bulletId: string,
    kind: BulletImpactKind,
    targetId: string | null = null,
  ): BulletImpact {
    return Object.freeze({ bulletId, kind, targetId });
  }
}
