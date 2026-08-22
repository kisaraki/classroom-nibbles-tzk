import * as THREE from "three";
import {
  EnvironmentKind,
  EnvironmentObstacleKind,
  type EnvironmentObstacle,
  type EnvironmentProfile,
} from "../gameplay/Environment";

export class EnvironmentView {
  readonly #scene: THREE.Scene;
  readonly #group = new THREE.Group();
  readonly #geometries: THREE.BufferGeometry[] = [];
  readonly #materials: THREE.Material[] = [];

  constructor(scene: THREE.Scene) {
    this.#scene = scene;
    this.#group.name = "phase-seven-environment";
    this.#scene.add(this.#group);
  }

  setEnvironment(environment: EnvironmentProfile): void {
    this.#clearResources();
    const material = this.#trackMaterial(
      new THREE.MeshStandardMaterial({
        color: environment.palette.obstacleColor,
        emissive: new THREE.Color(
          environment.palette.obstacleAccentColor,
        ).multiplyScalar(0.12),
        metalness: environment.kind === EnvironmentKind.ALIEN_FOREST ? 0.05 : 0.42,
        roughness: environment.kind === EnvironmentKind.ASTEROID_BELT ? 0.95 : 0.55,
        flatShading: environment.kind === EnvironmentKind.ASTEROID_BELT,
      }),
    );
    const accent = this.#trackMaterial(
      new THREE.MeshStandardMaterial({
        color: environment.palette.obstacleAccentColor,
        emissive: new THREE.Color(
          environment.palette.obstacleAccentColor,
        ).multiplyScalar(0.32),
        metalness: 0.25,
        roughness: 0.48,
      }),
    );

    const kind = environment.obstacles[0]?.kind;
    if (kind === EnvironmentObstacleKind.CARGO) {
      this.#addCargo(environment.obstacles, material, accent);
    } else if (kind === EnvironmentObstacleKind.PIPE) {
      this.#addPipes(environment.obstacles, material, accent);
    } else if (kind === EnvironmentObstacleKind.ASTEROID) {
      this.#addAsteroids(environment.obstacles, material);
    } else if (kind === EnvironmentObstacleKind.PYLON) {
      this.#addPylons(environment.obstacles, material, accent);
    } else if (kind === EnvironmentObstacleKind.TREE) {
      this.#addTrees(environment.obstacles, material, accent);
    }
  }

  dispose(): void {
    this.#clearResources();
    this.#scene.remove(this.#group);
  }

  #addCargo(
    obstacles: readonly EnvironmentObstacle[],
    material: THREE.Material,
    accent: THREE.Material,
  ): void {
    const geometry = this.#trackGeometry(new THREE.BoxGeometry(1, 1, 1));
    this.#group.add(
      this.#instances(geometry, material, obstacles, (obstacle, index) => ({
        y: obstacle.height / 2,
        scale: new THREE.Vector3(
          obstacle.radius * 1.4,
          obstacle.height,
          obstacle.radius * 1.4,
        ),
        yaw: index % 2 === 0 ? 0.12 : -0.12,
      })),
    );
    const stripeGeometry = this.#trackGeometry(new THREE.BoxGeometry(1, 0.08, 1.02));
    this.#group.add(
      this.#instances(stripeGeometry, accent, obstacles, (obstacle) => ({
        y: obstacle.height * 0.68,
        scale: new THREE.Vector3(
          obstacle.radius * 1.43,
          1,
          obstacle.radius * 1.43,
        ),
      })),
    );
  }

  #addPipes(
    obstacles: readonly EnvironmentObstacle[],
    material: THREE.Material,
    accent: THREE.Material,
  ): void {
    const geometry = this.#trackGeometry(new THREE.CylinderGeometry(1, 1, 1, 14));
    this.#group.add(
      this.#instances(geometry, material, obstacles, (obstacle) => ({
        y: obstacle.height / 2,
        scale: new THREE.Vector3(obstacle.radius, obstacle.height, obstacle.radius),
      })),
    );
    const ringGeometry = this.#trackGeometry(new THREE.TorusGeometry(1, 0.11, 6, 16));
    this.#group.add(
      this.#instances(ringGeometry, accent, obstacles, (obstacle) => ({
        y: 1.05,
        scale: new THREE.Vector3(obstacle.radius, obstacle.radius, obstacle.radius),
        pitch: Math.PI / 2,
      })),
    );
  }

  #addAsteroids(
    obstacles: readonly EnvironmentObstacle[],
    material: THREE.Material,
  ): void {
    const geometry = this.#trackGeometry(new THREE.DodecahedronGeometry(1, 0));
    this.#group.add(
      this.#instances(geometry, material, obstacles, (obstacle, index) => ({
        y: obstacle.height * 0.43,
        scale: new THREE.Vector3(
          obstacle.radius,
          obstacle.height * 0.55,
          obstacle.radius * 0.88,
        ),
        yaw: index * 0.47,
        roll: index * 0.19,
      })),
    );
  }

  #addPylons(
    obstacles: readonly EnvironmentObstacle[],
    material: THREE.Material,
    accent: THREE.Material,
  ): void {
    const geometry = this.#trackGeometry(new THREE.CylinderGeometry(0.7, 1, 1, 10));
    this.#group.add(
      this.#instances(geometry, material, obstacles, (obstacle) => ({
        y: obstacle.height / 2,
        scale: new THREE.Vector3(obstacle.radius, obstacle.height, obstacle.radius),
      })),
    );
    const beaconGeometry = this.#trackGeometry(new THREE.SphereGeometry(0.22, 10, 8));
    this.#group.add(
      this.#instances(beaconGeometry, accent, obstacles, (obstacle) => ({
        y: obstacle.height + 0.15,
        scale: new THREE.Vector3(1, 1, 1),
      })),
    );
  }

  #addTrees(
    obstacles: readonly EnvironmentObstacle[],
    trunkMaterial: THREE.Material,
    canopyMaterial: THREE.Material,
  ): void {
    const trunkGeometry = this.#trackGeometry(new THREE.CylinderGeometry(0.72, 1, 1, 8));
    this.#group.add(
      this.#instances(trunkGeometry, trunkMaterial, obstacles, (obstacle) => ({
        y: obstacle.height / 2,
        scale: new THREE.Vector3(obstacle.radius, obstacle.height, obstacle.radius),
      })),
    );
    const canopyGeometry = this.#trackGeometry(new THREE.ConeGeometry(1, 1.8, 9));
    this.#group.add(
      this.#instances(canopyGeometry, canopyMaterial, obstacles, (obstacle, index) => ({
        y: obstacle.height + 0.72,
        scale: new THREE.Vector3(
          obstacle.radius * 1.7,
          1 + (index % 3) * 0.12,
          obstacle.radius * 1.7,
        ),
        yaw: index * 0.31,
      })),
    );
  }

  #instances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    obstacles: readonly EnvironmentObstacle[],
    transform: (
      obstacle: EnvironmentObstacle,
      index: number,
    ) => {
      readonly y: number;
      readonly scale: THREE.Vector3;
      readonly yaw?: number;
      readonly pitch?: number;
      readonly roll?: number;
    },
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, obstacles.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const euler = new THREE.Euler();
    obstacles.forEach((obstacle, index) => {
      const settings = transform(obstacle, index);
      position.set(obstacle.position.x, settings.y, obstacle.position.z);
      euler.set(settings.pitch ?? 0, settings.yaw ?? 0, settings.roll ?? 0);
      quaternion.setFromEuler(euler);
      matrix.compose(position, quaternion, settings.scale);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  #trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
    this.#geometries.push(geometry);
    return geometry;
  }

  #trackMaterial<T extends THREE.Material>(material: T): T {
    this.#materials.push(material);
    return material;
  }

  #clearResources(): void {
    this.#group.clear();
    for (const geometry of this.#geometries.splice(0)) geometry.dispose();
    for (const material of this.#materials.splice(0)) material.dispose();
  }
}
