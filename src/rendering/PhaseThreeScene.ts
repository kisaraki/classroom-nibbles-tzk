import * as THREE from "three";
import { APP_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import { Snake } from "../gameplay/Snake";
import type { TokenEntity } from "../gameplay/TokenPool";
import type { CharacterToken } from "../vocabulary/types";
import { ArenaView } from "./ArenaView";
import { SnakeView } from "./SnakeView";
import { TokenView } from "./TokenView";

export type AnimationFrameHandler = () => void;

export class PhaseThreeScene {
  readonly #container: HTMLElement;
  readonly #renderer: THREE.WebGLRenderer;
  readonly #scene = new THREE.Scene();
  readonly #camera: THREE.PerspectiveCamera;
  readonly #arenaView: ArenaView;
  readonly #snakeView: SnakeView;
  readonly #tokenView: TokenView;

  constructor(container: HTMLElement, arena: Arena) {
    this.#container = container;
    this.#renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.#renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, APP_CONFIG.scene.maxPixelRatio),
    );
    this.#renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.#renderer.domElement.className = "phase-three-scene";
    this.#renderer.domElement.dataset.testid = "phase-three-canvas";
    this.#renderer.domElement.setAttribute("aria-label", "NIBBLES 第三階段字彙遊戲場");
    container.prepend(this.#renderer.domElement);

    this.#scene.background = new THREE.Color(APP_CONFIG.scene.backgroundColor);
    this.#scene.fog = new THREE.Fog(APP_CONFIG.scene.backgroundColor, 18, 32);
    this.#camera = new THREE.PerspectiveCamera(
      APP_CONFIG.scene.cameraFieldOfView,
      1,
      APP_CONFIG.scene.cameraNear,
      APP_CONFIG.scene.cameraFar,
    );
    const cameraPosition = APP_CONFIG.scene.cameraPosition;
    this.#camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    this.#camera.lookAt(0, 0, 0);

    this.#scene.add(new THREE.HemisphereLight(0xbcecff, 0x08101e, 2.5));
    const keyLight = new THREE.DirectionalLight(0x73ffe1, 3.5);
    keyLight.position.set(5, 12, 7);
    this.#scene.add(keyLight);

    this.#arenaView = new ArenaView(this.#scene, arena);
    this.#snakeView = new SnakeView(this.#scene);
    this.#tokenView = new TokenView(this.#scene);
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
    nextToken: CharacterToken | null,
    elapsedSeconds: number,
  ): void {
    this.#renderer.domElement.dataset.tokenCount = String(tokens.length);
    this.#snakeView.update(snake, arena);
    this.#tokenView.update(tokens, arena, nextToken, elapsedSeconds);
    this.#renderer.render(this.#scene, this.#camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.#resize);
    this.#renderer.setAnimationLoop(null);
    this.#arenaView.dispose();
    this.#snakeView.dispose();
    this.#tokenView.dispose();
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
