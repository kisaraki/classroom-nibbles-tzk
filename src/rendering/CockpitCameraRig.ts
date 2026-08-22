import * as THREE from "three";
import type { Arena } from "../gameplay/Arena";
import { directionVector, type Direction } from "../gameplay/Direction";
import type { XZPoint } from "../gameplay/Trail";

export interface CockpitCameraConfig {
  readonly eyeHeight: number;
  readonly followDistance: number;
  readonly lookAhead: number;
  readonly lookHeight: number;
  readonly turnSmoothingSeconds: number;
}

function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export class CockpitCameraRig {
  readonly #camera: THREE.PerspectiveCamera;
  readonly #config: CockpitCameraConfig;
  #visualYaw = 0;
  #initialized = false;

  constructor(camera: THREE.PerspectiveCamera, config: CockpitCameraConfig) {
    if (
      config.eyeHeight <= 0 ||
      config.followDistance < 0 ||
      config.lookAhead <= 0 ||
      config.lookHeight < 0 ||
      config.turnSmoothingSeconds <= 0
    ) {
      throw new Error("Invalid cockpit camera configuration.");
    }
    this.#camera = camera;
    this.#config = Object.freeze({ ...config });
  }

  get visualYaw(): number {
    return this.#visualYaw;
  }

  update(
    headPosition: XZPoint,
    direction: Direction,
    arena: Arena,
    deltaSeconds: number,
  ): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Camera deltaSeconds must be finite and non-negative.");
    }
    const directionValue = directionVector(direction);
    const targetYaw = Math.atan2(directionValue.x, directionValue.z);
    if (!this.#initialized) {
      this.#visualYaw = targetYaw;
      this.#initialized = true;
    } else {
      const smoothing = 1 - Math.exp(-deltaSeconds / this.#config.turnSmoothingSeconds);
      this.#visualYaw += shortestAngleDelta(this.#visualYaw, targetYaw) * smoothing;
    }

    const head = arena.toDisplayPoint(headPosition);
    const forward = {
      x: Math.sin(this.#visualYaw),
      z: Math.cos(this.#visualYaw),
    };
    this.#camera.position.set(
      head.x - forward.x * this.#config.followDistance,
      this.#config.eyeHeight,
      head.z - forward.z * this.#config.followDistance,
    );
    this.#camera.lookAt(
      head.x + forward.x * this.#config.lookAhead,
      this.#config.lookHeight,
      head.z + forward.z * this.#config.lookAhead,
    );
  }
}
