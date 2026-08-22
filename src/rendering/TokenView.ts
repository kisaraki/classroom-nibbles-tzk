import * as THREE from "three";
import { Arena } from "../gameplay/Arena";
import { tokenDisplayLabel, type TokenEntity } from "../gameplay/TokenPool";
import type { CharacterToken } from "../vocabulary/types";

interface TokenVisual {
  readonly sprite: THREE.Sprite;
  readonly token: CharacterToken;
}

function createTokenTexture(token: CharacterToken): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create token canvas context.");

  context.clearRect(0, 0, canvas.width, canvas.height);
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

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class TokenView {
  readonly #scene: THREE.Scene;
  readonly #materials = new Map<CharacterToken, THREE.SpriteMaterial>();
  readonly #textures = new Map<CharacterToken, THREE.CanvasTexture>();
  readonly #visuals = new Map<string, TokenVisual>();

  constructor(scene: THREE.Scene) {
    this.#scene = scene;
  }

  update(
    entities: readonly TokenEntity[],
    arena: Arena,
    nextToken: CharacterToken | null,
    elapsedSeconds: number,
  ): void {
    const activeIds = new Set(entities.map((entity) => entity.id));
    for (const [id, visual] of this.#visuals) {
      if (activeIds.has(id)) continue;
      this.#scene.remove(visual.sprite);
      this.#visuals.delete(id);
    }

    for (const entity of entities) {
      let visual = this.#visuals.get(entity.id);
      if (!visual) {
        const sprite = new THREE.Sprite(this.#materialFor(entity.token));
        visual = Object.freeze({ sprite, token: entity.token });
        this.#visuals.set(entity.id, visual);
        this.#scene.add(sprite);
      }

      const position = arena.toDisplayPoint(entity.position);
      visual.sprite.position.set(position.x, 0.78, position.z);
      const isNext = entity.token === nextToken;
      const pulse = isNext ? 1.1 + Math.sin(elapsedSeconds * 5) * 0.12 : 0.82;
      visual.sprite.scale.setScalar(pulse);
      visual.sprite.renderOrder = isNext ? 2 : 1;
    }
  }

  dispose(): void {
    for (const visual of this.#visuals.values()) this.#scene.remove(visual.sprite);
    for (const material of this.#materials.values()) material.dispose();
    for (const texture of this.#textures.values()) texture.dispose();
    this.#visuals.clear();
    this.#materials.clear();
    this.#textures.clear();
  }

  #materialFor(token: CharacterToken): THREE.SpriteMaterial {
    const existing = this.#materials.get(token);
    if (existing) return existing;
    const texture = createTokenTexture(token);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.#textures.set(token, texture);
    this.#materials.set(token, material);
    return material;
  }
}
