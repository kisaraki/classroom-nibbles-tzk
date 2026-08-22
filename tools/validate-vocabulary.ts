import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CharacterToken, VocabularyDocument } from "./vocabulary-types";

const root = resolve(import.meta.dirname, "..");
const path = resolve(root, "public/data/vocabulary.json");
const doc = JSON.parse(await readFile(path, "utf8")) as VocabularyDocument;

const validLevels = new Set([1, 2, 3, 4, 5, 6]);
const validSpecial = new Set<CharacterToken>(["SPACE", "PERIOD", "APOSTROPHE", "HYPHEN"]);
const errors: string[] = [];
const warnings: string[] = [];
const ids = new Set<string>();

if (doc.schemaVersion !== 1) errors.push(`Unsupported schemaVersion: ${doc.schemaVersion}`);
if (!Array.isArray(doc.entries) || doc.entries.length === 0) errors.push("entries is empty");

for (const entry of doc.entries ?? []) {
  if (!entry.id) errors.push("Entry without id");
  if (ids.has(entry.id)) errors.push(`Duplicate id: ${entry.id}`);
  ids.add(entry.id);
  if (!validLevels.has(entry.sourceLevel)) errors.push(`${entry.id}: invalid sourceLevel`);
  if (!entry.target || !/[A-Z]/.test(entry.target)) errors.push(`${entry.id}: invalid target`);
  if (entry.tokenLength !== entry.tokens.length) errors.push(`${entry.id}: tokenLength mismatch`);
  for (const token of entry.tokens) {
    if (/^[A-Z]$/.test(token)) continue;
    if (!validSpecial.has(token)) errors.push(`${entry.id}: invalid token ${token}`);
  }
  if (!entry.meaningZh) warnings.push(`${entry.id}: missing Chinese meaning`);
  if (entry.needsReview) warnings.push(`${entry.id}: needsReview (${entry.reviewReasons.join(", ")})`);
}

for (const level of [1, 2, 3, 4, 5, 6]) {
  const entries = doc.entries.filter((entry) => entry.sourceLevel === level && entry.eligible);
  if (entries.length < 1000) errors.push(`CEEC Level ${level}: only ${entries.length} eligible entries (<1000)`);
}

if (warnings.length) {
  console.warn(`Vocabulary validation warnings: ${warnings.length}`);
  for (const warning of warnings.slice(0, 30)) console.warn(`  - ${warning}`);
  if (warnings.length > 30) console.warn(`  ... ${warnings.length - 30} more warnings; see vocabulary-import-report.json`);
}

if (errors.length) {
  console.error(`Vocabulary validation FAILED with ${errors.length} error(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Vocabulary validation OK: ${doc.entries.length} entries, ${ids.size} unique ids.`);
}
