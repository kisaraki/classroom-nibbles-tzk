import { SpawnManager, type SpawnOccupant } from "./SpawnManager";
import type { Snake } from "./Snake";
import type { XZPoint } from "./Trail";

export const PowerUpKind = Object.freeze({
  TIME_PLUS_10: "TIME_PLUS_10",
  TIME_PLUS_5: "TIME_PLUS_5",
  TIME_MINUS_10: "TIME_MINUS_10",
  TIME_MINUS_5: "TIME_MINUS_5",
  ATTACK: "ATTACK",
} as const);

export type PowerUpKind = (typeof PowerUpKind)[keyof typeof PowerUpKind];

export const POWER_UP_KINDS: readonly PowerUpKind[] = Object.freeze([
  PowerUpKind.TIME_PLUS_10,
  PowerUpKind.TIME_PLUS_5,
  PowerUpKind.TIME_MINUS_10,
  PowerUpKind.TIME_MINUS_5,
  PowerUpKind.ATTACK,
]);

export interface PowerUpEntity {
  readonly id: string;
  readonly kind: PowerUpKind;
  readonly position: XZPoint;
  readonly radius: number;
}

export type PowerUpOccupantsProvider = () => readonly SpawnOccupant[];

export function powerUpTimeDelta(kind: PowerUpKind): number {
  if (kind === PowerUpKind.TIME_PLUS_10) return 10;
  if (kind === PowerUpKind.TIME_PLUS_5) return 5;
  if (kind === PowerUpKind.TIME_MINUS_10) return -10;
  if (kind === PowerUpKind.TIME_MINUS_5) return -5;
  return 0;
}

export function powerUpDisplayLabel(kind: PowerUpKind): string {
  if (kind === PowerUpKind.TIME_PLUS_10) return "+10";
  if (kind === PowerUpKind.TIME_PLUS_5) return "+5";
  if (kind === PowerUpKind.TIME_MINUS_10) return "−10";
  if (kind === PowerUpKind.TIME_MINUS_5) return "−5";
  return "彈藥";
}

export class PowerUpPool {
  readonly #spawnManager: SpawnManager;
  readonly #radius: number;
  readonly #additionalOccupants: PowerUpOccupantsProvider;
  readonly #entities = new Map<string, PowerUpEntity>();
  #nextId = 1;

  constructor(
    spawnManager: SpawnManager,
    radius: number,
    additionalOccupants: PowerUpOccupantsProvider = () => [],
  ) {
    if (radius <= 0) throw new Error("Power-up radius must be positive.");
    this.#spawnManager = spawnManager;
    this.#radius = radius;
    this.#additionalOccupants = additionalOccupants;
  }

  get entities(): readonly PowerUpEntity[] {
    return Object.freeze([...this.#entities.values()]);
  }

  get spawnOccupants(): readonly SpawnOccupant[] {
    return Object.freeze(
      this.entities.map((entity) =>
        Object.freeze({ position: entity.position, radius: entity.radius }),
      ),
    );
  }

  normalize(snake: Snake): void {
    for (const kind of POWER_UP_KINDS) this.ensurePowerUp(kind, snake);
  }

  reset(snake: Snake): void {
    this.#entities.clear();
    this.normalize(snake);
  }

  ensurePowerUp(kind: PowerUpKind, snake: Snake): PowerUpEntity {
    const existing = this.entities.find((entity) => entity.kind === kind);
    return existing ?? this.#spawn(kind, snake);
  }

  getById(id: string): PowerUpEntity | null {
    return this.#entities.get(id) ?? null;
  }

  reposition(id: string, snake: Snake): PowerUpEntity | null {
    const entity = this.#entities.get(id);
    if (!entity) return null;
    this.#entities.delete(id);
    return this.#spawn(entity.kind, snake);
  }

  #spawn(kind: PowerUpKind, snake: Snake): PowerUpEntity {
    const occupied: SpawnOccupant[] = [
      ...this.entities.map((entity) => ({
        position: entity.position,
        radius: entity.radius,
      })),
      ...this.#additionalOccupants(),
    ];
    const position = this.#spawnManager.findPosition({
      radius: this.#radius,
      snakeHead: snake.headPosition,
      snakeSegments: snake.getSegmentPositions(),
      occupied,
    });
    const entity = Object.freeze({
      id: `power-up-${this.#nextId}-${kind.toLowerCase()}`,
      kind,
      position,
      radius: this.#radius,
    });
    this.#nextId += 1;
    this.#entities.set(entity.id, entity);
    return entity;
  }
}
