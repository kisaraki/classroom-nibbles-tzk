import * as THREE from "three";
import { APP_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import type { EnvironmentProfile } from "../gameplay/Environment";
import type { PowerUpEntity } from "../gameplay/PowerUpPool";
import { Snake } from "../gameplay/Snake";
import type { TokenEntity } from "../gameplay/TokenPool";
import type { BulletEntity } from "../gameplay/WeaponSystem";
import type { CharacterToken } from "../vocabulary/types";
import { ArenaView } from "./ArenaView";
import { BulletView } from "./BulletView";
import { PinballCameraRig } from "./PinballCameraRig";
import { EnvironmentView } from "./EnvironmentView";
import { PowerUpView } from "./PowerUpView";
import { SnakeView } from "./SnakeView";
import { TokenView } from "./TokenView";
import { detectDevicePixelRatio } from "./DeviceResolution";

export type AnimationFrameHandler = () => void;

export class PhaseThreeScene {
  readonly #container: HTMLElement;
  readonly #renderer: THREE.WebGLRenderer;
  readonly #scene = new THREE.Scene();
  readonly #camera: THREE.PerspectiveCamera;
  readonly #cameraRig: PinballCameraRig;
  readonly #arenaView: ArenaView;
  readonly #environmentView: EnvironmentView;
  readonly #hemisphereLight: THREE.HemisphereLight;
  readonly #keyLight: THREE.DirectionalLight;
  readonly #snakeView: SnakeView;
  readonly #tokenView: TokenView;
  readonly #powerUpView: PowerUpView;
  readonly #bulletView: BulletView;
  #activePixelRatio = 0;

  constructor(
    container: HTMLElement,
    arena: Arena,
    environment: EnvironmentProfile,
  ) {
    this.#container = container;
    this.#renderer = new THREE.WebGLRenderer({
      antialias: APP_CONFIG.scene.antialias,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.#renderer.setPixelRatio(detectDevicePixelRatio());
    this.#renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.#renderer.domElement.className = "phase-three-scene";
    this.#renderer.domElement.dataset.testid = "phase-three-canvas";
    this.#renderer.domElement.dataset.cameraMode = "pinball-player";
    this.#renderer.domElement.dataset.cameraCount = "1";
    this.#renderer.domElement.dataset.backflipState = "idle";
    this.#renderer.domElement.dataset.backflipScope = "mecha";
    this.#renderer.domElement.dataset.resolutionMode = "device-native";
    this.#renderer.domElement.setAttribute("aria-label", "NIBBLES 第九階段第一人稱彈珠台字彙遊戲場");
    container.prepend(this.#renderer.domElement);

    this.#scene.background = new THREE.Color(environment.palette.backgroundColor);
    this.#scene.fog = new THREE.Fog(
      environment.palette.backgroundColor,
      environment.palette.fogNear,
      environment.palette.fogFar,
    );
    this.#camera = new THREE.PerspectiveCamera(
      APP_CONFIG.scene.cameraFieldOfView,
      1,
      APP_CONFIG.scene.cameraNear,
      APP_CONFIG.scene.cameraFar,
    );
    this.#cameraRig = new PinballCameraRig(this.#camera, {
      eyeHeight: APP_CONFIG.scene.cameraEyeHeight,
      playerDistance: APP_CONFIG.scene.cameraPlayerDistance,
      lookHeight: APP_CONFIG.scene.cameraLookHeight,
      lookDepthRatio: APP_CONFIG.scene.cameraLookDepthRatio,
    });

    this.#hemisphereLight = new THREE.HemisphereLight(
      environment.palette.hemisphereSkyColor,
      environment.palette.hemisphereGroundColor,
      2.5,
    );
    this.#keyLight = new THREE.DirectionalLight(environment.palette.keyLightColor, 3.5);
    this.#keyLight.position.set(5, 12, 7);
    this.#scene.add(this.#hemisphereLight, this.#keyLight);

    this.#arenaView = new ArenaView(this.#scene, arena, environment);
    this.#environmentView = new EnvironmentView(this.#scene);
    this.#snakeView = new SnakeView(this.#scene);
    this.#tokenView = new TokenView(this.#scene);
    this.#powerUpView = new PowerUpView(this.#scene);
    this.#bulletView = new BulletView(this.#scene);
    window.addEventListener("resize", this.#resize);
    this.#resize();
    this.setEnvironment(environment);
  }

  setEnvironment(environment: EnvironmentProfile): void {
    const { palette } = environment;
    if (this.#scene.background instanceof THREE.Color) {
      this.#scene.background.setHex(palette.backgroundColor);
    }
    this.#scene.fog = new THREE.Fog(
      palette.backgroundColor,
      palette.fogNear,
      palette.fogFar,
    );
    this.#hemisphereLight.color.setHex(palette.hemisphereSkyColor);
    this.#hemisphereLight.groundColor.setHex(palette.hemisphereGroundColor);
    this.#keyLight.color.setHex(palette.keyLightColor);
    this.#arenaView.setEnvironment(environment);
    this.#environmentView.setEnvironment(environment);
    this.#renderer.domElement.dataset.environmentKind = environment.kind
      .toLowerCase()
      .replaceAll("_", "-");
    this.#renderer.domElement.dataset.environmentName = environment.sceneName;
    this.#renderer.domElement.dataset.obstacleCount = String(environment.obstacles.length);
    this.#renderer.domElement.setAttribute(
      "aria-label",
      `NIBBLES 第九階段第一人稱彈珠台字彙遊戲場：${environment.sceneName}，${environment.featureLabel}`,
    );
  }

  setAnimationLoop(handler: AnimationFrameHandler | null): void {
    this.#renderer.setAnimationLoop(handler);
  }

  triggerBackflip(): boolean {
    return this.#snakeView.triggerBackflip();
  }

  get backflipActive(): boolean {
    return this.#snakeView.backflipActive;
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
    if (detectDevicePixelRatio() !== this.#activePixelRatio) this.#resize();
    this.#setRendererData("tokenCount", String(tokens.length));
    this.#setRendererData("powerUpCount", String(powerUps.length));
    this.#setRendererData("bulletCount", String(bullets.length));
    this.#cameraRig.update(arena);
    this.#snakeView.update(snake, arena, true, frameDeltaSeconds);
    this.#setRendererData(
      "backflipState",
      this.#snakeView.backflipActive ? "active" : "idle",
    );
    this.#setRendererData(
      "backflipProgress",
      this.#snakeView.backflipProgress.toFixed(3),
    );
    this.#tokenView.update(tokens, arena, this.#camera, nextToken, elapsedSeconds);
    this.#powerUpView.update(powerUps, arena, elapsedSeconds);
    this.#bulletView.update(bullets, arena);
    this.#renderer.render(this.#scene, this.#camera);
    this.#setRendererData("drawCallCount", String(this.#renderer.info.render.calls));
  }

  dispose(): void {
    window.removeEventListener("resize", this.#resize);
    this.#renderer.setAnimationLoop(null);
    this.#arenaView.dispose();
    this.#environmentView.dispose();
    this.#snakeView.dispose();
    this.#tokenView.dispose();
    this.#powerUpView.dispose();
    this.#bulletView.dispose();
    this.#renderer.dispose();
  }

  readonly #resize = (): void => {
    const width = Math.max(this.#container.clientWidth, 1);
    const height = Math.max(this.#container.clientHeight, 1);
    const renderPixelRatio = detectDevicePixelRatio();
    this.#activePixelRatio = renderPixelRatio;
    this.#renderer.setPixelRatio(renderPixelRatio);
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height, false);
    this.#setRendererData("renderPixelRatio", renderPixelRatio.toFixed(3));
    this.#setRendererData("renderWidth", String(this.#renderer.domElement.width));
    this.#setRendererData("renderHeight", String(this.#renderer.domElement.height));
  };

  #setRendererData(key: string, value: string): void {
    if (this.#renderer.domElement.dataset[key] !== value) {
      this.#renderer.domElement.dataset[key] = value;
    }
  }
}
