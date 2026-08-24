import type { GameLevel } from "../vocabulary/WordSelector";

export const APP_CONFIG = Object.freeze({
  title: "NIBBLES",
  releaseVersion: "1.8.0",
  vocabularyPath: "data/vocabulary.json",
  scene: Object.freeze({
    cameraFieldOfView: 52,
    cameraNear: 0.05,
    cameraFar: 100,
    cameraEyeHeight: 11.5,
    cameraPlayerDistance: 7.5,
    cameraLookHeight: 0.2,
    cameraLookDepthRatio: -0.15,
    mechaBackflipDurationSeconds: 0.8,
    antialias: false,
  }),
});

export const PRESENTATION_CONFIG = Object.freeze({
  telemetryUpdateIntervalSeconds: 0.1,
  sceneTransition: Object.freeze({
    closeMilliseconds: 260,
    holdMilliseconds: 520,
    openMilliseconds: 360,
  }),
  pauseTransitionMilliseconds: 280,
  audio: Object.freeze({
    masterGain: 0.2,
    ambientGain: 0.035,
    mutedStorageKey: "nibbles.audio.muted",
  }),
});

export const GAMEPLAY_CONFIG = Object.freeze({
  fixedStepSeconds: 1 / 60,
  maximumFrameDeltaSeconds: 0.1,
  maximumUpdatesPerFrame: 6,
  snake: Object.freeze({
    initialLength: 8,
    minimumLength: 3,
    maximumLength: 40,
    segmentSpacing: 0.75,
    minimumUTurnDistance: 0.75,
    speed: 3,
    headCollisionRadius: 0.32,
    bodyCollisionRadius: 0.28,
    selfCollisionIgnoreSegments: 3,
  }),
  collision: Object.freeze({
    stunDurationSeconds: 1,
    recoveryDurationSeconds: 0.5,
  }),
  typingTest: Object.freeze({
    durationSeconds: 30,
    requiredConsecutiveSuccesses: 3,
    timeoutMainTimeBonusSeconds: 5,
  }),
  powerUp: Object.freeze({
    collisionRadius: 0.42,
    attackAmmoReward: 5,
  }),
  tableMotion: Object.freeze({
    tiltAngleRadians: Math.PI / 90,
    tiltSlideSpeed: 1.65,
    shakeDisplacementSpeed: 7.2,
    shakeAngleRadians: Math.PI / 72,
    shakeLift: 0.24,
    snakeCollisionRadius: 0.32,
  }),
  weapon: Object.freeze({
    bulletRadius: 0.12,
    bulletSpeed: 13,
    muzzleOffset: 0.58,
    bulletLifetimeSeconds: 4,
  }),
  token: Object.freeze({
    radius: 0.34,
    collisionRadius: 0.36,
    minimumHeadDistance: 4,
    minimumEntitySpacing: 0.82,
    bodyClearance: 0.68,
    maximumRandomAttempts: 100,
    fallbackGridSpacing: 1.15,
  }),
  arena: Object.freeze({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: "SOLID" as const,
    zBoundaryMode: "WRAP" as const,
  }),
});

export const GAME_LEVEL_CONFIGS = Object.freeze([
  Object.freeze({
    gameLevel: 1 as const,
    sceneName: "貨艙",
    maximumTokenLength: 5 as number | null,
    wordsPerScene: 5,
    durationSeconds: 120,
    snakeSpeed: 3,
  }),
  Object.freeze({
    gameLevel: 2 as const,
    sceneName: "艦艇管線",
    maximumTokenLength: 8 as number | null,
    wordsPerScene: 10,
    durationSeconds: 180,
    snakeSpeed: 3.75,
  }),
  Object.freeze({
    gameLevel: 3 as const,
    sceneName: "小行星帶",
    maximumTokenLength: 10 as number | null,
    wordsPerScene: 15,
    durationSeconds: 270,
    snakeSpeed: 4.5,
  }),
  Object.freeze({
    gameLevel: 4 as const,
    sceneName: "稠密大氣層",
    maximumTokenLength: null,
    wordsPerScene: 20,
    durationSeconds: 360,
    snakeSpeed: 5.25,
  }),
  Object.freeze({
    gameLevel: 5 as const,
    sceneName: "異星森林",
    maximumTokenLength: null,
    wordsPerScene: 25,
    durationSeconds: 300,
    snakeSpeed: 6,
  }),
]);

export const TOTAL_RUN_WORDS = GAME_LEVEL_CONFIGS.reduce(
  (total, level) => total + level.wordsPerScene,
  0,
);

export function getGameLevelConfig(gameLevel: GameLevel) {
  const config = GAME_LEVEL_CONFIGS.find(
    (candidate) => candidate.gameLevel === gameLevel,
  );
  if (!config) throw new Error(`Missing configuration for Game Level ${gameLevel}.`);
  return config;
}

export function getVocabularyUrl(baseUrl: string = import.meta.env.BASE_URL): string {
  return `${baseUrl}${APP_CONFIG.vocabularyPath}`;
}
