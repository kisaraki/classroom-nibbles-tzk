import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { Arena, BoundaryMode } from "../gameplay/Arena";
import { Direction } from "../gameplay/Direction";
import { CockpitCameraRig } from "./CockpitCameraRig";

const cameraConfig = Object.freeze({
  eyeHeight: 0.92,
  followDistance: 0.12,
  lookAhead: 6,
  lookHeight: 0.72,
  turnSmoothingSeconds: 0.15,
});

function createArena(): Arena {
  return new Arena({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: BoundaryMode.SOLID,
    zBoundaryMode: BoundaryMode.WRAP,
  });
}

describe("CockpitCameraRig", () => {
  it("places one camera at snake-eye height facing the current heading", () => {
    const camera = new THREE.PerspectiveCamera();
    const rig = new CockpitCameraRig(camera, cameraConfig);

    rig.update({ x: 2, z: 3 }, Direction.NORTH, createArena(), 0);

    expect(camera.position.x).toBeCloseTo(2);
    expect(camera.position.y).toBeCloseTo(0.92);
    expect(camera.position.z).toBeCloseTo(3.12);
    expect(Math.abs(rig.visualYaw)).toBeCloseTo(Math.PI);
  });

  it("smooths a ninety-degree visual turn instead of snapping", () => {
    const camera = new THREE.PerspectiveCamera();
    const rig = new CockpitCameraRig(camera, cameraConfig);
    const arena = createArena();
    rig.update({ x: 0, z: 0 }, Direction.NORTH, arena, 0);

    rig.update({ x: 0, z: 0 }, Direction.EAST, arena, 0.075);

    expect(rig.visualYaw).toBeGreaterThan(Math.PI / 2);
    expect(rig.visualYaw).toBeLessThan(Math.PI);
    for (let step = 0; step < 60; step += 1) {
      rig.update({ x: 0, z: 0 }, Direction.EAST, arena, 1 / 60);
    }
    expect(rig.visualYaw).toBeCloseTo(Math.PI / 2, 2);
  });
});
