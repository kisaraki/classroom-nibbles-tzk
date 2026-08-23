import * as THREE from "three";
import { Arena, BoundaryMode } from "../gameplay/Arena";
import type { EnvironmentProfile } from "../gameplay/Environment";

export class ArenaView {
  readonly #floorGeometry: THREE.PlaneGeometry;
  readonly #floorMaterial: THREE.MeshBasicMaterial;
  readonly #grid: THREE.GridHelper;
  readonly #xBoundaryGeometry: THREE.BoxGeometry;
  readonly #zBoundaryGeometry: THREE.BoxGeometry;
  readonly #solidMaterial: THREE.MeshBasicMaterial;
  readonly #wrapMaterial: THREE.MeshBasicMaterial;

  constructor(parent: THREE.Object3D, arena: Arena, environment: EnvironmentProfile) {
    const { halfWidth, halfDepth, xBoundaryMode, zBoundaryMode } = arena.config;
    this.#floorGeometry = new THREE.PlaneGeometry(halfWidth * 2, halfDepth * 2);
    this.#floorMaterial = new THREE.MeshBasicMaterial({
      color: environment.palette.floorColor,
      fog: false,
    });
    const floor = new THREE.Mesh(this.#floorGeometry, this.#floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.08;
    floor.updateMatrix();
    floor.matrixAutoUpdate = false;
    parent.add(floor);

    this.#grid = new THREE.GridHelper(
      Math.max(halfWidth, halfDepth) * 2,
      Math.max(halfWidth, halfDepth) * 2,
      environment.palette.gridCenterColor,
      environment.palette.gridLineColor,
    );
    this.#grid.position.y = -0.04;
    this.#grid.updateMatrix();
    this.#grid.matrixAutoUpdate = false;
    parent.add(this.#grid);

    this.#solidMaterial = new THREE.MeshBasicMaterial({
      color: environment.palette.solidWallColor,
    });
    this.#wrapMaterial = new THREE.MeshBasicMaterial({
      color: environment.palette.wrapGateColor,
      transparent: true,
      opacity: 0.8,
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
    parent.add(xBoundaries, zBoundaries);
  }

  setEnvironment(environment: EnvironmentProfile): void {
    const { palette } = environment;
    this.#floorMaterial.color.setHex(palette.floorColor);
    this.#solidMaterial.color.setHex(palette.solidWallColor);
    this.#wrapMaterial.color.setHex(palette.wrapGateColor);
    const gridMaterials = Array.isArray(this.#grid.material)
      ? this.#grid.material
      : [this.#grid.material];
    if (gridMaterials[0] instanceof THREE.LineBasicMaterial) {
      gridMaterials[0].color.setHex(palette.gridCenterColor);
    }
    if (gridMaterials[1] instanceof THREE.LineBasicMaterial) {
      gridMaterials[1].color.setHex(palette.gridLineColor);
    }
  }

  dispose(): void {
    this.#floorGeometry.dispose();
    this.#floorMaterial.dispose();
    this.#xBoundaryGeometry.dispose();
    this.#zBoundaryGeometry.dispose();
    this.#solidMaterial.dispose();
    this.#wrapMaterial.dispose();
    this.#grid.geometry.dispose();
    const gridMaterials = Array.isArray(this.#grid.material)
      ? this.#grid.material
      : [this.#grid.material];
    for (const material of gridMaterials) material.dispose();
  }

  #createBoundaryInstances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    positions: readonly { readonly x: number; readonly z: number }[],
  ): THREE.InstancedMesh {
    const instances = new THREE.InstancedMesh(geometry, material, positions.length);
    instances.matrixAutoUpdate = false;
    const matrix = new THREE.Matrix4();
    positions.forEach((position, index) => {
      matrix.makeTranslation(position.x, 0.35, position.z);
      instances.setMatrixAt(index, matrix);
    });
    instances.instanceMatrix.needsUpdate = true;
    return instances;
  }
}
