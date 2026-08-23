import * as THREE from "three";
import type { Arena } from "../gameplay/Arena";
import {
  POWER_UP_KINDS,
  PowerUpKind,
  powerUpDisplayLabel,
  type PowerUpEntity,
  type PowerUpKind as PowerUpKindValue,
} from "../gameplay/PowerUpPool";

const ATLAS_CELL_SIZE = 160;
const VERTICES_PER_POWER_UP = 4;
const POSITION_VALUES_PER_VERTEX = 3;
const UV_VALUES_PER_VERTEX = 2;
const INDICES_PER_POWER_UP = 6;

function powerUpColor(kind: PowerUpKindValue): string {
  if (kind === PowerUpKind.TIME_PLUS_10 || kind === PowerUpKind.TIME_PLUS_5) {
    return "#50e3c2";
  }
  if (kind === PowerUpKind.TIME_MINUS_10 || kind === PowerUpKind.TIME_MINUS_5) {
    return "#ff8e8e";
  }
  return "#ffd166";
}

function createPowerUpAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_CELL_SIZE * POWER_UP_KINDS.length;
  canvas.height = ATLAS_CELL_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create power-up atlas canvas context.");
  POWER_UP_KINDS.forEach((kind, index) => {
    const centerX = index * ATLAS_CELL_SIZE + ATLAS_CELL_SIZE / 2;
    const color = powerUpColor(kind);
    context.fillStyle = "rgba(5, 15, 30, 0.96)";
    context.strokeStyle = color;
    context.lineWidth = 9;
    context.beginPath();
    context.arc(centerX, 80, 65, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = color;
    context.font = kind === PowerUpKind.ATTACK
      ? "700 34px 'Noto Sans TC', sans-serif"
      : "800 52px ui-monospace, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(powerUpDisplayLabel(kind), centerX, 82);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class PowerUpView {
  readonly #texture = createPowerUpAtlas();
  readonly #material = new THREE.MeshBasicMaterial({
    map: this.#texture,
    transparent: true,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide,
  });
  readonly #geometry = new THREE.BufferGeometry();
  readonly #positions = new Float32Array(
    POWER_UP_KINDS.length * VERTICES_PER_POWER_UP * POSITION_VALUES_PER_VERTEX,
  );
  readonly #uvs = new Float32Array(
    POWER_UP_KINDS.length * VERTICES_PER_POWER_UP * UV_VALUES_PER_VERTEX,
  );
  readonly #mesh: THREE.Mesh;
  readonly #cameraQuaternion = new THREE.Quaternion();
  readonly #right = new THREE.Vector3();
  readonly #up = new THREE.Vector3();
  readonly #renderedKinds: PowerUpKindValue[] = [];
  #cameraBasisReady = false;

  constructor(parent: THREE.Object3D) {
    const indices = new Uint16Array(
      POWER_UP_KINDS.length * INDICES_PER_POWER_UP,
    );
    for (let index = 0; index < POWER_UP_KINDS.length; index += 1) {
      const vertex = index * VERTICES_PER_POWER_UP;
      indices.set(
        [vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3],
        index * INDICES_PER_POWER_UP,
      );
    }
    const positionAttribute = new THREE.BufferAttribute(
      this.#positions,
      POSITION_VALUES_PER_VERTEX,
    );
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    const uvAttribute = new THREE.BufferAttribute(this.#uvs, UV_VALUES_PER_VERTEX);
    uvAttribute.setUsage(THREE.DynamicDrawUsage);
    this.#geometry.setAttribute("position", positionAttribute);
    this.#geometry.setAttribute("uv", uvAttribute);
    this.#geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    this.#geometry.setDrawRange(0, 0);
    this.#mesh = new THREE.Mesh(this.#geometry, this.#material);
    this.#mesh.frustumCulled = false;
    this.#mesh.renderOrder = 2;
    this.#mesh.matrixAutoUpdate = false;
    parent.add(this.#mesh);
  }

  update(
    entities: readonly PowerUpEntity[],
    arena: Arena,
    camera: THREE.Camera,
    elapsedSeconds: number,
  ): void {
    if (!this.#cameraBasisReady) {
      camera.getWorldQuaternion(this.#cameraQuaternion);
      this.#right.set(1, 0, 0).applyQuaternion(this.#cameraQuaternion);
      this.#up.set(0, 1, 0).applyQuaternion(this.#cameraQuaternion);
      this.#cameraBasisReady = true;
    }
    let atlasChanged = entities.length !== this.#renderedKinds.length;
    entities.forEach((entity, index) => {
      const position = arena.toDisplayPoint(entity.position);
      const size = 1.04 + Math.sin(elapsedSeconds * 3.5 + entity.position.x) * 0.08;
      this.#writePositions(index, position.x, 0.96, position.z, size / 2);
      if (this.#renderedKinds[index] !== entity.kind) {
        this.#writeUvs(index, entity.kind);
        this.#renderedKinds[index] = entity.kind;
        atlasChanged = true;
      }
    });
    this.#renderedKinds.length = entities.length;
    this.#geometry.setDrawRange(0, entities.length * INDICES_PER_POWER_UP);
    this.#geometry.getAttribute("position").needsUpdate = true;
    if (atlasChanged) this.#geometry.getAttribute("uv").needsUpdate = true;
  }

  dispose(): void {
    this.#mesh.removeFromParent();
    this.#geometry.dispose();
    this.#material.dispose();
    this.#texture.dispose();
  }

  #writePositions(
    index: number,
    centerX: number,
    centerY: number,
    centerZ: number,
    halfSize: number,
  ): void {
    const rightX = this.#right.x * halfSize;
    const rightY = this.#right.y * halfSize;
    const rightZ = this.#right.z * halfSize;
    const upX = this.#up.x * halfSize;
    const upY = this.#up.y * halfSize;
    const upZ = this.#up.z * halfSize;
    const offset = index * VERTICES_PER_POWER_UP * POSITION_VALUES_PER_VERTEX;
    this.#positions.set([
      centerX - rightX - upX, centerY - rightY - upY, centerZ - rightZ - upZ,
      centerX + rightX - upX, centerY + rightY - upY, centerZ + rightZ - upZ,
      centerX + rightX + upX, centerY + rightY + upY, centerZ + rightZ + upZ,
      centerX - rightX + upX, centerY - rightY + upY, centerZ - rightZ + upZ,
    ], offset);
  }

  #writeUvs(index: number, kind: PowerUpKindValue): void {
    const atlasIndex = POWER_UP_KINDS.indexOf(kind);
    const uMinimum = atlasIndex / POWER_UP_KINDS.length;
    const uMaximum = (atlasIndex + 1) / POWER_UP_KINDS.length;
    const offset = index * VERTICES_PER_POWER_UP * UV_VALUES_PER_VERTEX;
    this.#uvs.set([
      uMinimum, 0,
      uMaximum, 0,
      uMaximum, 1,
      uMinimum, 1,
    ], offset);
  }
}
