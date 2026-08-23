import * as THREE from "three";
import type { Arena } from "../gameplay/Arena";

export interface PinballCameraConfig {
  readonly eyeHeight: number;
  readonly playerDistance: number;
  readonly lookHeight: number;
  readonly lookDepthRatio: number;
}

export class PinballCameraRig {
  readonly #camera: THREE.PerspectiveCamera;
  readonly #config: PinballCameraConfig;

  constructor(camera: THREE.PerspectiveCamera, config: PinballCameraConfig) {
    if (
      config.eyeHeight <= 0 ||
      config.playerDistance <= 0 ||
      config.lookHeight < 0 ||
      !Number.isFinite(config.lookDepthRatio) ||
      Math.abs(config.lookDepthRatio) > 1
    ) {
      throw new Error("Invalid pinball camera configuration.");
    }
    this.#camera = camera;
    this.#config = Object.freeze({ ...config });
  }

  update(arena: Arena): void {
    this.#applyPlayerPose(arena);
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
