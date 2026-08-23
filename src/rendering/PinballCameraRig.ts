import * as THREE from "three";
import type { Arena } from "../gameplay/Arena";

export interface PinballCameraConfig {
  readonly eyeHeight: number;
  readonly playerDistance: number;
  readonly lookHeight: number;
  readonly lookDepthRatio: number;
  readonly backflipDurationSeconds: number;
}

function easeInOut(progress: number): number {
  return 0.5 - Math.cos(Math.PI * progress) / 2;
}

export class PinballCameraRig {
  readonly #camera: THREE.PerspectiveCamera;
  readonly #config: PinballCameraConfig;
  #backflipElapsedSeconds = 0;
  #backflipActive = false;

  constructor(camera: THREE.PerspectiveCamera, config: PinballCameraConfig) {
    if (
      config.eyeHeight <= 0 ||
      config.playerDistance <= 0 ||
      config.lookHeight < 0 ||
      !Number.isFinite(config.lookDepthRatio) ||
      Math.abs(config.lookDepthRatio) > 1 ||
      config.backflipDurationSeconds <= 0
    ) {
      throw new Error("Invalid pinball camera configuration.");
    }
    this.#camera = camera;
    this.#config = Object.freeze({ ...config });
  }

  get backflipActive(): boolean {
    return this.#backflipActive;
  }

  get backflipProgress(): number {
    if (!this.#backflipActive) return 0;
    return Math.min(
      this.#backflipElapsedSeconds / this.#config.backflipDurationSeconds,
      1,
    );
  }

  triggerBackflip(): boolean {
    if (this.#backflipActive) return false;
    this.#backflipElapsedSeconds = 0;
    this.#backflipActive = true;
    return true;
  }

  update(arena: Arena, deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Camera deltaSeconds must be finite and non-negative.");
    }
    this.#applyPlayerPose(arena);
    if (!this.#backflipActive) return;

    this.#backflipElapsedSeconds = Math.min(
      this.#backflipElapsedSeconds + deltaSeconds,
      this.#config.backflipDurationSeconds,
    );
    const angle = -Math.PI * 2 * easeInOut(this.backflipProgress);
    this.#camera.rotateX(angle);
    if (this.#backflipElapsedSeconds >= this.#config.backflipDurationSeconds) {
      this.#backflipActive = false;
      this.#backflipElapsedSeconds = 0;
      this.#applyPlayerPose(arena);
    }
  }

  #applyPlayerPose(arena: Arena): void {
    const { halfDepth } = arena.config;
    this.#camera.position.set(
      0,
      this.#config.eyeHeight,
      halfDepth + this.#config.playerDistance,
    );
    this.#camera.lookAt(
      0,
      this.#config.lookHeight,
      halfDepth * this.#config.lookDepthRatio,
    );
  }
}
