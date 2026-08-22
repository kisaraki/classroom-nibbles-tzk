export const CEEC_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type VocabularyLevel = (typeof CEEC_LEVELS)[number];

export const CHARACTER_TOKENS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "SPACE", "PERIOD", "APOSTROPHE", "HYPHEN",
] as const;

export type CharacterToken = (typeof CHARACTER_TOKENS)[number];

export interface VocabularyEntry {
  readonly id: string;
  readonly sourceEntryId: string;
  readonly sourceLevel: VocabularyLevel;
  readonly sourceHeadword: string;
  readonly target: string;
  readonly displayTarget: string;
  readonly meaningZh: string;
  readonly partOfSpeech: string | null;
  readonly pronunciation: string | null;
  readonly tokens: readonly CharacterToken[];
  readonly tokenLength: number;
  readonly variants: readonly string[];
  readonly tags: readonly string[];
  readonly eligible: boolean;
  readonly needsReview: boolean;
  readonly reviewReasons: readonly string[];
  readonly normalizationNotes: readonly string[];
}

export interface VocabularyDocument {
  readonly dataset: string;
  readonly schemaVersion: number;
  readonly dataVersion: string;
  readonly generatedOn: string;
  readonly sourceSha256: string;
  readonly supportedGameplayCharacters: readonly string[];
  readonly entries: readonly VocabularyEntry[];
}

export interface VocabularyLevelCount {
  readonly total: number;
  readonly eligible: number;
}

export type VocabularyLevelCounts = Readonly<
  Record<VocabularyLevel, VocabularyLevelCount>
>;

export interface VocabularyMetadata {
  readonly dataset: string;
  readonly schemaVersion: number;
  readonly dataVersion: string;
  readonly generatedOn: string;
  readonly sourceSha256: string;
  readonly supportedGameplayCharacters: readonly string[];
  readonly totalEntries: number;
  readonly eligibleEntries: number;
  readonly levels: VocabularyLevelCounts;
}

export interface EligibleEntryFilter {
  readonly level?: VocabularyLevel;
  readonly maximumTokenLength?: number;
}
