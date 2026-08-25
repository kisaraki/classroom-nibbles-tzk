import * as THREE from "three";
import { APP_CONFIG, GAMEPLAY_CONFIG } from "../core/Config";
import { Arena } from "../gameplay/Arena";
import { directionVector } from "../gameplay/Direction";
import type { EnvironmentProfile } from "../gameplay/Environment";
import { Snake } from "../gameplay/Snake";
import { MechaBackflipAnimator } from "./MechaBackflipAnimator";

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const LOCAL_RIGHT = new THREE.Vector3(1, 0, 0);
const PANEL_LIGHT_DIRECTION = new THREE.Vector3(-0.38, 0.84, 0.39).normalize();
const PANEL_SHADE_MINIMUM = 0.58;
const PANEL_SHADE_RANGE = 0.42;
const PANEL_BAND_DARKENING = 0.14;
const PANEL_BAND_HALF_HEIGHT_RATIO = 0.2;
const ACCENT_PANEL_PRIMARY_BLEND = 0.42;
const PRIMARY_SEGMENT_SCALE = 1.03;
const ACCENT_SEGMENT_SCALE = 0.88;

function addPanelShading<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.computeBoundingSphere();
  const radius = geometry.boundingSphere?.radius ?? 1;
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const colors = new THREE.BufferAttribute(
    new Float32Array(positions.count * 3),
    3,
  );
  for (let index = 0; index < positions.count; index += 1) {
    const light = Math.max(
      0,
      normals.getX(index) * PANEL_LIGHT_DIRECTION.x
        + normals.getY(index) * PANEL_LIGHT_DIRECTION.y
        + normals.getZ(index) * PANEL_LIGHT_DIRECTION.z,
    );
    const panelBand = Math.abs(positions.getY(index))
      < radius * PANEL_BAND_HALF_HEIGHT_RATIO;
    const shade = Math.max(
      PANEL_SHADE_MINIMUM,
      PANEL_SHADE_MINIMUM
        + light * PANEL_SHADE_RANGE
        - (panelBand ? PANEL_BAND_DARKENING : 0),
    );
    colors.setXYZ(index, shade, shade, shade);
  }
  geometry.setAttribute("color", colors);
  return geometry;
}

export class SnakeView {
  readonly #headGeometry = addPanelShading(
    new THREE.DodecahedronGeometry(0.42, 1),
  );
  readonly #headMaterial = new THREE.MeshBasicMaterial({
    color: 0x72f5dc,
    fog: false,
    toneMapped: false,
    vertexColors: true,
  });
  readonly #canopyGeometry = new THREE.SphereGeometry(0.27, 18, 12);
  readonly #canopyMaterial = new THREE.MeshBasicMaterial({
    color: 0xbafcff,
    fog: false,
    toneMapped: false,
  });
  readonly #noseGeometry = new THREE.ConeGeometry(0.14, 0.38, 4);
  readonly #armorGeometry = new THREE.BoxGeometry(0.66, 0.12, 0.38);
  readonly #armorMaterial = new THREE.MeshBasicMaterial({
    color: 0x163f51,
    fog: false,
    toneMapped: false,
  });
  readonly #glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc857,
    fog: false,
    toneMapped: false,
  });
  readonly #engineGeometry = new THREE.SphereGeometry(0.075, 10, 7);
  readonly #bodyGeometry = addPanelShading(
    new THREE.DodecahedronGeometry(0.31, 1),
  );
  readonly #bodyMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    fog: false,
    toneMapped: false,
    vertexColors: true,
  });
  readonly #ringGeometry = new THREE.TorusGeometry(0.335, 0.045, 6, 12);
  readonly #ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc857,
    fog: false,
    toneMapped: false,
  });
  readonly #headRig = new THREE.Group();
  readonly #head = new THREE.Mesh(this.#headGeometry, this.#headMaterial);
  readonly #canopy = new THREE.Mesh(this.#canopyGeometry, this.#canopyMaterial);
  readonly #nose = new THREE.Mesh(this.#noseGeometry, this.#glowMaterial);
  readonly #armor = new THREE.Mesh(this.#armorGeometry, this.#armorMaterial);
  readonly #engines = new THREE.InstancedMesh(
    this.#engineGeometry,
    this.#glowMaterial,
    2,
  );
  readonly #body = new THREE.InstancedMesh(
    this.#bodyGeometry,
    this.#bodyMaterial,
    GAMEPLAY_CONFIG.snake.maximumLength - 1,
  );
  readonly #rings = new THREE.InstancedMesh(
    this.#ringGeometry,
    this.#ringMaterial,
    GAMEPLAY_CONFIG.snake.maximumLength - 1,
  );
  readonly #matrix = new THREE.Matrix4();
  readonly #ringMatrix = new THREE.Matrix4();
  readonly #position = new THREE.Vector3();
  readonly #scale = new THREE.Vector3(1, 1, 1);
  readonly #segmentQuaternion = new THREE.Quaternion();
  readonly #composedRingQuaternion = new THREE.Quaternion();
  readonly #ringQuaternion = new THREE.Quaternion().setFromAxisAngle(
    LOCAL_RIGHT,
    Math.PI / 2,
  );
  readonly #yawQuaternion = new THREE.Quaternion();
  readonly #flipQuaternion = new THREE.Quaternion();
  readonly #backflip = new MechaBackflipAnimator(
    APP_CONFIG.scene.mechaBackflipDurationSeconds,
  );
  readonly #backflipAxis = new THREE.Vector3();
  readonly #primaryBodyColor = new THREE.Color();
  readonly #accentBodyColor = new THREE.Color();

  constructor(parent: THREE.Object3D) {
    this.#canopy.scale.set(0.78, 0.48, 0.92);
    this.#canopy.position.set(0, 0.2, -0.04);
    this.#nose.rotation.x = -Math.PI / 2;
    this.#nose.rotation.z = Math.PI / 4;
    this.#nose.position.set(0, -0.02, -0.48);
    this.#armor.position.set(0, 0.08, 0.04);

    const engineMatrix = new THREE.Matrix4();
    engineMatrix.makeTranslation(-0.2, -0.02, 0.34);
    this.#engines.setMatrixAt(0, engineMatrix);
    engineMatrix.makeTranslation(0.2, -0.02, 0.34);
    this.#engines.setMatrixAt(1, engineMatrix);
    this.#engines.instanceMatrix.needsUpdate = true;
    this.#engines.matrixAutoUpdate = false;

    this.#headRig.add(
      this.#armor,
      this.#head,
      this.#canopy,
      this.#nose,
      this.#engines,
    );
    this.#body.count = 0;
    this.#rings.count = 0;
    parent.add(this.#body, this.#rings, this.#headRig);
  }

  get backflipActive(): boolean {
    return this.#backflip.active;
  }

  get backflipProgress(): number {
    return this.#backflip.progress;
  }

  triggerBackflip(): boolean {
    return this.#backflip.trigger();
  }

  setEnvironment(environment: EnvironmentProfile): void {
    const { palette } = environment;
    this.#headMaterial.color.setHex(palette.mechaPrimaryColor);
    this.#armorMaterial.color.setHex(palette.mechaSecondaryColor);
    this.#canopyMaterial.color.setHex(palette.mechaCanopyColor);
    this.#glowMaterial.color.setHex(palette.mechaGlowColor);
    this.#ringMaterial.color.setHex(palette.mechaGlowColor);
    this.#primaryBodyColor.setHex(palette.mechaPrimaryColor);
    this.#accentBodyColor
      .setHex(palette.mechaSecondaryColor)
      .lerp(this.#primaryBodyColor, ACCENT_PANEL_PRIMARY_BLEND);
    for (let index = 0; index < GAMEPLAY_CONFIG.snake.maximumLength - 1; index += 1) {
      this.#body.setColorAt(
        index,
        index % 2 === 0 ? this.#primaryBodyColor : this.#accentBodyColor,
      );
    }
    if (this.#body.instanceColor) this.#body.instanceColor.needsUpdate = true;
  }

  update(
    snake: Snake,
    arena: Arena,
    showHead = true,
    deltaSeconds = 0,
  ): void {
    this.#backflip.update(deltaSeconds);
    const pose = this.#backflip.pose;
    const segments = snake.getSegmentPositions();
    const head = arena.toDisplayPoint(segments[0] ?? snake.headPosition);
    const forward = directionVector(snake.direction);
    const yaw = Math.atan2(-forward.x, -forward.z);

    this.#headRig.position.set(head.x, 0.43 + pose.lift, head.z);
    this.#yawQuaternion.setFromAxisAngle(WORLD_UP, yaw);
    this.#flipQuaternion.setFromAxisAngle(LOCAL_RIGHT, pose.rotationRadians);
    this.#headRig.quaternion.copy(this.#yawQuaternion).multiply(this.#flipQuaternion);
    this.#headRig.visible = showHead;

    this.#backflipAxis.set(forward.z, 0, -forward.x).normalize();
    this.#body.count = Math.max(segments.length - 1, 0);
    this.#rings.count = this.#body.count;
    for (let index = 1; index < segments.length; index += 1) {
      const segment = segments[index];
      if (!segment) continue;
      const displayPosition = arena.toDisplayPoint(segment);
      const leadingBodyWeight = Math.max(0, 1 - index / 4);
      this.#position.set(
        displayPosition.x,
        0.34 + pose.lift * leadingBodyWeight,
        displayPosition.z,
      );
      this.#segmentQuaternion.setFromAxisAngle(
        this.#backflipAxis,
        pose.rotationRadians * leadingBodyWeight,
      );
      const instanceIndex = index - 1;
      const segmentScale = instanceIndex % 2 === 0
        ? PRIMARY_SEGMENT_SCALE
        : ACCENT_SEGMENT_SCALE;
      this.#scale.setScalar(segmentScale);
      this.#matrix.compose(
        this.#position,
        this.#segmentQuaternion,
        this.#scale,
      );
      this.#body.setMatrixAt(instanceIndex, this.#matrix);
      this.#composedRingQuaternion
        .copy(this.#segmentQuaternion)
        .multiply(this.#ringQuaternion);
      this.#scale.setScalar(1);
      this.#ringMatrix.compose(
        this.#position,
        this.#composedRingQuaternion,
        this.#scale,
      );
      this.#rings.setMatrixAt(instanceIndex, this.#ringMatrix);
    }
    this.#body.instanceMatrix.needsUpdate = true;
    this.#rings.instanceMatrix.needsUpdate = true;
  }

  dispose(): void {
    this.#headRig.removeFromParent();
    this.#body.removeFromParent();
    this.#rings.removeFromParent();
    this.#headGeometry.dispose();
    this.#headMaterial.dispose();
    this.#canopyGeometry.dispose();
    this.#canopyMaterial.dispose();
    this.#noseGeometry.dispose();
    this.#armorGeometry.dispose();
    this.#armorMaterial.dispose();
    this.#engineGeometry.dispose();
    this.#bodyGeometry.dispose();
    this.#bodyMaterial.dispose();
    this.#ringGeometry.dispose();
    this.#ringMaterial.dispose();
    this.#glowMaterial.dispose();
  }
}
