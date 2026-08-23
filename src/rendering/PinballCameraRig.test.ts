import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { Arena, BoundaryMode } from "../gameplay/Arena";
import { PinballCameraRig } from "./PinballCameraRig";

const cameraConfig = Object.freeze({
  eyeHeight: 11.5,
  playerDistance: 7.5,
  lookHeight: 0.2,
  lookDepthRatio: -0.15,
});

function createArena(): Arena {
  return new Arena({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: BoundaryMode.SOLID,
    zBoundaryMode: BoundaryMode.WRAP,
  });
}

describe("PinballCameraRig", () => {
  it("places one camera at the player's end overlooking the full table", () => {
    const camera = new THREE.PerspectiveCamera();
    const rig = new PinballCameraRig(camera, cameraConfig);
    const direction = new THREE.Vector3();

    rig.update(createArena());
    camera.getWorldDirection(direction);

    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.y).toBeCloseTo(11.5);
    expect(camera.position.z).toBeCloseTo(16.5);
    expect(direction.y).toBeLessThan(0);
    expect(direction.z).toBeLessThan(0);
  });

  it("keeps the player's table view fixed across every render update", () => {
    const camera = new THREE.PerspectiveCamera();
    const rig = new PinballCameraRig(camera, cameraConfig);
    const arena = createArena();
    const baseDirection = new THREE.Vector3();
    const updatedDirection = new THREE.Vector3();
    rig.update(arena);
    camera.getWorldDirection(baseDirection);

    rig.update(arena);
    camera.getWorldDirection(updatedDirection);
    expect(updatedDirection.angleTo(baseDirection)).toBeCloseTo(0);
    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.y).toBeCloseTo(11.5);
    expect(camera.position.z).toBeCloseTo(16.5);
  });
});
