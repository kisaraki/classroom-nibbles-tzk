# CHANGELOG

## Phase 1 — 2026-08-22

### Added
- Vanilla Vite and TypeScript project scaffold with Three.js, Vitest, Playwright and `tsx`.
- Typed `VocabularyRepository` with runtime schema checks, metadata, counts, eligible-entry filtering and typed load errors.
- Responsive Phase 1 boot screen with a continuously rendered Three.js smoke scene and vocabulary status/counts.
- Vitest coverage for vocabulary schema, levels, tokens, token lengths, counts and malformed data.
- Playwright boot smoke test for the UI, vocabulary load and WebGL canvas.
- GitHub Actions workflows for CI, browser smoke testing and validated GitHub Pages deployment.
- Project setup, data workflow, test and deployment documentation.

### Changed
- Wired runtime vocabulary loading through the GitHub Pages-safe `import.meta.env.BASE_URL` path.
- Promoted Phase 0 package-script requirements into the root project package configuration.

### Fixed
- None.

### Known Issues
- Phase 0 source ambiguities remain intentionally preserved in the vocabulary import report for manual review.
- The Phase 1 scene is a technical smoke screen only; gameplay starts in Phase 2 or later as defined by the specification.

## Phase 0 — 2026-08-22

### Added
- CEEC Level 1–6 source PDF reference.
- Parsed source-row JSON with page/column provenance.
- Normalized runtime vocabulary JSON.
- Vocabulary import report and review queue.
- TypeScript vocabulary types, normalizer, importer and validator.
- `SPEC.md`, `AGENTS.md`, and Phase 1 Codex handoff instructions.

### Changed
- Vocabulary and game level are explicitly independent.
- Gameplay token set is A–Z plus SPACE, PERIOD, APOSTROPHE and HYPHEN.

### Known Issues
- The source PDF mixes slash variants, multiple senses and inline synonym annotations; therefore parsed source-row counts are not identical to the source heading’s 1,080-words label.
- Entries requiring manual audit are preserved and listed in `public/data/vocabulary-import-report.json`.
