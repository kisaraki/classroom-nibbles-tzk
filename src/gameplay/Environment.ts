import type { GameLevel } from "../vocabulary/WordSelector";
import type { XZPoint } from "./Trail";

export const EnvironmentKind = Object.freeze({
  CARGO_BAY: "CARGO_BAY",
  SHIP_PIPELINE: "SHIP_PIPELINE",
  ASTEROID_BELT: "ASTEROID_BELT",
  DENSE_ATMOSPHERE: "DENSE_ATMOSPHERE",
  ALIEN_FOREST: "ALIEN_FOREST",
} as const);

export type EnvironmentKind =
  (typeof EnvironmentKind)[keyof typeof EnvironmentKind];

export const EnvironmentObstacleKind = Object.freeze({
  CARGO: "CARGO",
  PIPE: "PIPE",
  ASTEROID: "ASTEROID",
  PYLON: "PYLON",
  TREE: "TREE",
} as const);

export type EnvironmentObstacleKind =
  (typeof EnvironmentObstacleKind)[keyof typeof EnvironmentObstacleKind];

export interface EnvironmentObstacle {
  readonly id: string;
  readonly kind: EnvironmentObstacleKind;
  readonly position: XZPoint;
  readonly radius: number;
  readonly height: number;
}

export interface EnvironmentPalette {
  readonly backgroundColor: number;
  readonly floorColor: number;
  readonly gridCenterColor: number;
  readonly gridLineColor: number;
  readonly solidWallColor: number;
  readonly wrapGateColor: number;
  readonly obstacleColor: number;
  readonly obstacleAccentColor: number;
  readonly hemisphereSkyColor: number;
  readonly hemisphereGroundColor: number;
  readonly keyLightColor: number;
  readonly mechaPrimaryColor: number;
  readonly mechaSecondaryColor: number;
  readonly mechaGlowColor: number;
  readonly mechaCanopyColor: number;
  readonly fogNear: number;
  readonly fogFar: number;
}

export interface SpaceBackdropTheme {
  readonly id: string;
  readonly label: string;
  readonly deepColor: number;
  readonly horizonColor: number;
  readonly nebulaPrimaryColor: number;
  readonly nebulaSecondaryColor: number;
  readonly starColor: number;
  readonly accentStarColor: number;
  readonly celestialColor: number;
  readonly celestialDirection: Readonly<{
    x: number;
    y: number;
    z: number;
  }>;
  readonly celestialAngularRadius: number;
  readonly variant: number;
}

export interface EnvironmentUiTheme {
  readonly accent: string;
  readonly accentSoft: string;
  readonly line: string;
  readonly warning: string;
  readonly cabinet: string;
  readonly cabinetDeep: string;
  readonly rail: string;
  readonly lamp: string;
}

export interface EnvironmentProfile {
  readonly gameLevel: GameLevel;
  readonly kind: EnvironmentKind;
  readonly sceneName: string;
  readonly featureLabel: string;
  readonly palette: EnvironmentPalette;
  readonly spaceBackdrop: SpaceBackdropTheme;
  readonly uiTheme: EnvironmentUiTheme;
  readonly obstacles: readonly EnvironmentObstacle[];
}

interface ObstacleDefinition {
  readonly x: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
}

function obstacles(
  prefix: string,
  kind: EnvironmentObstacleKind,
  definitions: readonly ObstacleDefinition[],
): readonly EnvironmentObstacle[] {
  return Object.freeze(
    definitions.map((definition, index) =>
      Object.freeze({
        id: `${prefix}-${index + 1}`,
        kind,
        position: Object.freeze({ x: definition.x, z: definition.z }),
        radius: definition.radius,
        height: definition.height,
      }),
    ),
  );
}

export const ENVIRONMENT_PROFILES: readonly EnvironmentProfile[] = Object.freeze([
  Object.freeze({
    gameLevel: 1,
    kind: EnvironmentKind.CARGO_BAY,
    sceneName: "貨艙",
    featureLabel: "貨櫃形成實體掩體",
    uiTheme: Object.freeze({
      accent: "#35f2e0",
      accentSoft: "rgb(53 242 224 / 19%)",
      line: "rgb(106 226 255 / 42%)",
      warning: "#ffd343",
      cabinet: "#173376",
      cabinetDeep: "#07143f",
      rail: "#ff5a4f",
      lamp: "#ffd343",
    }),
    spaceBackdrop: Object.freeze({
      id: "orbital-dock-nebula",
      label: "青綠船塢星雲",
      deepColor: 0x01050d,
      horizonColor: 0x09283a,
      nebulaPrimaryColor: 0x0b7f83,
      nebulaSecondaryColor: 0xb5692a,
      starColor: 0xc8f7ff,
      accentStarColor: 0xffd27a,
      celestialColor: 0x4b7189,
      celestialDirection: Object.freeze({ x: -0.56, y: 0.34, z: -0.75 }),
      celestialAngularRadius: 0.16,
      variant: 1,
    }),
    palette: Object.freeze({
      backgroundColor: 0x050b16,
      floorColor: 0x0b1950,
      gridCenterColor: 0x35f2e0,
      gridLineColor: 0x254b89,
      solidWallColor: 0xff5a4f,
      wrapGateColor: 0x557eff,
      obstacleColor: 0x7483a4,
      obstacleAccentColor: 0xffd343,
      hemisphereSkyColor: 0xbcecff,
      hemisphereGroundColor: 0x08101e,
      keyLightColor: 0x73ffe1,
      mechaPrimaryColor: 0xc8d7ee,
      mechaSecondaryColor: 0x173376,
      mechaGlowColor: 0xffd343,
      mechaCanopyColor: 0x54f6ff,
      fogNear: 18,
      fogFar: 32,
    }),
    obstacles: obstacles("cargo", EnvironmentObstacleKind.CARGO, [
      { x: -6.4, z: -5.8, radius: 0.9, height: 1.55 },
      { x: 6.2, z: -5.4, radius: 0.82, height: 1.35 },
      { x: -6.7, z: -0.2, radius: 0.86, height: 1.45 },
      { x: 6.5, z: 0.8, radius: 0.94, height: 1.7 },
      { x: -5.7, z: 5.7, radius: 0.78, height: 1.3 },
      { x: 5.9, z: 5.4, radius: 0.88, height: 1.5 },
    ]),
  }),
  Object.freeze({
    gameLevel: 2,
    kind: EnvironmentKind.SHIP_PIPELINE,
    sceneName: "艦艇管線",
    featureLabel: "管柱構成狹長航道",
    uiTheme: Object.freeze({
      accent: "#57c7ff",
      accentSoft: "rgb(87 199 255 / 19%)",
      line: "rgb(117 218 255 / 42%)",
      warning: "#b8f5ff",
      cabinet: "#163b83",
      cabinetDeep: "#071538",
      rail: "#ff6a45",
      lamp: "#b8f5ff",
    }),
    spaceBackdrop: Object.freeze({
      id: "cryogenic-current",
      label: "藍白低溫星流",
      deepColor: 0x01070d,
      horizonColor: 0x062b3b,
      nebulaPrimaryColor: 0x087eaa,
      nebulaSecondaryColor: 0x23d6c8,
      starColor: 0xd8fbff,
      accentStarColor: 0x75d9ff,
      celestialColor: 0x8ddbe7,
      celestialDirection: Object.freeze({ x: 0.58, y: 0.23, z: -0.78 }),
      celestialAngularRadius: 0.1,
      variant: 2,
    }),
    palette: Object.freeze({
      backgroundColor: 0x041016,
      floorColor: 0x0b2458,
      gridCenterColor: 0x57c7ff,
      gridLineColor: 0x27598c,
      solidWallColor: 0xff6a45,
      wrapGateColor: 0x5b83ff,
      obstacleColor: 0x8194b1,
      obstacleAccentColor: 0xb8f5ff,
      hemisphereSkyColor: 0xa5f7f1,
      hemisphereGroundColor: 0x07171c,
      keyLightColor: 0x5cf2e6,
      mechaPrimaryColor: 0xd0ddf0,
      mechaSecondaryColor: 0x163b83,
      mechaGlowColor: 0xb8f5ff,
      mechaCanopyColor: 0x57c7ff,
      fogNear: 15,
      fogFar: 29,
    }),
    obstacles: obstacles("pipe", EnvironmentObstacleKind.PIPE, [
      { x: -4.6, z: -6.4, radius: 0.68, height: 2.8 },
      { x: 4.6, z: -6.4, radius: 0.68, height: 2.8 },
      { x: -4.6, z: -2.2, radius: 0.68, height: 2.8 },
      { x: 4.6, z: -2.2, radius: 0.68, height: 2.8 },
      { x: -4.6, z: 2.2, radius: 0.68, height: 2.8 },
      { x: 4.6, z: 2.2, radius: 0.68, height: 2.8 },
      { x: -4.6, z: 6.4, radius: 0.68, height: 2.8 },
      { x: 4.6, z: 6.4, radius: 0.68, height: 2.8 },
    ]),
  }),
  Object.freeze({
    gameLevel: 3,
    kind: EnvironmentKind.ASTEROID_BELT,
    sceneName: "小行星帶",
    featureLabel: "不規則小行星阻擋航線",
    uiTheme: Object.freeze({
      accent: "#cf80ff",
      accentSoft: "rgb(207 128 255 / 20%)",
      line: "rgb(219 167 255 / 44%)",
      warning: "#ffcc5c",
      cabinet: "#3b247d",
      cabinetDeep: "#180a42",
      rail: "#ff4f69",
      lamp: "#ffcc5c",
    }),
    spaceBackdrop: Object.freeze({
      id: "violet-asteroid-rift",
      label: "紫晶小行星裂谷",
      deepColor: 0x05020d,
      horizonColor: 0x241337,
      nebulaPrimaryColor: 0x7042a8,
      nebulaSecondaryColor: 0xbe496f,
      starColor: 0xf1e6ff,
      accentStarColor: 0xffc18b,
      celestialColor: 0x7d637f,
      celestialDirection: Object.freeze({ x: -0.12, y: 0.43, z: -0.9 }),
      celestialAngularRadius: 0.2,
      variant: 3,
    }),
    palette: Object.freeze({
      backgroundColor: 0x070711,
      floorColor: 0x231454,
      gridCenterColor: 0xcf80ff,
      gridLineColor: 0x503678,
      solidWallColor: 0xff4f69,
      wrapGateColor: 0x8d7cff,
      obstacleColor: 0x817294,
      obstacleAccentColor: 0xffcc5c,
      hemisphereSkyColor: 0xcfc7ff,
      hemisphereGroundColor: 0x0a0712,
      keyLightColor: 0xb9a8ff,
      mechaPrimaryColor: 0xd9d5eb,
      mechaSecondaryColor: 0x3b247d,
      mechaGlowColor: 0xffcc5c,
      mechaCanopyColor: 0xcf80ff,
      fogNear: 14,
      fogFar: 28,
    }),
    obstacles: obstacles("asteroid", EnvironmentObstacleKind.ASTEROID, [
      { x: -5.9, z: -6.2, radius: 0.92, height: 1.55 },
      { x: 4.8, z: -5.6, radius: 0.75, height: 1.25 },
      { x: -2.8, z: -3.7, radius: 0.64, height: 1.05 },
      { x: 6.2, z: -1.6, radius: 0.88, height: 1.45 },
      { x: -5.5, z: 0.7, radius: 0.72, height: 1.2 },
      { x: 3.8, z: 2.4, radius: 0.82, height: 1.4 },
      { x: -2.8, z: 4.4, radius: 0.68, height: 1.1 },
      { x: 5.8, z: 5.7, radius: 0.96, height: 1.6 },
      { x: -6.6, z: 6.1, radius: 0.78, height: 1.3 },
    ]),
  }),
  Object.freeze({
    gameLevel: 4,
    kind: EnvironmentKind.DENSE_ATMOSPHERE,
    sceneName: "稠密大氣層",
    featureLabel: "濃霧降低遠距能見度",
    uiTheme: Object.freeze({
      accent: "#86e4ff",
      accentSoft: "rgb(134 228 255 / 19%)",
      line: "rgb(158 231 255 / 44%)",
      warning: "#ffe16e",
      cabinet: "#28527d",
      cabinetDeep: "#0d203e",
      rail: "#ff7847",
      lamp: "#ffe16e",
    }),
    spaceBackdrop: Object.freeze({
      id: "ion-storm-haze",
      label: "金藍離子風暴",
      deepColor: 0x07111d,
      horizonColor: 0x25495d,
      nebulaPrimaryColor: 0x4e9ab0,
      nebulaSecondaryColor: 0xd79c55,
      starColor: 0xe8fbff,
      accentStarColor: 0xffdda6,
      celestialColor: 0xd0b98d,
      celestialDirection: Object.freeze({ x: 0.5, y: 0.31, z: -0.81 }),
      celestialAngularRadius: 0.24,
      variant: 4,
    }),
    palette: Object.freeze({
      backgroundColor: 0x172738,
      floorColor: 0x183c63,
      gridCenterColor: 0x86e4ff,
      gridLineColor: 0x3a6785,
      solidWallColor: 0xff7847,
      wrapGateColor: 0x77b9ff,
      obstacleColor: 0x8094a7,
      obstacleAccentColor: 0xffe16e,
      hemisphereSkyColor: 0xd1ecf2,
      hemisphereGroundColor: 0x142635,
      keyLightColor: 0xffe0a3,
      mechaPrimaryColor: 0xd6e0e8,
      mechaSecondaryColor: 0x28527d,
      mechaGlowColor: 0xffe16e,
      mechaCanopyColor: 0x86e4ff,
      fogNear: 6,
      fogFar: 17,
    }),
    obstacles: obstacles("pylon", EnvironmentObstacleKind.PYLON, [
      { x: -6.2, z: -5.3, radius: 0.7, height: 3.1 },
      { x: 6.1, z: -4.8, radius: 0.7, height: 3.1 },
      { x: -5.6, z: 0.1, radius: 0.7, height: 3.1 },
      { x: 5.8, z: 0.6, radius: 0.7, height: 3.1 },
      { x: -5.9, z: 5.5, radius: 0.7, height: 3.1 },
      { x: 6.3, z: 5.8, radius: 0.7, height: 3.1 },
    ]),
  }),
  Object.freeze({
    gameLevel: 5,
    kind: EnvironmentKind.ALIEN_FOREST,
    sceneName: "異星森林",
    featureLabel: "密集樹幹形成曲折路徑",
    uiTheme: Object.freeze({
      accent: "#7dff9c",
      accentSoft: "rgb(125 255 156 / 19%)",
      line: "rgb(146 255 172 / 42%)",
      warning: "#dfff65",
      cabinet: "#17533e",
      cabinetDeep: "#07271e",
      rail: "#ff6b58",
      lamp: "#dfff65",
    }),
    spaceBackdrop: Object.freeze({
      id: "emerald-biosphere",
      label: "翠綠異星極光",
      deepColor: 0x010a07,
      horizonColor: 0x0b3025,
      nebulaPrimaryColor: 0x168b59,
      nebulaSecondaryColor: 0x6d3e9a,
      starColor: 0xdcffe7,
      accentStarColor: 0xb8ff72,
      celestialColor: 0x4b8c68,
      celestialDirection: Object.freeze({ x: -0.45, y: 0.27, z: -0.85 }),
      celestialAngularRadius: 0.18,
      variant: 5,
    }),
    palette: Object.freeze({
      backgroundColor: 0x03110c,
      floorColor: 0x0c3a2c,
      gridCenterColor: 0x7dff9c,
      gridLineColor: 0x28644a,
      solidWallColor: 0xff6b58,
      wrapGateColor: 0x52bfc2,
      obstacleColor: 0x416d56,
      obstacleAccentColor: 0xdfff65,
      hemisphereSkyColor: 0xa8efc3,
      hemisphereGroundColor: 0x06130d,
      keyLightColor: 0x82ffab,
      mechaPrimaryColor: 0xd5e3d9,
      mechaSecondaryColor: 0x17533e,
      mechaGlowColor: 0xdfff65,
      mechaCanopyColor: 0x7dff9c,
      fogNear: 10,
      fogFar: 23,
    }),
    obstacles: obstacles("tree", EnvironmentObstacleKind.TREE, [
      { x: -6.4, z: -6.2, radius: 0.62, height: 3.3 },
      { x: -3.2, z: -5.1, radius: 0.58, height: 3.0 },
      { x: 5.7, z: -5.8, radius: 0.65, height: 3.5 },
      { x: -6.1, z: -2.2, radius: 0.6, height: 3.2 },
      { x: 3.4, z: -2.8, radius: 0.56, height: 2.9 },
      { x: 6.5, z: -0.4, radius: 0.64, height: 3.4 },
      { x: -4.2, z: 1.2, radius: 0.58, height: 3.0 },
      { x: 3.7, z: 2.1, radius: 0.62, height: 3.3 },
      { x: -6.4, z: 5.2, radius: 0.65, height: 3.5 },
      { x: -2.4, z: 5.8, radius: 0.57, height: 2.9 },
      { x: 3.1, z: 6.1, radius: 0.6, height: 3.2 },
      { x: 6.5, z: 5.1, radius: 0.63, height: 3.4 },
    ]),
  }),
]);

export function environmentForLevel(gameLevel: GameLevel): EnvironmentProfile {
  const profile = ENVIRONMENT_PROFILES.find(
    (candidate) => candidate.gameLevel === gameLevel,
  );
  if (!profile) throw new Error(`Missing environment profile for Game Level ${gameLevel}.`);
  return profile;
}

export class EnvironmentController {
  #current: EnvironmentProfile;

  constructor(initialGameLevel: GameLevel = 1) {
    this.#current = environmentForLevel(initialGameLevel);
  }

  get current(): EnvironmentProfile {
    return this.#current;
  }

  get obstacles(): readonly EnvironmentObstacle[] {
    return this.#current.obstacles;
  }

  select(gameLevel: GameLevel): EnvironmentProfile {
    this.#current = environmentForLevel(gameLevel);
    return this.#current;
  }
}
