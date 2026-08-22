import type { CharacterToken, VocabularyEntry, VocabularySourceEntry } from "./vocabulary-types";

const SUPPORTED_TARGET = /^[A-Z .'-]+$/;

export function normalizePunctuation(value: string): string {
  return value
    .replace(/[’‘ʼ`]/g, "'")
    .replace(/[‐‑–—]/g, "-");
}

function repairExtractionSpacing(value: string): { value: string; repaired: boolean } {
  const parts = value.trim().split(/\s+/);
  const alphaParts = parts.map((part) => part.replace(/[^A-Za-z]/g, ""));
  const singles = alphaParts.filter((part) => part.length === 1).length;
  if (!value.includes("/") && parts.length >= 3 && singles >= 2 && alphaParts.every(Boolean)) {
    return { value: parts.join(""), repaired: true };
  }
  return { value, repaired: false };
}

export function expandHeadword(headwordRaw: string): { variants: string[]; notes: string[] } {
  const notes = new Set<string>();
  let value = normalizePunctuation(headwordRaw).trim();

  if (/\(\d+\)/.test(value)) {
    value = value.replace(/\s*\(\d+\)\s*/g, " ");
    notes.add("removed_parenthesized_sense_number");
  }
  if (/\d+$/.test(value)) {
    value = value.replace(/\d+$/, "");
    notes.add("removed_trailing_sense_number");
  }
  if (/(?<=[A-Za-z])\s+\([A-Za-z]+\)$/.test(value)) {
    value = value.replace(/(?<=[A-Za-z])\s+\(([A-Za-z]+)\)$/, "($1)");
    notes.add("normalized_spaced_parenthetical_suffix");
  }

  const repaired = repairExtractionSpacing(value);
  value = repaired.value;
  if (repaired.repaired) notes.add("auto_repaired_extraction_spacing");

  const slashParts = value.split("/").map((part) => part.trim()).filter(Boolean);
  if (slashParts.length > 1) notes.add("expanded_slash_variants");

  const variants: string[] = [];
  for (let part of slashParts.length ? slashParts : [value]) {
    part = part.replace(/^\(([A-Za-z]+)\)\s+/, "$1 ");
    const suffixMatch = part.match(/^(.*?[A-Za-z])\(([A-Za-z]+)\)$/);
    if (suffixMatch) {
      variants.push(suffixMatch[1].trim(), `${suffixMatch[1]}${suffixMatch[2]}`.trim());
      notes.add("expanded_parenthetical_suffix");
      continue;
    }
    if (/\([A-Za-z]+\)/.test(part)) {
      part = part.replace(/\(([A-Za-z]+)\)/g, "$1");
      notes.add("flattened_parenthetical_text");
    }
    variants.push(part.trim());
  }

  return {
    variants: [...new Set(variants.map((item) => normalizePunctuation(item).replace(/\s+/g, " ").trim().toUpperCase()).filter(Boolean))],
    notes: [...notes].sort(),
  };
}

export function tokenize(target: string): { tokens: CharacterToken[]; unsupported: string[] } {
  const tokens: CharacterToken[] = [];
  const unsupported: string[] = [];
  for (const char of target) {
    if (/^[A-Z]$/.test(char)) tokens.push(char as CharacterToken);
    else if (char === " ") tokens.push("SPACE");
    else if (char === ".") tokens.push("PERIOD");
    else if (char === "'") tokens.push("APOSTROPHE");
    else if (char === "-") tokens.push("HYPHEN");
    else unsupported.push(char);
  }
  return { tokens, unsupported };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "entry";
}

export function normalizeSourceEntry(source: VocabularySourceEntry): VocabularyEntry[] {
  const { variants, notes } = expandHeadword(source.headwordRaw);
  return variants.map((target, index) => {
    const { tokens, unsupported } = tokenize(target);
    const reviewReasons: string[] = [];
    if (source.parseKind !== "inline") reviewReasons.push(`source_parse_${source.parseKind}`);
    if (!source.pronunciationRaw) reviewReasons.push("missing_pronunciation_in_extraction");
    if (!source.meaningZhRaw) reviewReasons.push("missing_chinese_meaning_in_extraction");
    if (notes.includes("auto_repaired_extraction_spacing")) reviewReasons.push("auto_repaired_extraction_spacing");
    if (notes.includes("flattened_parenthetical_text")) reviewReasons.push("flattened_parenthetical_text");
    if (/\d/.test(source.headwordRaw)) reviewReasons.push("source_headword_contains_digit_or_sense_marker");
    if (unsupported.length) reviewReasons.push("unsupported_gameplay_character");

    const eligible = SUPPORTED_TARGET.test(target) && /[A-Z]/.test(target) && unsupported.length === 0;
    return {
      id: `ceec-l${source.sourceLevel}-${String(source.sourceOrder).padStart(4, "0")}-v${index + 1}-${slug(target)}`,
      sourceEntryId: source.sourceEntryId,
      sourceLevel: source.sourceLevel,
      sourceHeadword: source.headwordRaw,
      target,
      displayTarget: target,
      meaningZh: source.meaningZhRaw,
      partOfSpeech: source.partOfSpeechRaw || null,
      pronunciation: source.pronunciationRaw || null,
      tokens,
      tokenLength: tokens.length,
      variants,
      tags: [],
      eligible,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      normalizationNotes: notes,
    };
  });
}
