import type { VocabularyLevel } from "./types";

export const VocabularyMode = Object.freeze({
  CEEC_1: "CEEC_1",
  CEEC_2: "CEEC_2",
  CEEC_3: "CEEC_3",
  CEEC_4: "CEEC_4",
  CEEC_5: "CEEC_5",
  CEEC_6: "CEEC_6",
  PROGRESSIVE: "PROGRESSIVE",
  MIXED: "MIXED",
} as const);

export type VocabularyMode = (typeof VocabularyMode)[keyof typeof VocabularyMode];

export const VOCABULARY_MODE_OPTIONS: readonly VocabularyMode[] = Object.freeze([
  VocabularyMode.CEEC_1,
  VocabularyMode.CEEC_2,
  VocabularyMode.CEEC_3,
  VocabularyMode.CEEC_4,
  VocabularyMode.CEEC_5,
  VocabularyMode.CEEC_6,
  VocabularyMode.PROGRESSIVE,
  VocabularyMode.MIXED,
]);

const FIXED_LEVELS: Readonly<Partial<Record<VocabularyMode, VocabularyLevel>>> = Object.freeze({
  [VocabularyMode.CEEC_1]: 1,
  [VocabularyMode.CEEC_2]: 2,
  [VocabularyMode.CEEC_3]: 3,
  [VocabularyMode.CEEC_4]: 4,
  [VocabularyMode.CEEC_5]: 5,
  [VocabularyMode.CEEC_6]: 6,
});

export function fixedLevelForMode(mode: VocabularyMode): VocabularyLevel | null {
  return FIXED_LEVELS[mode] ?? null;
}

export function vocabularyModeLabel(mode: VocabularyMode): string {
  const fixedLevel = fixedLevelForMode(mode);
  if (fixedLevel) return `CEEC 第 ${fixedLevel} 級`;
  if (mode === VocabularyMode.PROGRESSIVE) return "逐關進階";
  return "CEEC 1–6 級混合";
}
