import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { parseVocabularyDocument } from "./VocabularyRepository";
import { VocabularyMode } from "./VocabularyMode";
import { WordSelector } from "./WordSelector";
import type { CharacterToken, VocabularyEntry, VocabularyLevel } from "./types";

let runtimeEntries: readonly VocabularyEntry[];

beforeAll(async () => {
  const path = new URL("../../public/data/vocabulary.json", import.meta.url);
  runtimeEntries = parseVocabularyDocument(JSON.parse(await readFile(path, "utf8"))).entries;
});

function targetForIndex(index: number, length: number): string {
  let value = index;
  let target = "";
  for (let position = 0; position < length; position += 1) {
    target += String.fromCharCode(65 + (value % 26));
    value = Math.floor(value / 26);
  }
  return target;
}

function fixtureEntry(index: number, length: number, level: VocabularyLevel = 1): VocabularyEntry {
  const target = targetForIndex(index, length);
  const tokens = Object.freeze([...target] as CharacterToken[]);
  return Object.freeze({
    id: `fixture-${index}`,
    sourceEntryId: `source-${index}`,
    sourceLevel: level,
    sourceHeadword: target,
    target,
    displayTarget: target,
    meaningZh: "測試",
    partOfSpeech: null,
    pronunciation: null,
    tokens,
    tokenLength: tokens.length,
    variants: Object.freeze([target]),
    tags: Object.freeze([]),
    eligible: true,
    needsReview: false,
    reviewReasons: Object.freeze([]),
    normalizationNotes: Object.freeze([]),
  });
}

describe("WordSelector", () => {
  it("creates a deterministic 75-word fixed-level run with progressive scene sizes", () => {
    const selector = new WordSelector(runtimeEntries);
    const first = selector.createRun(VocabularyMode.CEEC_2, "same-seed");
    const second = selector.createRun(VocabularyMode.CEEC_2, "same-seed");
    const targets = first.scenes.flatMap((scene) => scene.words.map((entry) => entry.target));

    expect(first.scenes).toHaveLength(5);
    expect(first.scenes.map((scene) => scene.words.length)).toEqual([
      5,
      10,
      15,
      20,
      25,
    ]);
    expect(new Set(targets).size).toBe(75);
    expect(first.scenes.flatMap((scene) => scene.words.map((entry) => entry.sourceLevel))).toEqual(
      Array.from({ length: 75 }, () => 2),
    );
    expect(second.scenes.flatMap((scene) => scene.words.map((entry) => entry.id))).toEqual(
      first.scenes.flatMap((scene) => scene.words.map((entry) => entry.id)),
    );
    expect(
      selector
        .createRun(VocabularyMode.CEEC_2, "different-seed")
        .scenes.flatMap((scene) => scene.words.map((entry) => entry.id)),
    ).not.toEqual(first.scenes.flatMap((scene) => scene.words.map((entry) => entry.id)));
  });

  it("applies game-level token-length limits", () => {
    const run = new WordSelector(runtimeEntries).createRun(
      VocabularyMode.CEEC_1,
      "length-limits",
    );

    expect(run.scenes[0]?.words.every((entry) => entry.tokenLength <= 5)).toBe(true);
    expect(run.scenes[1]?.words.every((entry) => entry.tokenLength <= 8)).toBe(true);
    expect(run.scenes[2]?.words.every((entry) => entry.tokenLength <= 10)).toBe(true);
  });

  it("uses the exact progressive CEEC mapping", () => {
    const run = new WordSelector(runtimeEntries).createRun(
      VocabularyMode.PROGRESSIVE,
      "progressive-map",
    );

    expect(run.scenes[0]?.words.every((entry) => entry.sourceLevel === 1)).toBe(true);
    expect(run.scenes[1]?.words.every((entry) => entry.sourceLevel === 2)).toBe(true);
    expect(run.scenes[2]?.words.every((entry) => entry.sourceLevel === 3)).toBe(true);
    expect(run.scenes[3]?.words.filter((entry) => entry.sourceLevel === 4)).toHaveLength(12);
    expect(run.scenes[3]?.words.filter((entry) => entry.sourceLevel === 5)).toHaveLength(8);
    expect(run.scenes[4]?.words.every((entry) => entry.sourceLevel === 6)).toBe(true);
  });

  it("allows all CEEC levels in mixed mode while preserving uniqueness", () => {
    const run = new WordSelector(runtimeEntries).createRun(VocabularyMode.MIXED, "mixed-run");
    const entries = run.scenes.flatMap((scene) => scene.words);

    expect(entries).toHaveLength(75);
    expect(new Set(entries.map((entry) => entry.target)).size).toBe(75);
    expect(entries.every((entry) => entry.sourceLevel >= 1 && entry.sourceLevel <= 6)).toBe(true);
  });

  it("relaxes recent history before increasing the token-length limit", () => {
    const entries = [
      ...Array.from({ length: 5 }, (_, index) => fixtureEntry(index, 5)),
      ...Array.from({ length: 100 }, (_, index) => fixtureEntry(index + 5, 6)),
    ];
    const recentTargets = entries.slice(0, 5).map((entry) => entry.target);
    const run = new WordSelector(entries).createRun(
      VocabularyMode.CEEC_1,
      "relax-order",
      recentTargets,
    );

    expect(run.scenes[0]?.words.every((entry) => entry.tokenLength === 5)).toBe(true);
  });
});
