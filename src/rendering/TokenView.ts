import * as THREE from "three";
import { Arena } from "../gameplay/Arena";
import type { EnvironmentProfile } from "../gameplay/Environment";
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
  accent: string,
): void {
  const x = column * ATLAS_CELL_SIZE;
  const y = row * ATLAS_CELL_SIZE;
  context.save();
  context.translate(x, y);
  context.clearRect(0, 0, ATLAS_CELL_SIZE, ATLAS_CELL_SIZE);
  const metal = context.createRadialGradient(48, 38, 4, 64, 64, 61);
  metal.addColorStop(0, "#ffffff");
  metal.addColorStop(0.22, "#aebbd2");
  metal.addColorStop(0.52, "#53658c");
  metal.addColorStop(0.78, "#d9e2f2");
  metal.addColorStop(1, "#182343");
  context.fillStyle = metal;
  context.beginPath();
  context.arc(64, 64, 59, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#050b23";
  context.strokeStyle = "#0b1028";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(64, 64, 48, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = accent;
  context.lineWidth = 5;
  context.beginPath();
  context.arc(64, 64, 43, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#cfd8eb";
  for (const [rivetX, rivetY] of [[64, 10], [118, 64], [64, 118], [10, 64]]) {
    context.beginPath();
    context.arc(rivetX, rivetY, 2.8, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#fffbea";
  context.font = "900 62px 'Arial Narrow', ui-monospace, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = accent;
  context.shadowBlur = 9;
  context.fillText(tokenDisplayLabel(token), 64, 66);
  context.shadowBlur = 0;
  context.restore();
}

function createTokenAtlas(accent = "#35f2e0"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLUMNS * ATLAS_CELL_SIZE;
  canvas.height = ATLAS_ROWS * ATLAS_CELL_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create token-atlas canvas context.");
  CHARACTER_TOKENS.forEach((token, index) => {
    drawTokenCell(
      context,
      token,
      index % ATLAS_COLUMNS,
      Math.floor(index / ATLAS_COLUMNS),
      accent,
    );
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class TokenView {
  #texture = createTokenAtlas();
  readonly #material = new THREE.MeshBasicMaterial({
    map: this.#texture,
    transparent: true,
    depthWrite: false,
    fog: false,
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
  readonly #renderedTokens: CharacterToken[] = [];
  #cameraBasisReady = false;

  constructor(parent: THREE.Object3D) {
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
    this.#mesh.matrixAutoUpdate = false;
    parent.add(this.#mesh);
  }

  setEnvironment(environment: EnvironmentProfile): void {
    const replacement = createTokenAtlas(environment.uiTheme.accent);
    this.#texture.dispose();
    this.#texture = replacement;
    this.#material.map = replacement;
    this.#material.needsUpdate = true;
  }

  update(
    entities: readonly TokenEntity[],
    arena: Arena,
    camera: THREE.Camera,
    nextToken: CharacterToken | null,
    elapsedSeconds: number,
  ): void {
    if (!this.#cameraBasisReady) {
      camera.getWorldQuaternion(this.#cameraQuaternion);
      this.#right.set(1, 0, 0).applyQuaternion(this.#cameraQuaternion);
      this.#up.set(0, 1, 0).applyQuaternion(this.#cameraQuaternion);
      this.#cameraBasisReady = true;
    }

    let tokenAtlasChanged = entities.length !== this.#renderedTokens.length;
    entities.forEach((entity, index) => {
      const position = arena.toDisplayPoint(entity.position);
      const size = entity.token === nextToken
        ? 1.1 + Math.sin(elapsedSeconds * 5) * 0.12
        : 0.82;
      this.#writePositions(index, position.x, 0.78, position.z, size / 2);
      if (this.#renderedTokens[index] !== entity.token) {
        this.#writeUvs(index, entity.token);
        this.#renderedTokens[index] = entity.token;
        tokenAtlasChanged = true;
      }
    });
    this.#renderedTokens.length = entities.length;
    this.#geometry.setDrawRange(0, entities.length * INDICES_PER_TOKEN);
    const positionAttribute = this.#geometry.getAttribute("position");
    const uvAttribute = this.#geometry.getAttribute("uv");
    positionAttribute.needsUpdate = true;
    if (tokenAtlasChanged) uvAttribute.needsUpdate = true;
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
