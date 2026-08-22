export const APP_CONFIG = Object.freeze({
  title: "NIBBLES",
  phaseLabel: "第六階段",
  vocabularyPath: "data/vocabulary.json",
  scene: Object.freeze({
    backgroundColor: 0x050b16,
    cameraFieldOfView: 60,
    cameraNear: 0.05,
    cameraFar: 100,
    cameraEyeHeight: 0.92,
    cameraFollowDistance: 0.12,
    cameraLookAhead: 6,
    cameraLookHeight: 0.72,
    cameraTurnSmoothingSeconds: 0.15,
    maxPixelRatio: 2,
    floorColor: 0x091827,
    solidWallColor: 0xff6b6b,
    wrapGateColor: 0x6f8cff,
    snakeHeadColor: 0x86ffe1,
    snakeBodyColor: 0x25bda5,
  }),
});

export const GAMEPLAY_CONFIG = Object.freeze({
  fixedStepSeconds: 1 / 60,
  maximumFrameDeltaSeconds: 0.1,
  maximumUpdatesPerFrame: 6,
  tacticalMap: Object.freeze({
    timeScale: 0.25,
  }),
  snake: Object.freeze({
    initialLength: 8,
    minimumLength: 3,
    maximumLength: 40,
    segmentSpacing: 0.75,
    minimumUTurnDistance: 0.75,
    speed: 4.5,
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
  }),
  Object.freeze({
    gameLevel: 2 as const,
    sceneName: "艦艇管線",
    maximumTokenLength: 8 as number | null,
    wordsPerScene: 5,
    durationSeconds: 90,
  }),
  Object.freeze({
    gameLevel: 3 as const,
    sceneName: "小行星帶",
    maximumTokenLength: 10 as number | null,
    wordsPerScene: 5,
    durationSeconds: 90,
  }),
  Object.freeze({
    gameLevel: 4 as const,
    sceneName: "稠密大氣層",
    maximumTokenLength: null,
    wordsPerScene: 5,
    durationSeconds: 90,
  }),
  Object.freeze({
    gameLevel: 5 as const,
    sceneName: "異星森林",
    maximumTokenLength: null,
    wordsPerScene: 5,
    durationSeconds: 60,
  }),
]);

export function getVocabularyUrl(baseUrl: string = import.meta.env.BASE_URL): string {
  return `${baseUrl}${APP_CONFIG.vocabularyPath}`;
}
