import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  parseVocabularyDocument,
  VocabularyRepository,
  VocabularyRepositoryError,
  type VocabularyFetch,
} from "./VocabularyRepository";
import { CEEC_LEVELS, CHARACTER_TOKENS } from "./types";

const specialTarget = "A B.C'D-E";
const specialTokens = [
  "A", "SPACE", "B", "PERIOD", "C", "APOSTROPHE", "D", "HYPHEN", "E",
];

function createEntry(
  id: string,
  sourceLevel: number,
  eligible = true,
  target = "WORD",
  tokens: string[] = ["W", "O", "R", "D"],
): Record<string, unknown> {
  return {
    id,
    sourceEntryId: `source-${id}`,
    sourceLevel,
    sourceHeadword: target,
    target,
    displayTarget: target,
    meaningZh: "測試",
    partOfSpeech: "n.",
    pronunciation: "wɝd",
    tokens,
    tokenLength: tokens.length,
    variants: [target],
    tags: [],
    eligible,
    needsReview: false,
    reviewReasons: [],
    normalizationNotes: [],
  };
}

function createFixture(): Record<string, unknown> {
  return {
    dataset: "CEEC test fixture",
    schemaVersion: 1,
    dataVersion: "test-1",
    generatedOn: "2026-08-22",
    sourceSha256: "fixture-sha",
    supportedGameplayCharacters: ["A-Z", "SPACE", "PERIOD", "APOSTROPHE", "HYPHEN"],
    entries: [
      createEntry("level-1-special", 1, true, specialTarget, specialTokens),
      createEntry("level-1-ineligible", 1, false),
      createEntry("level-6", 6),
    ],
  };
}

async function loadRuntimeDocument(): Promise<ReturnType<typeof parseVocabularyDocument>> {
  const path = new URL("../../public/data/vocabulary.json", import.meta.url);
  return parseVocabularyDocument(JSON.parse(await readFile(path, "utf8")));
}

describe("VocabularyRepository", () => {
  it("parses a schema-compatible vocabulary fixture", () => {
    const document = parseVocabularyDocument(createFixture());

    expect(document.schemaVersion).toBe(1);
    expect(document.dataVersion).toBe("test-1");
    expect(document.entries).toHaveLength(3);
    expect(document.entries[0]?.target).toBe(specialTarget);
  });

  it("limits CEEC source levels to 1–6", async () => {
    const runtimeDocument = await loadRuntimeDocument();
    expect(new Set(runtimeDocument.entries.map((entry) => entry.sourceLevel))).toEqual(
      new Set(CEEC_LEVELS),
    );

    const malformed = createFixture();
    malformed.entries = [createEntry("level-7", 7)];
    expect(() => parseVocabularyDocument(malformed)).toThrow(/integer from 1 to 6/);
  });

  it("uses only supported character tokens for eligible entries", async () => {
    const runtimeDocument = await loadRuntimeDocument();
    const supported = new Set<string>(CHARACTER_TOKENS);

    for (const entry of runtimeDocument.entries.filter((item) => item.eligible)) {
      expect(entry.tokens.every((token) => supported.has(token))).toBe(true);
    }
  });

  it("keeps tokenLength equal to tokens.length", async () => {
    const runtimeDocument = await loadRuntimeDocument();

    for (const entry of runtimeDocument.entries) {
      expect(entry.tokenLength).toBe(entry.tokens.length);
    }
  });

  it("calculates total, eligible, and per-level counts", async () => {
    const fixture = createFixture();
    const fetcher: VocabularyFetch = async () =>
      new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    const repository = await VocabularyRepository.load("/data/vocabulary.json", fetcher);

    expect(repository.metadata.totalEntries).toBe(3);
    expect(repository.metadata.eligibleEntries).toBe(2);
    expect(repository.metadata.levels[1]).toEqual({ total: 2, eligible: 1 });
    expect(repository.metadata.levels[6]).toEqual({ total: 1, eligible: 1 });
    expect(repository.getEligibleEntries({ level: 6 })).toHaveLength(1);
    expect(repository.getEligibleEntries({ maximumTokenLength: 4 })).toHaveLength(1);
  });

  it("rejects malformed top-level data with a typed error", async () => {
    const fetcher: VocabularyFetch = async () =>
      new Response(JSON.stringify({ schemaVersion: 1, dataVersion: "bad" }), { status: 200 });

    await expect(VocabularyRepository.load("/data/vocabulary.json", fetcher)).rejects.toMatchObject({
      name: "VocabularyRepositoryError",
      code: "INVALID_DATA",
    } satisfies Partial<VocabularyRepositoryError>);
  });
});
