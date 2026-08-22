import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { normalizeSourceEntry } from "./vocabulary-normalizer";
import type { VocabularyDocument, VocabularySourceDocument } from "./vocabulary-types";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "data/source/ceec-vocabulary-source.json");
const outputPath = resolve(root, "public/data/vocabulary.json");
const reportPath = resolve(root, "public/data/vocabulary-import-report.json");

const source = JSON.parse(await readFile(sourcePath, "utf8")) as VocabularySourceDocument;
const entries = source.entries.flatMap(normalizeSourceEntry);
const sourceBytes = await readFile(sourcePath);
const sourceJsonSha256 = createHash("sha256").update(sourceBytes).digest("hex");

const document: VocabularyDocument = {
  dataset: "CEEC Vocabulary Level 1-6",
  schemaVersion: 1,
  dataVersion: "1.0.0-phase0",
  generatedOn: new Date().toISOString().slice(0, 10),
  sourceSha256: String(source.source.sha256 ?? sourceJsonSha256),
  supportedGameplayCharacters: ["A-Z", "SPACE", "PERIOD", "APOSTROPHE", "HYPHEN"],
  entries,
};

const duplicateMap = new Map<string, string[]>();
for (const entry of entries) {
  const key = `${entry.sourceLevel}:${entry.target}`;
  const ids = duplicateMap.get(key) ?? [];
  ids.push(entry.id);
  duplicateMap.set(key, ids);
}
const duplicateTargets = [...duplicateMap.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([key, ids]) => {
    const [level, ...targetParts] = key.split(":");
    return { sourceLevel: Number(level), target: targetParts.join(":"), ids };
  });

const byLevel = Object.fromEntries([1, 2, 3, 4, 5, 6].map((level) => {
  const sourceRows = source.entries.filter((entry) => entry.sourceLevel === level);
  const normalized = entries.filter((entry) => entry.sourceLevel === level);
  return [String(level), {
    sourceHeadingWordCount: 1080,
    parsedSourceRows: sourceRows.length,
    normalizedPlayableEntries: normalized.length,
    eligibleEntries: normalized.filter((entry) => entry.eligible).length,
    needsReviewEntries: normalized.filter((entry) => entry.needsReview).length,
    uniqueTargets: new Set(normalized.map((entry) => entry.target)).size,
    duplicateTargetGroups: duplicateTargets.filter((item) => item.sourceLevel === level).length,
  }];
}));

const report = {
  schemaVersion: 1,
  dataVersion: document.dataVersion,
  generatedOn: document.generatedOn,
  source: source.source,
  summary: {
    parsedSourceRows: source.entries.length,
    normalizedPlayableEntries: entries.length,
    eligibleEntries: entries.filter((entry) => entry.eligible).length,
    needsReviewEntries: entries.filter((entry) => entry.needsReview).length,
    duplicateTargetGroupsWithinLevel: duplicateTargets.length,
  },
  byLevel,
  duplicateTargets,
  reviewQueue: entries.filter((entry) => entry.needsReview).map((entry) => ({
    id: entry.id,
    sourceEntryId: entry.sourceEntryId,
    sourceLevel: entry.sourceLevel,
    target: entry.target,
    reasons: entry.reviewReasons,
  })),
  notes: [
    "The source PDF labels each CEEC level as 1,080 words; parsed source rows differ because the PDF mixes variants, senses, and inline annotations.",
    "Runtime must use public/data/vocabulary.json and must not parse the PDF.",
  ],
};

await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} normalized vocabulary entries to ${outputPath}`);
console.log(`Wrote import report to ${reportPath}`);
