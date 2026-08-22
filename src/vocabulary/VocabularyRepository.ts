import {
  CEEC_LEVELS,
  CHARACTER_TOKENS,
  type CharacterToken,
  type EligibleEntryFilter,
  type VocabularyDocument,
  type VocabularyEntry,
  type VocabularyLevel,
  type VocabularyLevelCount,
  type VocabularyLevelCounts,
  type VocabularyMetadata,
} from "./types";

export type VocabularyRepositoryErrorCode =
  | "FETCH_FAILED"
  | "HTTP_ERROR"
  | "PARSE_FAILED"
  | "INVALID_DATA";

export class VocabularyRepositoryError extends Error {
  readonly code: VocabularyRepositoryErrorCode;

  constructor(
    code: VocabularyRepositoryErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "VocabularyRepositoryError";
    this.code = code;
  }
}

export type VocabularyFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const VALID_LEVELS = new Set<number>(CEEC_LEVELS);
const VALID_TOKENS = new Set<string>(CHARACTER_TOKENS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw invalidData(`${path}.${key} must be a string.`);
  }
  return value;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
  path: string,
): string | null {
  const value = record[key];
  if (value !== null && typeof value !== "string") {
    throw invalidData(`${path}.${key} must be a string or null.`);
  }
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string, path: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw invalidData(`${path}.${key} must be a boolean.`);
  }
  return value;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
): readonly string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw invalidData(`${path}.${key} must be an array of strings.`);
  }
  return Object.freeze([...value]);
}

function invalidData(message: string): VocabularyRepositoryError {
  return new VocabularyRepositoryError("INVALID_DATA", `Invalid vocabulary data: ${message}`);
}

function parseLevel(value: unknown, path: string): VocabularyLevel {
  if (typeof value !== "number" || !VALID_LEVELS.has(value)) {
    throw invalidData(`${path} must be an integer from 1 to 6.`);
  }
  return value as VocabularyLevel;
}

function parseTokens(value: unknown, path: string): readonly CharacterToken[] {
  if (!Array.isArray(value) || !value.every((token) => typeof token === "string")) {
    throw invalidData(`${path} must be an array of character tokens.`);
  }
  for (const token of value) {
    if (!VALID_TOKENS.has(token)) {
      throw invalidData(`${path} contains unsupported token ${token}.`);
    }
  }
  return Object.freeze([...value] as CharacterToken[]);
}

function parseEntry(value: unknown, index: number): VocabularyEntry {
  const path = `entries[${index}]`;
  if (!isRecord(value)) {
    throw invalidData(`${path} must be an object.`);
  }

  const tokens = parseTokens(value.tokens, `${path}.tokens`);
  const tokenLength = value.tokenLength;
  if (!Number.isInteger(tokenLength) || tokenLength !== tokens.length) {
    throw invalidData(`${path}.tokenLength must equal tokens.length.`);
  }

  return Object.freeze({
    id: readString(value, "id", path),
    sourceEntryId: readString(value, "sourceEntryId", path),
    sourceLevel: parseLevel(value.sourceLevel, `${path}.sourceLevel`),
    sourceHeadword: readString(value, "sourceHeadword", path),
    target: readString(value, "target", path),
    displayTarget: readString(value, "displayTarget", path),
    meaningZh: readString(value, "meaningZh", path),
    partOfSpeech: readNullableString(value, "partOfSpeech", path),
    pronunciation: readNullableString(value, "pronunciation", path),
    tokens,
    tokenLength,
    variants: readStringArray(value, "variants", path),
    tags: readStringArray(value, "tags", path),
    eligible: readBoolean(value, "eligible", path),
    needsReview: readBoolean(value, "needsReview", path),
    reviewReasons: readStringArray(value, "reviewReasons", path),
    normalizationNotes: readStringArray(value, "normalizationNotes", path),
  });
}

export function parseVocabularyDocument(value: unknown): VocabularyDocument {
  if (!isRecord(value)) {
    throw invalidData("the top level must be an object.");
  }
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion !== 1) {
    throw invalidData("schemaVersion must be 1.");
  }
  if (typeof value.dataVersion !== "string" || value.dataVersion.length === 0) {
    throw invalidData("dataVersion must be a non-empty string.");
  }
  if (!Array.isArray(value.entries)) {
    throw invalidData("entries must be an array.");
  }

  return Object.freeze({
    dataset: readString(value, "dataset", "document"),
    schemaVersion: value.schemaVersion,
    dataVersion: value.dataVersion,
    generatedOn: readString(value, "generatedOn", "document"),
    sourceSha256: readString(value, "sourceSha256", "document"),
    supportedGameplayCharacters: readStringArray(
      value,
      "supportedGameplayCharacters",
      "document",
    ),
    entries: Object.freeze(value.entries.map(parseEntry)),
  });
}

function calculateLevelCounts(entries: readonly VocabularyEntry[]): VocabularyLevelCounts {
  const pairs = CEEC_LEVELS.map((level) => {
    const levelEntries = entries.filter((entry) => entry.sourceLevel === level);
    const count: VocabularyLevelCount = Object.freeze({
      total: levelEntries.length,
      eligible: levelEntries.filter((entry) => entry.eligible).length,
    });
    return [level, count] as const;
  });

  return Object.freeze(Object.fromEntries(pairs)) as VocabularyLevelCounts;
}

export class VocabularyRepository {
  readonly #document: VocabularyDocument;
  readonly #eligibleEntries: readonly VocabularyEntry[];
  readonly #metadata: VocabularyMetadata;

  private constructor(document: VocabularyDocument) {
    this.#document = document;
    this.#eligibleEntries = Object.freeze(
      document.entries.filter((entry) => entry.eligible),
    );
    this.#metadata = Object.freeze({
      dataset: document.dataset,
      schemaVersion: document.schemaVersion,
      dataVersion: document.dataVersion,
      generatedOn: document.generatedOn,
      sourceSha256: document.sourceSha256,
      supportedGameplayCharacters: document.supportedGameplayCharacters,
      totalEntries: document.entries.length,
      eligibleEntries: this.#eligibleEntries.length,
      levels: calculateLevelCounts(document.entries),
    });
  }

  static from(value: unknown): VocabularyRepository {
    return new VocabularyRepository(parseVocabularyDocument(value));
  }

  static async load(
    url: string | URL,
    fetcher: VocabularyFetch = fetch,
  ): Promise<VocabularyRepository> {
    let response: Response;
    try {
      response = await fetcher(url);
    } catch (cause) {
      throw new VocabularyRepositoryError(
        "FETCH_FAILED",
        `Unable to fetch vocabulary data from ${url.toString()}.`,
        { cause },
      );
    }

    if (!response.ok) {
      throw new VocabularyRepositoryError(
        "HTTP_ERROR",
        `Vocabulary request failed with HTTP ${response.status} ${response.statusText}.`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(await response.text());
    } catch (cause) {
      throw new VocabularyRepositoryError(
        "PARSE_FAILED",
        "Vocabulary response is not valid JSON.",
        { cause },
      );
    }

    return VocabularyRepository.from(parsed);
  }

  get metadata(): VocabularyMetadata {
    return this.#metadata;
  }

  get entries(): readonly VocabularyEntry[] {
    return this.#document.entries;
  }

  get eligibleEntries(): readonly VocabularyEntry[] {
    return this.#eligibleEntries;
  }

  getEligibleEntries(filter: EligibleEntryFilter = {}): readonly VocabularyEntry[] {
    const { level, maximumTokenLength } = filter;
    return this.#eligibleEntries.filter((entry) => {
      if (level !== undefined && entry.sourceLevel !== level) return false;
      if (maximumTokenLength !== undefined && entry.tokenLength > maximumTokenLength) {
        return false;
      }
      return true;
    });
  }
}
