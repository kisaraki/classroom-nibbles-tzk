import * as THREE from "three";
import { Arena } from "../gameplay/Arena";
import { tokenDisplayLabel, type TokenEntity } from "../gameplay/TokenPool";
import {
  CHARACTER_TOKENS,
  type CharacterToken,
} from "../vocabulary/types";

const ATLAS_COLUMNS = 5;
const ATLAS_ROWS = Math.ceil(CHARACTER_TOKENS.length / ATLAS_COLUMNS);
const ATLAS_CELL_SIZE = 128;
const VERTICES_PER_TOKEN = 4;
const POSITION_VALUES_PER_VERTEX = 3;
const UV_VALUES_PER_VERTEX = 2;
const INDICES_PER_TOKEN = 6;

function drawTokenCell(
  context: CanvasRenderingContext2D,
  token: CharacterToken,
  column: number,
  row: number,
): void {
  const x = column * ATLAS_CELL_SIZE;
  const y = row * ATLAS_CELL_SIZE;
  context.save();
  context.translate(x, y);
  context.clearRect(0, 0, ATLAS_CELL_SIZE, ATLAS_CELL_SIZE);
  context.fillStyle = "rgba(5, 15, 30, 0.94)";
  context.strokeStyle = "#50e3c2";
  context.lineWidth = 7;
  context.beginPath();
  context.roundRect(8, 8, 112, 112, 24);
  context.fill();
  context.stroke();
  context.fillStyle = "#e9fff9";
  context.font = "700 66px ui-monospace, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(tokenDisplayLabel(token), 64, 66);
  context.restore();
}

function createTokenAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLUMNS * ATLAS_CELL_SIZE;
  canvas.height = ATLAS_ROWS * ATLAS_CELL_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create token-atlas canvas context.");
  CHARACTER_TOKENS.forEach((token, index) => {
    drawTokenCell(context, token, index % ATLAS_COLUMNS, Math.floor(index / ATLAS_COLUMNS));
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class TokenView {
  readonly #texture = createTokenAtlas();
  readonly #material = new THREE.MeshBasicMaterial({
    map: this.#texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  readonly #geometry = new THREE.BufferGeometry();
  readonly #positions = new Float32Array(
    CHARACTER_TOKENS.length * VERTICES_PER_TOKEN * POSITION_VALUES_PER_VERTEX,
  );
  readonly #uvs = new Float32Array(
    CHARACTER_TOKENS.length * VERTICES_PER_TOKEN * UV_VALUES_PER_VERTEX,
  );
  readonly #mesh: THREE.Mesh;
  readonly #cameraQuaternion = new THREE.Quaternion();
  readonly #right = new THREE.Vector3();
  readonly #up = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    const indices = new Uint16Array(CHARACTER_TOKENS.length * INDICES_PER_TOKEN);
    for (let index = 0; index < CHARACTER_TOKENS.length; index += 1) {
      const vertex = index * VERTICES_PER_TOKEN;
      const offset = index * INDICES_PER_TOKEN;
      indices.set(
        [vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3],
        offset,
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
    scene.add(this.#mesh);
  }

  update(
    entities: readonly TokenEntity[],
    arena: Arena,
    camera: THREE.Camera,
    nextToken: CharacterToken | null,
    elapsedSeconds: number,
  ): void {
    camera.getWorldQuaternion(this.#cameraQuaternion);
    this.#right.set(1, 0, 0).applyQuaternion(this.#cameraQuaternion);
    this.#up.set(0, 1, 0).applyQuaternion(this.#cameraQuaternion);

    entities.forEach((entity, index) => {
      const position = arena.toDisplayPoint(entity.position);
      const size = entity.token === nextToken
        ? 1.1 + Math.sin(elapsedSeconds * 5) * 0.12
        : 0.82;
      this.#writePositions(index, position.x, 0.78, position.z, size / 2);
      this.#writeUvs(index, entity.token);
    });
    this.#geometry.setDrawRange(0, entities.length * INDICES_PER_TOKEN);
    const positionAttribute = this.#geometry.getAttribute("position");
    const uvAttribute = this.#geometry.getAttribute("uv");
    positionAttribute.needsUpdate = true;
    uvAttribute.needsUpdate = true;
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
    const offset = index * VERTICES_PER_TOKEN * POSITION_VALUES_PER_VERTEX;
    this.#positions.set([
      centerX - rightX - upX, centerY - rightY - upY, centerZ - rightZ - upZ,
      centerX + rightX - upX, centerY + rightY - upY, centerZ + rightZ - upZ,
      centerX + rightX + upX, centerY + rightY + upY, centerZ + rightZ + upZ,
      centerX - rightX + upX, centerY - rightY + upY, centerZ - rightZ + upZ,
    ], offset);
  }

  #writeUvs(index: number, token: CharacterToken): void {
    const atlasIndex = CHARACTER_TOKENS.indexOf(token);
    const column = atlasIndex % ATLAS_COLUMNS;
    const row = Math.floor(atlasIndex / ATLAS_COLUMNS);
    const uMinimum = column / ATLAS_COLUMNS;
    const uMaximum = (column + 1) / ATLAS_COLUMNS;
    const vMaximum = 1 - row / ATLAS_ROWS;
    const vMinimum = 1 - (row + 1) / ATLAS_ROWS;
    const offset = index * VERTICES_PER_TOKEN * UV_VALUES_PER_VERTEX;
    this.#uvs.set([
      uMinimum, vMinimum,
      uMaximum, vMinimum,
      uMaximum, vMaximum,
      uMinimum, vMaximum,
    ], offset);
  }
}
