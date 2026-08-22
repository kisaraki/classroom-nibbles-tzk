import { CHARACTER_TOKENS, type CharacterToken } from "../vocabulary/types";
import { SpawnManager, type SpawnOccupant } from "./SpawnManager";
import type { Snake } from "./Snake";
import type { XZPoint } from "./Trail";

export interface TokenEntity {
  readonly id: string;
  readonly token: CharacterToken;
  readonly position: XZPoint;
  readonly radius: number;
}

export class TokenPool {
  readonly #spawnManager: SpawnManager;
  readonly #tokenRadius: number;
  readonly #entities = new Map<string, TokenEntity>();
  #nextId = 1;

  constructor(spawnManager: SpawnManager, tokenRadius: number) {
    if (tokenRadius <= 0) throw new Error("Token radius must be positive.");
    this.#spawnManager = spawnManager;
    this.#tokenRadius = tokenRadius;
  }

  get entities(): readonly TokenEntity[] {
    return Object.freeze([...this.#entities.values()]);
  }

  normalize(snake: Snake): void {
    for (const token of CHARACTER_TOKENS) this.ensureToken(token, snake);
  }

  ensureToken(token: CharacterToken, snake: Snake): TokenEntity {
    const existing = this.entities.find((entity) => entity.token === token);
    return existing ?? this.spawn(token, snake);
  }

  spawn(token: CharacterToken, snake: Snake): TokenEntity {
    const occupied: SpawnOccupant[] = this.entities.map((entity) => ({
      position: entity.position,
      radius: entity.radius,
    }));
    const position = this.#spawnManager.findPosition({
      radius: this.#tokenRadius,
      snakeHead: snake.headPosition,
      snakeSegments: snake.getSegmentPositions(),
      occupied,
    });
    const entity = Object.freeze({
      id: `token-${this.#nextId}-${token.toLowerCase()}`,
      token,
      position,
      radius: this.#tokenRadius,
    });
    this.#nextId += 1;
    this.#entities.set(entity.id, entity);
    return entity;
  }

  getById(id: string): TokenEntity | null {
    return this.#entities.get(id) ?? null;
  }

  remove(id: string): TokenEntity | null {
    const entity = this.#entities.get(id) ?? null;
    if (entity) this.#entities.delete(id);
    return entity;
  }
}

export function tokenDisplayLabel(token: CharacterToken): string {
  if (token === "SPACE") return "␠";
  if (token === "PERIOD") return ".";
  if (token === "APOSTROPHE") return "'";
  if (token === "HYPHEN") return "-";
  return token;
}
