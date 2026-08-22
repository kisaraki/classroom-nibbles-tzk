import * as THREE from "three";
import { APP_CONFIG, getVocabularyUrl } from "./Config";
import { createPhaseOneStateMachine, GameState } from "./GameState";
import { BootScreen } from "../ui/BootScreen";
import { VocabularyRepository } from "../vocabulary/VocabularyRepository";

export class Game {
  readonly #container: HTMLElement;
  readonly #bootScreen: BootScreen;
  readonly #stateMachine = createPhaseOneStateMachine();
  #renderer: THREE.WebGLRenderer | null = null;
  #scene: THREE.Scene | null = null;
  #camera: THREE.PerspectiveCamera | null = null;
  #mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshStandardMaterial> | null = null;
  #timer: THREE.Timer | null = null;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#bootScreen = new BootScreen(container);
  }

  async start(): Promise<void> {
    this.#bootScreen.setLoading();
    try {
      this.#initializeSmokeScene();
      const vocabulary = await VocabularyRepository.load(getVocabularyUrl());
      this.#bootScreen.showMetadata(vocabulary.metadata);
      this.#stateMachine.transition(GameState.MAIN_MENU);
    } catch (error) {
      this.#bootScreen.showError(error);
    }
  }

  dispose(): void {
    window.removeEventListener("resize", this.#resize);
    this.#renderer?.setAnimationLoop(null);
    this.#mesh?.geometry.dispose();
    this.#mesh?.material.dispose();
    this.#timer?.dispose();
    this.#renderer?.dispose();
  }

  #initializeSmokeScene(): void {
    const { scene: sceneConfig } = APP_CONFIG;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, sceneConfig.maxPixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "smoke-scene";
    renderer.domElement.setAttribute("aria-label", "Three.js Phase 1 smoke scene");
    this.#container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneConfig.backgroundColor);
    scene.fog = new THREE.Fog(sceneConfig.backgroundColor, 7, 14);

    const camera = new THREE.PerspectiveCamera(
      sceneConfig.cameraFieldOfView,
      1,
      sceneConfig.cameraNear,
      sceneConfig.cameraFar,
    );
    camera.position.z = sceneConfig.cameraZ;

    const geometry = new THREE.IcosahedronGeometry(1.35, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x50e3c2,
      emissive: 0x062e38,
      metalness: 0.7,
      roughness: 0.24,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.28;
    scene.add(mesh);

    scene.add(new THREE.HemisphereLight(0xa7d8ff, 0x08101e, 2.2));
    const keyLight = new THREE.DirectionalLight(0x62ffd4, 4.5);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x6f6bff, 3.2);
    rimLight.position.set(-4, -1, 2);
    scene.add(rimLight);

    this.#renderer = renderer;
    this.#scene = scene;
    this.#camera = camera;
    this.#mesh = mesh;
    const timer = new THREE.Timer();
    timer.connect(document);
    this.#timer = timer;

    window.addEventListener("resize", this.#resize);
    this.#resize();
    renderer.setAnimationLoop(this.#render);
  }

  readonly #resize = (): void => {
    if (!this.#renderer || !this.#camera) return;
    const width = Math.max(this.#container.clientWidth, 1);
    const height = Math.max(this.#container.clientHeight, 1);
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height, false);
  };

  readonly #render = (): void => {
    if (!this.#renderer || !this.#scene || !this.#camera || !this.#mesh || !this.#timer) {
      return;
    }
    this.#timer.update();
    const deltaSeconds = Math.min(this.#timer.getDelta(), 0.1);
    this.#mesh.rotation.x += APP_CONFIG.scene.meshRotationXPerSecond * deltaSeconds;
    this.#mesh.rotation.y += APP_CONFIG.scene.meshRotationYPerSecond * deltaSeconds;
    this.#renderer.render(this.#scene, this.#camera);
  };
}
