import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { Arena, BoundaryMode } from "../gameplay/Arena";
import { PinballCameraRig } from "./PinballCameraRig";

const cameraConfig = Object.freeze({
  eyeHeight: 11.5,
  playerDistance: 7.5,
  lookHeight: 0.2,
  lookDepthRatio: -0.15,
  backflipDurationSeconds: 0.8,
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

    rig.update(createArena(), 0);
    camera.getWorldDirection(direction);

    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.y).toBeCloseTo(11.5);
    expect(camera.position.z).toBeCloseTo(16.5);
    expect(direction.y).toBeLessThan(0);
    expect(direction.z).toBeLessThan(0);
  });

  it("runs one visual backward rotation and returns to the table pose", () => {
    const camera = new THREE.PerspectiveCamera();
    const rig = new PinballCameraRig(camera, cameraConfig);
    const arena = createArena();
    const baseDirection = new THREE.Vector3();
    const flippingDirection = new THREE.Vector3();
    const finalDirection = new THREE.Vector3();
    rig.update(arena, 0);
    camera.getWorldDirection(baseDirection);

    expect(rig.triggerBackflip()).toBe(true);
    expect(rig.triggerBackflip()).toBe(false);
    rig.update(arena, 0.2);
    camera.getWorldDirection(flippingDirection);

    expect(rig.backflipActive).toBe(true);
    expect(rig.backflipProgress).toBeCloseTo(0.25);
    expect(flippingDirection.angleTo(baseDirection)).toBeGreaterThan(0.5);

    rig.update(arena, 0.6);
    camera.getWorldDirection(finalDirection);
    expect(rig.backflipActive).toBe(false);
    expect(rig.backflipProgress).toBe(0);
    expect(finalDirection.angleTo(baseDirection)).toBeCloseTo(0);
  });
});
