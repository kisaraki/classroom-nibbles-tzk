# NIBBLES

NIBBLES is a desktop-web, first-person 3D cockpit vocabulary game based on classic snake mechanics. The project uses vanilla TypeScript, Three.js, and Vite, with CEEC Level 1–6 vocabulary prepared during Phase 0.

## Current status

Phase 1 is complete: the repository has a runnable project scaffold, a Three.js smoke scene, a typed vocabulary repository, automated validation/tests, and GitHub Pages workflows. Snake movement and all gameplay systems belong to later phases and are not implemented yet.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- A WebGL-capable desktop browser

## Setup and development

```bash
npm install
npm run dev
```

Vite prints the local development URL. The Phase 1 screen should display a rotating Three.js primitive and the vocabulary dataset version/counts.

## Quality and build commands

```bash
npm run typecheck
npm run validate:vocabulary
npm run test
npm run build
npm run preview
```

Install Playwright's Chromium browser once, then run the smoke test:

```bash
npx playwright install chromium
npm run test:e2e
```

Use `npm run test:watch` during unit-test development.

## Vocabulary data

Runtime code fetches `public/data/vocabulary.json`; it never parses the source PDF. Vite's relative `base: "./"` and `import.meta.env.BASE_URL` keep the data URL safe when the site is served from a GitHub repository subpath.

Phase 0 import and validation commands are preserved:

```bash
npm run import:vocabulary
npm run validate:vocabulary
```

Only run the importer when intentionally changing vocabulary import logic or source data. Source ambiguities and review items remain documented in `public/data/vocabulary-import-report.json`.

## Tests and continuous integration

- Vitest covers runtime schema parsing, CEEC level/token invariants, token lengths, counts, and malformed data rejection.
- Playwright checks that the boot UI, metadata, and Three.js canvas load without a vocabulary error.
- `.github/workflows/ci.yml` runs quality gates on pushes and pull requests, with E2E isolated in its own job.
- `.github/workflows/deploy-pages.yml` validates and builds `dist/` before deploying it through official GitHub Pages actions on `main`.

## Directory overview

```text
src/core/          Phase 1 boot coordinator, state model, and configuration
src/ui/            Boot metadata/error overlay
src/vocabulary/    Typed runtime vocabulary repository and tests
e2e/               Playwright smoke test
public/data/       Runtime vocabulary dataset and Phase 0 audit report
data/source/       Parsed source rows retained from Phase 0
tools/             Vocabulary importer, normalizer, validator, and shared tool types
docs/reference/    Source CEEC PDF (reference only)
.github/workflows/ CI and GitHub Pages deployment
```

See `SPEC.md` for the full product contract and `PHASE-01-CODEX.md` for Phase 1 acceptance criteria.
