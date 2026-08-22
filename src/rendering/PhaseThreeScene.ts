import * as THREE from "three";
import { APP_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import type { PowerUpEntity } from "../gameplay/PowerUpPool";
import { Snake } from "../gameplay/Snake";
import type { TokenEntity } from "../gameplay/TokenPool";
import type { BulletEntity } from "../gameplay/WeaponSystem";
import type { CharacterToken } from "../vocabulary/types";
import { ArenaView } from "./ArenaView";
import { BulletView } from "./BulletView";
import { CockpitCameraRig } from "./CockpitCameraRig";
import { PowerUpView } from "./PowerUpView";
import { SnakeView } from "./SnakeView";
import { TokenView } from "./TokenView";

export type AnimationFrameHandler = () => void;

export class PhaseThreeScene {
  readonly #container: HTMLElement;
  readonly #renderer: THREE.WebGLRenderer;
  readonly #scene = new THREE.Scene();
  readonly #camera: THREE.PerspectiveCamera;
  readonly #cameraRig: CockpitCameraRig;
  readonly #arenaView: ArenaView;
  readonly #snakeView: SnakeView;
  readonly #tokenView: TokenView;
  readonly #powerUpView: PowerUpView;
  readonly #bulletView: BulletView;

  constructor(container: HTMLElement, arena: Arena) {
    this.#container = container;
    this.#renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.#renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, APP_CONFIG.scene.maxPixelRatio),
    );
    this.#renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.#renderer.domElement.className = "phase-three-scene";
    this.#renderer.domElement.dataset.testid = "phase-three-canvas";
    this.#renderer.domElement.dataset.cameraMode = "snake-eye";
    this.#renderer.domElement.dataset.cameraCount = "1";
    this.#renderer.domElement.setAttribute("aria-label", "NIBBLES 第六階段第一人稱字彙遊戲場");
    container.prepend(this.#renderer.domElement);

    this.#scene.background = new THREE.Color(APP_CONFIG.scene.backgroundColor);
    this.#scene.fog = new THREE.Fog(APP_CONFIG.scene.backgroundColor, 18, 32);
    this.#camera = new THREE.PerspectiveCamera(
      APP_CONFIG.scene.cameraFieldOfView,
      1,
      APP_CONFIG.scene.cameraNear,
      APP_CONFIG.scene.cameraFar,
    );
    this.#cameraRig = new CockpitCameraRig(this.#camera, {
      eyeHeight: APP_CONFIG.scene.cameraEyeHeight,
      followDistance: APP_CONFIG.scene.cameraFollowDistance,
      lookAhead: APP_CONFIG.scene.cameraLookAhead,
      lookHeight: APP_CONFIG.scene.cameraLookHeight,
      turnSmoothingSeconds: APP_CONFIG.scene.cameraTurnSmoothingSeconds,
    });

    this.#scene.add(new THREE.HemisphereLight(0xbcecff, 0x08101e, 2.5));
    const keyLight = new THREE.DirectionalLight(0x73ffe1, 3.5);
    keyLight.position.set(5, 12, 7);
    this.#scene.add(keyLight);

    this.#arenaView = new ArenaView(this.#scene, arena);
    this.#snakeView = new SnakeView(this.#scene);
    this.#tokenView = new TokenView(this.#scene);
    this.#powerUpView = new PowerUpView(this.#scene);
    this.#bulletView = new BulletView(this.#scene);
    window.addEventListener("resize", this.#resize);
    this.#resize();
  }

  setAnimationLoop(handler: AnimationFrameHandler | null): void {
    this.#renderer.setAnimationLoop(handler);
  }

  render(
    snake: Snake,
    arena: Arena,
    tokens: readonly TokenEntity[],
    powerUps: readonly PowerUpEntity[],
    bullets: readonly BulletEntity[],
    nextToken: CharacterToken | null,
    elapsedSeconds: number,
    frameDeltaSeconds: number,
  ): void {
    this.#renderer.domElement.dataset.tokenCount = String(tokens.length);
    this.#renderer.domElement.dataset.powerUpCount = String(powerUps.length);
    this.#renderer.domElement.dataset.bulletCount = String(bullets.length);
    this.#cameraRig.update(snake.headPosition, snake.direction, arena, frameDeltaSeconds);
    this.#snakeView.update(snake, arena, false);
    this.#tokenView.update(tokens, arena, nextToken, elapsedSeconds);
    this.#powerUpView.update(powerUps, arena, elapsedSeconds);
    this.#bulletView.update(bullets, arena);
    this.#renderer.render(this.#scene, this.#camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.#resize);
    this.#renderer.setAnimationLoop(null);
    this.#arenaView.dispose();
    this.#snakeView.dispose();
    this.#tokenView.dispose();
    this.#powerUpView.dispose();
    this.#bulletView.dispose();
    this.#renderer.dispose();
  }

  readonly #resize = (): void => {
    const width = Math.max(this.#container.clientWidth, 1);
    const height = Math.max(this.#container.clientHeight, 1);
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height, false);
  };
}
