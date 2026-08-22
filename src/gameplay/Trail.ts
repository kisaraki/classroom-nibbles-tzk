import { directionVector, type Direction, type XZVector } from "./Direction";

export interface XZPoint {
  readonly x: number;
  readonly z: number;
}

const POSITION_EPSILON = 1e-9;
const COLLINEAR_EPSILON = 1e-8;

function copyPoint(point: XZPoint): XZPoint {
  return { x: point.x, z: point.z };
}

function distance(first: XZPoint, second: XZPoint): number {
  return Math.hypot(second.x - first.x, second.z - first.z);
}

function interpolate(first: XZPoint, second: XZPoint, ratio: number): XZPoint {
  return {
    x: first.x + (second.x - first.x) * ratio,
    z: first.z + (second.z - first.z) * ratio,
  };
}

function pointsContinueStraight(
  newest: XZPoint,
  current: XZPoint,
  previous: XZPoint,
): boolean {
  const first: XZVector = { x: current.x - newest.x, z: current.z - newest.z };
  const second: XZVector = { x: previous.x - current.x, z: previous.z - current.z };
  const cross = first.x * second.z - first.z * second.x;
  const dot = first.x * second.x + first.z * second.z;
  return Math.abs(cross) <= COLLINEAR_EPSILON && dot > 0;
}

export class Trail {
  readonly #maximumDistance: number;
  readonly #points: XZPoint[];

  constructor(origin: XZPoint, initialDirection: Direction, maximumDistance: number) {
    if (maximumDistance <= 0) throw new Error("Trail maximumDistance must be positive.");
    this.#maximumDistance = maximumDistance;
    this.#points = [];
    this.reset(origin, initialDirection);
  }

  reset(origin: XZPoint, initialDirection: Direction): void {
    const forward = directionVector(initialDirection);
    this.#points.splice(0, this.#points.length,
      copyPoint(origin),
      {
        x: origin.x - forward.x * this.#maximumDistance,
        z: origin.z - forward.z * this.#maximumDistance,
      },
    );
  }

  record(position: XZPoint): void {
    const current = this.#points[0];
    if (!current || distance(position, current) <= POSITION_EPSILON) return;

    const previous = this.#points[1];
    if (previous && pointsContinueStraight(position, current, previous)) {
      this.#points[0] = copyPoint(position);
    } else {
      this.#points.unshift(copyPoint(position));
    }
    this.#trim();
  }

  sample(distanceBehindHead: number): XZPoint {
    if (!Number.isFinite(distanceBehindHead) || distanceBehindHead < 0) {
      throw new Error("Trail sample distance must be a finite non-negative number.");
    }

    let remaining = Math.min(distanceBehindHead, this.#maximumDistance);
    for (let index = 0; index < this.#points.length - 1; index += 1) {
      const current = this.#points[index];
      const previous = this.#points[index + 1];
      if (!current || !previous) break;
      const segmentLength = distance(current, previous);
      if (remaining <= segmentLength) {
        return interpolate(current, previous, segmentLength === 0 ? 0 : remaining / segmentLength);
      }
      remaining -= segmentLength;
    }

    return copyPoint(this.#points[this.#points.length - 1] ?? this.#points[0]!);
  }

  #trim(): void {
    let traversed = 0;
    for (let index = 0; index < this.#points.length - 1; index += 1) {
      const current = this.#points[index];
      const previous = this.#points[index + 1];
      if (!current || !previous) break;
      const segmentLength = distance(current, previous);
      if (traversed + segmentLength >= this.#maximumDistance) {
        const remaining = this.#maximumDistance - traversed;
        const endpoint = interpolate(
          current,
          previous,
          segmentLength === 0 ? 0 : remaining / segmentLength,
        );
        this.#points.splice(index + 1, this.#points.length, endpoint);
        return;
      }
      traversed += segmentLength;
    }
  }
}
