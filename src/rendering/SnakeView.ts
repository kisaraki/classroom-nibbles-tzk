import * as THREE from "three";
import { APP_CONFIG, GAMEPLAY_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import { directionVector } from "../gameplay/Direction";
import { Snake } from "../gameplay/Snake";
import { MechaBackflipAnimator } from "./MechaBackflipAnimator";

export class SnakeView {
  readonly #headGeometry = new THREE.SphereGeometry(0.36, 18, 12);
  readonly #headMaterial = new THREE.MeshBasicMaterial({
    color: APP_CONFIG.scene.snakeHeadColor,
    fog: false,
  });
  readonly #bodyGeometry = new THREE.SphereGeometry(0.3, 14, 10);
  readonly #bodyMaterial = new THREE.MeshBasicMaterial({
    color: APP_CONFIG.scene.snakeBodyColor,
    fog: false,
  });
  readonly #noseGeometry = new THREE.OctahedronGeometry(0.13);
  readonly #noseMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false,
  });
  readonly #head = new THREE.Mesh(this.#headGeometry, this.#headMaterial);
  readonly #nose = new THREE.Mesh(this.#noseGeometry, this.#noseMaterial);
  readonly #body = new THREE.InstancedMesh(
    this.#bodyGeometry,
    this.#bodyMaterial,
    GAMEPLAY_CONFIG.snake.maximumLength - 1,
  );
  readonly #matrix = new THREE.Matrix4();
  readonly #backflip = new MechaBackflipAnimator(
    APP_CONFIG.scene.mechaBackflipDurationSeconds,
  );
  readonly #backflipAxis = new THREE.Vector3();

  constructor(parent: THREE.Object3D) {
    this.#body.count = 0;
    parent.add(this.#body, this.#head, this.#nose);
  }

  get backflipActive(): boolean {
    return this.#backflip.active;
  }

  get backflipProgress(): number {
    return this.#backflip.progress;
  }

  triggerBackflip(): boolean {
    return this.#backflip.trigger();
  }

  update(
    snake: Snake,
    arena: Arena,
    showHead = true,
    deltaSeconds = 0,
  ): void {
    this.#backflip.update(deltaSeconds);
    const pose = this.#backflip.pose;
    const segments = snake.getSegmentPositions();
    const head = arena.toDisplayPoint(segments[0] ?? snake.headPosition);
    this.#head.position.set(head.x, 0.4 + pose.lift, head.z);
    this.#head.visible = showHead;

    const forward = directionVector(snake.direction);
    const noseForwardOffset = Math.cos(pose.rotationRadians) * 0.38;
    this.#nose.position.set(
      head.x + forward.x * noseForwardOffset,
      0.42 + pose.lift - Math.sin(pose.rotationRadians) * 0.38,
      head.z + forward.z * noseForwardOffset,
    );
    this.#nose.visible = showHead;
    this.#backflipAxis.set(forward.z, 0, -forward.x).normalize();
    this.#head.quaternion.setFromAxisAngle(this.#backflipAxis, pose.rotationRadians);
    this.#nose.quaternion.copy(this.#head.quaternion);

    this.#body.count = Math.max(segments.length - 1, 0);
    for (let index = 1; index < segments.length; index += 1) {
      const segment = segments[index];
      if (!segment) continue;
      const displayPosition = arena.toDisplayPoint(segment);
      const leadingBodyWeight = Math.max(0, 1 - index / 4);
      this.#matrix.makeTranslation(
        displayPosition.x,
        0.34 + pose.lift * leadingBodyWeight,
        displayPosition.z,
      );
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
