import * as THREE from "three";
import { APP_CONFIG, GAMEPLAY_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import { directionVector } from "../gameplay/Direction";
import { Snake } from "../gameplay/Snake";

export class SnakeView {
  readonly #headGeometry = new THREE.SphereGeometry(0.36, 18, 12);
  readonly #headMaterial = new THREE.MeshStandardMaterial({
    color: APP_CONFIG.scene.snakeHeadColor,
    emissive: 0x174a42,
    metalness: 0.65,
    roughness: 0.22,
  });
  readonly #bodyGeometry = new THREE.SphereGeometry(0.3, 14, 10);
  readonly #bodyMaterial = new THREE.MeshStandardMaterial({
    color: APP_CONFIG.scene.snakeBodyColor,
    emissive: 0x082d2b,
    metalness: 0.5,
    roughness: 0.32,
  });
  readonly #noseGeometry = new THREE.OctahedronGeometry(0.13);
  readonly #noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x86ffe1,
    emissiveIntensity: 1.8,
  });
  readonly #head = new THREE.Mesh(this.#headGeometry, this.#headMaterial);
  readonly #nose = new THREE.Mesh(this.#noseGeometry, this.#noseMaterial);
  readonly #body = new THREE.InstancedMesh(
    this.#bodyGeometry,
    this.#bodyMaterial,
    GAMEPLAY_CONFIG.snake.maximumLength - 1,
  );
  readonly #matrix = new THREE.Matrix4();

  constructor(scene: THREE.Scene) {
    this.#body.count = 0;
    scene.add(this.#body, this.#head, this.#nose);
  }

  update(snake: Snake, arena: Arena, showHead = true): void {
    const segments = snake.getSegmentPositions();
    const head = arena.toDisplayPoint(segments[0] ?? snake.headPosition);
    this.#head.position.set(head.x, 0.4, head.z);
    this.#head.visible = showHead;

    const forward = directionVector(snake.direction);
    const nosePosition = arena.toDisplayPoint({
      x: snake.headPosition.x + forward.x * 0.38,
      z: snake.headPosition.z + forward.z * 0.38,
    });
    this.#nose.position.set(nosePosition.x, 0.42, nosePosition.z);
    this.#nose.visible = showHead;

    this.#body.count = Math.max(segments.length - 1, 0);
    for (let index = 1; index < segments.length; index += 1) {
      const segment = segments[index];
      if (!segment) continue;
      const displayPosition = arena.toDisplayPoint(segment);
      this.#matrix.makeTranslation(displayPosition.x, 0.34, displayPosition.z);
      this.#body.setMatrixAt(index - 1, this.#matrix);
    }
    this.#body.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.#headGeometry.dispose();
    this.#headMaterial.dispose();
    this.#bodyGeometry.dispose();
    this.#bodyMaterial.dispose();
    this.#noseGeometry.dispose();
    this.#noseMaterial.dispose();
  }
}
