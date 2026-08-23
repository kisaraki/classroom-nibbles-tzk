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
  readonly fogNear: number;
  readonly fogFar: number;
}

export interface EnvironmentUiTheme {
  readonly accent: string;
  readonly accentSoft: string;
  readonly line: string;
  readonly warning: string;
}

export interface EnvironmentProfile {
  readonly gameLevel: GameLevel;
  readonly kind: EnvironmentKind;
  readonly sceneName: string;
  readonly featureLabel: string;
  readonly palette: EnvironmentPalette;
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
      accent: "#50e3c2",
      accentSoft: "rgb(80 227 194 / 16%)",
      line: "rgb(80 227 194 / 28%)",
      warning: "#ffd166",
    }),
    palette: Object.freeze({
      backgroundColor: 0x050b16,
      floorColor: 0x091827,
      gridCenterColor: 0x367d7c,
      gridLineColor: 0x173f4b,
      solidWallColor: 0xff6b6b,
      wrapGateColor: 0x6f8cff,
      obstacleColor: 0x516579,
      obstacleAccentColor: 0xffc857,
      hemisphereSkyColor: 0xbcecff,
      hemisphereGroundColor: 0x08101e,
      keyLightColor: 0x73ffe1,
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
      accent: "#55b8ff",
      accentSoft: "rgb(85 184 255 / 16%)",
      line: "rgb(85 184 255 / 30%)",
      warning: "#a9e6ff",
    }),
    palette: Object.freeze({
      backgroundColor: 0x041016,
      floorColor: 0x0a2025,
      gridCenterColor: 0x3f9ea4,
      gridLineColor: 0x173e43,
      solidWallColor: 0xff715b,
      wrapGateColor: 0x46a8ff,
      obstacleColor: 0x738a91,
      obstacleAccentColor: 0x40d9d0,
      hemisphereSkyColor: 0xa5f7f1,
      hemisphereGroundColor: 0x07171c,
      keyLightColor: 0x5cf2e6,
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
      accent: "#c8a8ff",
      accentSoft: "rgb(200 168 255 / 17%)",
      line: "rgb(200 168 255 / 30%)",
      warning: "#ffca80",
    }),
    palette: Object.freeze({
      backgroundColor: 0x070711,
      floorColor: 0x151321,
      gridCenterColor: 0x705f91,
      gridLineColor: 0x302842,
      solidWallColor: 0xff6b7a,
      wrapGateColor: 0x8d7cff,
      obstacleColor: 0x756d80,
      obstacleAccentColor: 0xcabcf0,
      hemisphereSkyColor: 0xcfc7ff,
      hemisphereGroundColor: 0x0a0712,
      keyLightColor: 0xb9a8ff,
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
      accent: "#8ed9ed",
      accentSoft: "rgb(142 217 237 / 17%)",
      line: "rgb(142 217 237 / 30%)",
      warning: "#ffe0a3",
    }),
    palette: Object.freeze({
      backgroundColor: 0x172738,
      floorColor: 0x203747,
      gridCenterColor: 0x79acbd,
      gridLineColor: 0x38596a,
      solidWallColor: 0xff8472,
      wrapGateColor: 0x86c5ff,
      obstacleColor: 0x6f8794,
      obstacleAccentColor: 0xffd78a,
      hemisphereSkyColor: 0xd1ecf2,
      hemisphereGroundColor: 0x142635,
      keyLightColor: 0xffe0a3,
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
      accent: "#78ef9b",
      accentSoft: "rgb(120 239 155 / 17%)",
      line: "rgb(120 239 155 / 30%)",
      warning: "#d7ff91",
    }),
    palette: Object.freeze({
      backgroundColor: 0x03110c,
      floorColor: 0x092219,
      gridCenterColor: 0x3d8f66,
      gridLineColor: 0x173e2d,
      solidWallColor: 0xff7168,
      wrapGateColor: 0x56b6b0,
      obstacleColor: 0x315a43,
      obstacleAccentColor: 0x78ef9b,
      hemisphereSkyColor: 0xa8efc3,
      hemisphereGroundColor: 0x06130d,
      keyLightColor: 0x82ffab,
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
