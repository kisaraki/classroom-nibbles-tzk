export type VocabularyLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type CharacterToken =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J"
  | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T"
  | "U" | "V" | "W" | "X" | "Y" | "Z"
  | "SPACE" | "PERIOD" | "APOSTROPHE" | "HYPHEN";

export interface VocabularySourceEntry {
  sourceEntryId: string;
  sourceLevel: VocabularyLevel;
  sourceOrder: number;
  page: number;
  column: "left" | "right";
  parseKind: "inline" | "split" | "nopron";
  headwordRaw: string;
  pronunciationRaw: string;
  partOfSpeechRaw: string;
  meaningZhRaw: string;
  sourceText: string;
}

export interface VocabularyEntry {
  id: string;
  sourceEntryId: string;
  sourceLevel: VocabularyLevel;
  sourceHeadword: string;
  target: string;
  displayTarget: string;
  meaningZh: string;
  partOfSpeech: string | null;
  pronunciation: string | null;
  tokens: CharacterToken[];
  tokenLength: number;
  variants: string[];
  tags: string[];
  eligible: boolean;
  needsReview: boolean;
  reviewReasons: string[];
  normalizationNotes: string[];
}

export interface VocabularySourceDocument {
  schemaVersion: 1;
  dataset: string;
  source: Record<string, unknown>;
  entries: VocabularySourceEntry[];
}

export interface VocabularyDocument {
  dataset: string;
  schemaVersion: 1;
  dataVersion: string;
  generatedOn: string;
  sourceSha256: string;
  supportedGameplayCharacters: string[];
  entries: VocabularyEntry[];
}
