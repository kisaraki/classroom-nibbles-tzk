export const APP_CONFIG = Object.freeze({
  title: "NIBBLES",
  phaseLabel: "PHASE 1",
  vocabularyPath: "data/vocabulary.json",
  scene: Object.freeze({
    backgroundColor: 0x050b16,
    cameraFieldOfView: 52,
    cameraNear: 0.1,
    cameraFar: 100,
    cameraZ: 5,
    maxPixelRatio: 2,
    meshRotationXPerSecond: 0.18,
    meshRotationYPerSecond: 0.32,
  }),
});

export function getVocabularyUrl(baseUrl: string = import.meta.env.BASE_URL): string {
  return `${baseUrl}${APP_CONFIG.vocabularyPath}`;
}
