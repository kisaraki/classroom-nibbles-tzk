# NIBBLES Phase 0 Handoff

Phase 0 is complete and this folder is designed to be copied/unzipped into the repository root before Codex starts Phase 1.

## Phase 0 outputs

- `docs/reference/ceec-vocabulary-level1-6.pdf` — supplied source reference.
- `data/source/ceec-vocabulary-source.json` — parsed source rows preserving raw text and page/column provenance.
- `public/data/vocabulary.json` — normalized runtime dataset.
- `public/data/vocabulary-import-report.json` — counts, duplicate groups and review queue.
- `tools/*.ts` — importer, validator, normalizer and types.
- `SPEC.md`, `AGENTS.md` — project/agent rules.
- `PHASE-01-CODEX.md` — direct Phase 1 execution instructions.

## Source provenance

Source SHA-256: `b5bf019ec34e6e7e4b121ae865abc9771f205df1fcc08fd8aa1c0c89128c3953`

The PDF labels each CEEC level as **1,080 words**. The machine-extracted source-row count is intentionally reported separately because slash variants, abbreviations, multiple senses and inline synonym annotations make “PDF rows” different from “declared words.” No web dictionary correction was applied.

## Phase 0 generated summary

```json
{
  "parsedSourceRows": 6418,
  "normalizedPlayableEntries": 6569,
  "eligibleEntries": 6569,
  "needsReviewEntries": 113,
  "uniqueTargetsAcrossAllLevels": 6534,
  "duplicateTargetGroupsWithinLevel": 35
}
```

Per-level details are in `public/data/vocabulary-import-report.json`.

## Starting Codex

Place all files at the project root, then instruct Codex: **Read `AGENTS.md`, `SPEC.md`, and `PHASE-01-CODEX.md`, then execute Phase 1 only.**
