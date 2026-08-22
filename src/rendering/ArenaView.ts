import * as THREE from "three";
import { APP_CONFIG } from "../core/Config";
import { Arena, BoundaryMode } from "../gameplay/Arena";

export class ArenaView {
  readonly #floorGeometry: THREE.PlaneGeometry;
  readonly #floorMaterial: THREE.MeshStandardMaterial;
  readonly #xBoundaryGeometry: THREE.BoxGeometry;
  readonly #zBoundaryGeometry: THREE.BoxGeometry;
  readonly #solidMaterial: THREE.MeshStandardMaterial;
  readonly #wrapMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, arena: Arena) {
    const { halfWidth, halfDepth, xBoundaryMode, zBoundaryMode } = arena.config;
    this.#floorGeometry = new THREE.PlaneGeometry(halfWidth * 2, halfDepth * 2);
    this.#floorMaterial = new THREE.MeshStandardMaterial({
      color: APP_CONFIG.scene.floorColor,
      metalness: 0.35,
      roughness: 0.82,
    });
    const floor = new THREE.Mesh(this.#floorGeometry, this.#floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.08;
    scene.add(floor);

    const grid = new THREE.GridHelper(
      Math.max(halfWidth, halfDepth) * 2,
      Math.max(halfWidth, halfDepth) * 2,
      0x367d7c,
      0x173f4b,
    );
    grid.position.y = -0.04;
    scene.add(grid);

    this.#solidMaterial = new THREE.MeshStandardMaterial({
      color: APP_CONFIG.scene.solidWallColor,
      emissive: 0x351018,
      metalness: 0.5,
      roughness: 0.35,
    });
    this.#wrapMaterial = new THREE.MeshStandardMaterial({
      color: APP_CONFIG.scene.wrapGateColor,
      emissive: 0x182c68,
      transparent: true,
      opacity: 0.8,
      metalness: 0.3,
      roughness: 0.25,
    });
    this.#xBoundaryGeometry = new THREE.BoxGeometry(0.22, 0.8, halfDepth * 2);
    this.#zBoundaryGeometry = new THREE.BoxGeometry(halfWidth * 2, 0.8, 0.22);

    const xBoundaries = this.#createBoundaryInstances(
      this.#xBoundaryGeometry,
      xBoundaryMode === BoundaryMode.SOLID ? this.#solidMaterial : this.#wrapMaterial,
      [
        { x: -halfWidth, z: 0 },
        { x: halfWidth, z: 0 },
      ],
    );
    const zBoundaries = this.#createBoundaryInstances(
      this.#zBoundaryGeometry,
      zBoundaryMode === BoundaryMode.SOLID ? this.#solidMaterial : this.#wrapMaterial,
      [
        { x: 0, z: -halfDepth },
        { x: 0, z: halfDepth },
      ],
    );
    scene.add(xBoundaries, zBoundaries);
  }

  dispose(): void {
    this.#floorGeometry.dispose();
    this.#floorMaterial.dispose();
    this.#xBoundaryGeometry.dispose();
    this.#zBoundaryGeometry.dispose();
    this.#solidMaterial.dispose();
    this.#wrapMaterial.dispose();
  }

  #createBoundaryInstances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    positions: readonly { readonly x: number; readonly z: number }[],
  ): THREE.InstancedMesh {
    const instances = new THREE.InstancedMesh(geometry, material, positions.length);
    const matrix = new THREE.Matrix4();
    positions.forEach((position, index) => {
      matrix.makeTranslation(position.x, 0.35, position.z);
      instances.setMatrixAt(index, matrix);
    });
    instances.instanceMatrix.needsUpdate = true;
    return instances;
  }
}
