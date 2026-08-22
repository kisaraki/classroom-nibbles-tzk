import * as THREE from "three";
import type { Arena } from "../gameplay/Arena";
import {
  PowerUpKind,
  powerUpDisplayLabel,
  type PowerUpEntity,
  type PowerUpKind as PowerUpKindValue,
} from "../gameplay/PowerUpPool";

interface PowerUpVisual {
  readonly sprite: THREE.Sprite;
}

function powerUpColor(kind: PowerUpKindValue): string {
  if (kind === PowerUpKind.TIME_PLUS_10 || kind === PowerUpKind.TIME_PLUS_5) {
    return "#50e3c2";
  }
  if (kind === PowerUpKind.TIME_MINUS_10 || kind === PowerUpKind.TIME_MINUS_5) {
    return "#ff8e8e";
  }
  return "#ffd166";
}

function createPowerUpTexture(kind: PowerUpKindValue): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create power-up canvas context.");
  const color = powerUpColor(kind);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(5, 15, 30, 0.96)";
  context.strokeStyle = color;
  context.lineWidth = 9;
  context.beginPath();
  context.arc(80, 80, 65, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = color;
  context.font = kind === PowerUpKind.ATTACK
    ? "700 34px 'Noto Sans TC', sans-serif"
    : "800 52px ui-monospace, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(powerUpDisplayLabel(kind), 80, 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class PowerUpView {
  readonly #scene: THREE.Scene;
  readonly #materials = new Map<PowerUpKindValue, THREE.SpriteMaterial>();
  readonly #textures = new Map<PowerUpKindValue, THREE.CanvasTexture>();
  readonly #visuals = new Map<string, PowerUpVisual>();

  constructor(scene: THREE.Scene) {
    this.#scene = scene;
  }

  update(entities: readonly PowerUpEntity[], arena: Arena, elapsedSeconds: number): void {
    const activeIds = new Set(entities.map((entity) => entity.id));
    for (const [id, visual] of this.#visuals) {
      if (activeIds.has(id)) continue;
      this.#scene.remove(visual.sprite);
      this.#visuals.delete(id);
    }
    for (const entity of entities) {
      let visual = this.#visuals.get(entity.id);
      if (!visual) {
        const sprite = new THREE.Sprite(this.#materialFor(entity.kind));
        visual = Object.freeze({ sprite });
        this.#visuals.set(entity.id, visual);
        this.#scene.add(sprite);
      }
      const position = arena.toDisplayPoint(entity.position);
      visual.sprite.position.set(position.x, 0.96, position.z);
      const pulse = 1.04 + Math.sin(elapsedSeconds * 3.5 + entity.position.x) * 0.08;
      visual.sprite.scale.setScalar(pulse);
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

  #materialFor(kind: PowerUpKindValue): THREE.SpriteMaterial {
    const existing = this.#materials.get(kind);
    if (existing) return existing;
    const texture = createPowerUpTexture(kind);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.#textures.set(kind, texture);
    this.#materials.set(kind, material);
    return material;
  }
}
