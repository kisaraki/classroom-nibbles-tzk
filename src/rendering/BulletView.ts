import * as THREE from "three";
import type { Arena } from "../gameplay/Arena";
import type { BulletEntity } from "../gameplay/WeaponSystem";

export class BulletView {
  readonly #parent: THREE.Object3D;
  readonly #geometry = new THREE.SphereGeometry(0.12, 10, 8);
  readonly #material = new THREE.MeshBasicMaterial({ color: 0xfff3a6 });
  readonly #visuals = new Map<string, THREE.Mesh>();

  constructor(parent: THREE.Object3D) {
    this.#parent = parent;
  }

  update(entities: readonly BulletEntity[], arena: Arena): void {
    const activeIds = new Set(entities.map((entity) => entity.id));
    for (const [id, mesh] of this.#visuals) {
      if (activeIds.has(id)) continue;
      this.#parent.remove(mesh);
      this.#visuals.delete(id);
    }
    for (const entity of entities) {
      let mesh = this.#visuals.get(entity.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.#geometry, this.#material);
        this.#visuals.set(entity.id, mesh);
        this.#parent.add(mesh);
      }
      const position = arena.toDisplayPoint(entity.position);
      mesh.position.set(position.x, 0.45, position.z);
    }
  }

  dispose(): void {
    for (const mesh of this.#visuals.values()) this.#parent.remove(mesh);
    this.#visuals.clear();
    this.#geometry.dispose();
    this.#material.dispose();
  }
}
