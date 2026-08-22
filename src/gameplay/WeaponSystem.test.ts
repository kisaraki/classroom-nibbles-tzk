import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { Arena, BoundaryMode } from "./Arena";
import { Direction } from "./Direction";
import { PowerUpKind, type PowerUpEntity } from "./PowerUpPool";
import type { TokenEntity } from "./TokenPool";
import { BulletImpactKind, WeaponSystem } from "./WeaponSystem";

function createArena(): Arena {
  return new Arena({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: BoundaryMode.SOLID,
    zBoundaryMode: BoundaryMode.WRAP,
  });
}

describe("WeaponSystem", () => {
  it("requires ammo, consumes one round, and launches from the muzzle", () => {
    const weapon = new WeaponSystem(createArena(), GAMEPLAY_CONFIG.weapon);

    expect(weapon.fire({ x: 0, z: 0 }, Direction.NORTH)).toBeNull();
    weapon.addAmmo(5);
    const bullet = weapon.fire({ x: 0, z: 0 }, Direction.NORTH);

    expect(weapon.ammo).toBe(4);
    expect(bullet).toMatchObject({ direction: Direction.NORTH, radius: 0.12 });
    expect(bullet?.position).toEqual({ x: 0, z: -0.58 });
  });

  it("reports token and power-up impacts without applying their gameplay effects", () => {
    const tokenWeapon = new WeaponSystem(createArena(), GAMEPLAY_CONFIG.weapon);
    tokenWeapon.addAmmo(1);
    tokenWeapon.fire({ x: 0, z: 0 }, Direction.NORTH);
    const token = Object.freeze({
      id: "token-target",
      token: "A",
      position: Object.freeze({ x: 0, z: -1.88 }),
      radius: GAMEPLAY_CONFIG.token.collisionRadius,
    }) satisfies TokenEntity;

    expect(tokenWeapon.update(0.1, [token], [])).toEqual([
      { bulletId: "bullet-1", kind: BulletImpactKind.TOKEN, targetId: token.id },
    ]);
    expect(tokenWeapon.bullets).toHaveLength(0);

    const powerUpWeapon = new WeaponSystem(createArena(), GAMEPLAY_CONFIG.weapon);
    powerUpWeapon.addAmmo(1);
    powerUpWeapon.fire({ x: 0, z: 0 }, Direction.NORTH);
    const powerUp = Object.freeze({
      id: "power-up-target",
      kind: PowerUpKind.ATTACK,
      position: Object.freeze({ x: 0, z: -1.88 }),
      radius: GAMEPLAY_CONFIG.powerUp.collisionRadius,
    }) satisfies PowerUpEntity;

    expect(powerUpWeapon.update(0.1, [], [powerUp])).toEqual([
      {
        bulletId: "bullet-1",
        kind: BulletImpactKind.POWER_UP,
        targetId: powerUp.id,
      },
    ]);
    expect(powerUpWeapon.ammo).toBe(0);
  });

  it("removes bullets at solid walls while allowing wrap-axis travel", () => {
    const weapon = new WeaponSystem(createArena(), GAMEPLAY_CONFIG.weapon);
    weapon.addAmmo(2);
    weapon.fire({ x: 8.2, z: 0 }, Direction.EAST);

    expect(weapon.update(0.1, [], [])).toEqual([
      { bulletId: "bullet-1", kind: BulletImpactKind.SOLID_WALL, targetId: null },
    ]);

    weapon.fire({ x: 0, z: -8.2 }, Direction.NORTH);
    expect(weapon.update(0.1, [], [])).toEqual([]);
    expect(weapon.bullets[0]?.position.z).toBeCloseTo(7.92);
  });

  it("removes bullets on functional environment obstacles", () => {
    const obstacle = Object.freeze({
      id: "environment-obstacle",
      position: Object.freeze({ x: 0, z: -1.88 }),
      radius: 0.6,
    });
    const weapon = new WeaponSystem(
      createArena(),
      GAMEPLAY_CONFIG.weapon,
      () => [obstacle],
    );
    weapon.addAmmo(1);
    weapon.fire({ x: 0, z: 0 }, Direction.NORTH);

    expect(weapon.update(0.1, [], [])).toEqual([
      {
        bulletId: "bullet-1",
        kind: BulletImpactKind.SOLID_OBSTACLE,
        targetId: null,
      },
    ]);
    expect(weapon.bullets).toHaveLength(0);
  });

  it("expires otherwise unspent bullets after the configured lifetime", () => {
    const weapon = new WeaponSystem(createArena(), GAMEPLAY_CONFIG.weapon);
    weapon.addAmmo(1);
    weapon.fire({ x: 0, z: 0 }, Direction.NORTH);

    expect(weapon.update(GAMEPLAY_CONFIG.weapon.bulletLifetimeSeconds, [], [])).toEqual([
      { bulletId: "bullet-1", kind: BulletImpactKind.EXPIRED, targetId: null },
    ]);
    expect(weapon.bullets).toHaveLength(0);
  });

  it("clears in-flight rounds between environments without discarding ammo", () => {
    const weapon = new WeaponSystem(createArena(), GAMEPLAY_CONFIG.weapon);
    weapon.addAmmo(3);
    weapon.fire({ x: 0, z: 0 }, Direction.NORTH);

    weapon.clearBullets();

    expect(weapon.bullets).toHaveLength(0);
    expect(weapon.ammo).toBe(2);
  });
});
