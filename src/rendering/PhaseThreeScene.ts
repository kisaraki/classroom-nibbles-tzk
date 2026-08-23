import * as THREE from "three";
import { APP_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import type { EnvironmentProfile } from "../gameplay/Environment";
import type { PowerUpEntity } from "../gameplay/PowerUpPool";
import { Snake } from "../gameplay/Snake";
import {
  TableMotionMode,
  type TableMotionStatus,
} from "../gameplay/TableMotionSystem";
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
  readonly #tableGroup = new THREE.Group();
  readonly #camera: THREE.PerspectiveCamera;
  readonly #cameraRig: PinballCameraRig;
  readonly #arenaView: ArenaView;
  readonly #environmentView: EnvironmentView;
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
    this.#scene.matrixAutoUpdate = false;
    this.#tableGroup.matrixAutoUpdate = false;
    this.#renderer = new THREE.WebGLRenderer({
      antialias: APP_CONFIG.scene.antialias,
      alpha: false,
      precision: "mediump",
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
    this.#cameraRig.update(arena);
    this.#camera.updateMatrix();
    this.#camera.updateMatrixWorld(true);
    this.#camera.matrixAutoUpdate = false;

    this.#tableGroup.name = "pinball-table-world";
    this.#scene.add(this.#tableGroup);
    this.#arenaView = new ArenaView(this.#tableGroup, arena, environment);
    this.#environmentView = new EnvironmentView(this.#tableGroup);
    this.#snakeView = new SnakeView(this.#tableGroup);
    this.#tokenView = new TokenView(this.#tableGroup);
    this.#powerUpView = new PowerUpView(this.#tableGroup);
    this.#bulletView = new BulletView(this.#tableGroup);
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
    tableMotion: TableMotionStatus | null,
    elapsedSeconds: number,
    frameDeltaSeconds: number,
  ): void {
    if (detectDevicePixelRatio() !== this.#activePixelRatio) this.#resize();
    this.#setRendererData("tokenCount", String(tokens.length));
    this.#setRendererData("powerUpCount", String(powerUps.length));
    this.#setRendererData("bulletCount", String(bullets.length));
    if (
      tableMotion?.mode !== TableMotionMode.LEVEL ||
      this.#renderer.domElement.dataset.tokenPositionChecksum === undefined
    ) {
      this.#setRendererData("tokenPositionChecksum", this.#positionChecksum(tokens));
      this.#setRendererData("powerUpPositionChecksum", this.#positionChecksum(powerUps));
    }
    this.#updateTableMotion(tableMotion, elapsedSeconds, frameDeltaSeconds);
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
    this.#powerUpView.update(powerUps, arena, this.#camera, elapsedSeconds);
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
    this.#renderer.forceContextLoss();
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

  #updateTableMotion(
    status: TableMotionStatus | null,
    elapsedSeconds: number,
    deltaSeconds: number,
  ): void {
    const mode = status?.mode ?? TableMotionMode.LEVEL;
    if (
      mode === TableMotionMode.LEVEL &&
      this.#tableGroup.rotation.x === 0 &&
      this.#tableGroup.rotation.z === 0 &&
      this.#tableGroup.position.lengthSq() === 0
    ) {
      if (this.#container.dataset.tableMotion !== mode) {
        this.#container.dataset.tableMotion = mode;
      }
      this.#setRendererData("tableMotion", mode);
      this.#setRendererData("tableTiltRadians", "0.0000");
      return;
    }
    const shaking = mode === TableMotionMode.SHAKE;
    const shakeAngle = shaking ? status?.shakeAngleRadians ?? 0 : 0;
    const targetZ = (status?.tiltRadians ?? 0) +
      Math.sin(elapsedSeconds * 39) * shakeAngle;
    const targetX = shaking
      ? Math.sin(elapsedSeconds * 31 + 0.7) * shakeAngle * 0.55
      : 0;
    const visualActive = shaking || targetZ !== 0 ||
      Math.abs(this.#tableGroup.rotation.x) > 0.0001 ||
      Math.abs(this.#tableGroup.rotation.z) > 0.0001 ||
      this.#tableGroup.position.lengthSq() > 0.000001;
    if (visualActive) {
      const nextZ = THREE.MathUtils.damp(
        this.#tableGroup.rotation.z,
        targetZ,
        13,
        deltaSeconds,
      );
      const nextX = THREE.MathUtils.damp(
        this.#tableGroup.rotation.x,
        targetX,
        13,
        deltaSeconds,
      );
      this.#tableGroup.rotation.z = Math.abs(nextZ) < 0.0001 ? 0 : nextZ;
      this.#tableGroup.rotation.x = Math.abs(nextX) < 0.0001 ? 0 : nextX;
    }
    const shakeLift = shaking
      ? Math.abs(Math.sin(elapsedSeconds * 47)) * (status?.shakeLift ?? 0)
      : 0;
    const shakeX = shaking ? Math.sin(elapsedSeconds * 43) * 0.06 : 0;
    const shakeZ = shaking ? Math.cos(elapsedSeconds * 37) * 0.06 : 0;
    if (shaking) {
      this.#tableGroup.position.set(shakeX, shakeLift, shakeZ);
    } else if (this.#tableGroup.position.lengthSq() > 0) {
      this.#tableGroup.position.set(0, 0, 0);
    }
    if (visualActive) this.#tableGroup.updateMatrix();
    if (this.#container.dataset.tableMotion !== mode) {
      this.#container.dataset.tableMotion = mode;
    }
    this.#setRendererData("tableMotion", mode);
    this.#setRendererData(
      "tableTiltRadians",
      this.#tableGroup.rotation.z.toFixed(4),
    );
  }

  #positionChecksum(
    entities: readonly { readonly position: { readonly x: number; readonly z: number } }[],
  ): string {
    return entities.reduce(
      (sum, entity, index) =>
        sum + (index + 1) * (entity.position.x + entity.position.z * 0.5),
      0,
    ).toFixed(4);
  }
}
