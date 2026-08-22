export const Direction = Object.freeze({
  NORTH: "NORTH",
  SOUTH: "SOUTH",
  WEST: "WEST",
  EAST: "EAST",
} as const);

export type Direction = (typeof Direction)[keyof typeof Direction];

export interface XZVector {
  readonly x: number;
  readonly z: number;
}

const DIRECTION_VECTORS: Readonly<Record<Direction, XZVector>> = Object.freeze({
  [Direction.NORTH]: Object.freeze({ x: 0, z: -1 }),
  [Direction.SOUTH]: Object.freeze({ x: 0, z: 1 }),
  [Direction.WEST]: Object.freeze({ x: -1, z: 0 }),
  [Direction.EAST]: Object.freeze({ x: 1, z: 0 }),
});

const OPPOSITE_DIRECTIONS: Readonly<Record<Direction, Direction>> = Object.freeze({
  [Direction.NORTH]: Direction.SOUTH,
  [Direction.SOUTH]: Direction.NORTH,
  [Direction.WEST]: Direction.EAST,
  [Direction.EAST]: Direction.WEST,
});

export function directionVector(direction: Direction): XZVector {
  return DIRECTION_VECTORS[direction];
}

export function isOppositeDirection(current: Direction, requested: Direction): boolean {
  return OPPOSITE_DIRECTIONS[current] === requested;
}
