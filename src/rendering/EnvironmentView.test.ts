import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { ENVIRONMENT_PROFILES } from "../gameplay/Environment";
import { EnvironmentView } from "./EnvironmentView";

describe("EnvironmentView", () => {
  it("builds an instanced 3D treatment for all five environment profiles", () => {
    const scene = new THREE.Scene();
    const view = new EnvironmentView(scene);

    for (const profile of ENVIRONMENT_PROFILES) {
      view.setEnvironment(profile);
      const group = scene.getObjectByName("phase-seven-environment");
      const instances: THREE.InstancedMesh[] = [];
      group?.traverse((object) => {
        if (object instanceof THREE.InstancedMesh) instances.push(object);
      });

      expect(instances.length).toBeGreaterThan(0);
      expect(instances.every((instance) => instance.count > 0)).toBe(true);
      expect(
        instances.reduce((count, instance) => count + instance.count, 0),
      ).toBeGreaterThanOrEqual(profile.obstacles.length);
    }

    view.dispose();
    expect(scene.getObjectByName("phase-seven-environment")).toBeUndefined();
  });
});
