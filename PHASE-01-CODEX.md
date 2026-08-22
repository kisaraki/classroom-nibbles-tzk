# PHASE-01-CODEX.md
## Direct execution brief for Codex — Phase 1: Project Scaffold

**Status:** Phase 0 vocabulary assets are already present.  
**Goal:** Create the runnable NIBBLES web project scaffold and prove the Phase 0 dataset can be loaded and validated.  
**Stop condition:** Finish Phase 1 only. Do **not** implement Phase 2 snake gameplay yet.

## 0. Mandatory preparation

Read `AGENTS.md`, `SPEC.md`, this file, `CHANGELOG.md`, and `public/data/vocabulary-import-report.json` before changing files. Preserve all Phase 0 files. Do not regenerate or “clean up” the vocabulary dataset unless validation exposes a concrete fatal problem.

## 1. Required stack

Create a vanilla Vite TypeScript project in the current repository root using:

- TypeScript
- Three.js
- Vite
- Vitest
- Playwright
- `tsx` for the Phase 0 TypeScript tools
- GitHub Actions for CI and GitHub Pages deployment

Do not add React, Vue, Angular, Unity, Electron, a backend or a database.

## 2. Preserve and wire Phase 0 files

These paths already exist and must remain usable:

```text
data/source/ceec-vocabulary-source.json
public/data/vocabulary.json
public/data/vocabulary-import-report.json
tools/vocabulary-types.ts
tools/vocabulary-normalizer.ts
tools/import-vocabulary.ts
tools/validate-vocabulary.ts
docs/reference/ceec-vocabulary-level1-6.pdf
```

Add package scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "import:vocabulary": "tsx tools/import-vocabulary.ts",
    "validate:vocabulary": "tsx tools/validate-vocabulary.ts"
  }
}
```

Exact package versions may be selected by Codex, but use mutually compatible current versions. Do not install `@types/three` unless the selected Three.js package actually requires it; modern Three.js normally ships its own typings.

## 3. Vite/GitHub Pages requirements

Create `vite.config.ts` with `base: "./"`. Runtime data loading must work from both local development and a GitHub repository subpath. Prefer:

```ts
const vocabularyUrl = `${import.meta.env.BASE_URL}data/vocabulary.json`;
```

Do not hard-code `/assets/...` or `/data/...` root URLs.

## 4. Minimal app structure

Create at least:

```text
src/
  main.ts
  styles/main.css
  core/
    Game.ts
    GameState.ts
    StateMachine.ts
    Config.ts
  vocabulary/
    VocabularyRepository.ts
    types.ts
  ui/
    BootScreen.ts
index.html
```

Phase 1 `Game.ts` is only a boot coordinator. Do not add snake/collision/weapon systems yet.

## 5. VocabularyRepository Phase 1 contract

Implement a small typed repository that loads `public/data/vocabulary.json` through fetch. It must:

- validate basic top-level shape (`schemaVersion`, `dataVersion`, `entries` array);
- expose dataset metadata;
- expose total and per-CEEC-level counts;
- provide an `eligibleEntries` view/filter;
- fail with a clear typed error/message if fetch or parse fails;
- not mutate the source dataset;
- not parse the PDF.

Use interfaces compatible with the Phase 0 JSON schema. Do not copy the entire JSON into TypeScript source.

## 6. Boot screen / Three.js smoke scene

The running app should show a deliberately simple Phase 1 boot screen. It must prove Three.js and vocabulary loading both work:

- initialize a Three.js renderer, scene, PerspectiveCamera and one simple lit primitive/mesh;
- resize correctly with the browser window;
- render continuously or through a minimal clean loop;
- overlay text such as `NIBBLES — PHASE 1`;
- show dataset `dataVersion`, total entries, eligible entries, and CEEC Level 1–6 counts after loading;
- show a clear non-crashing error panel if vocabulary loading fails.

This is a smoke scene only. Do not implement the cockpit, snake eyes or final visual style yet.

## 7. Tests required in Phase 1

Create Vitest tests covering at least:

1. Vocabulary schema fixture/load parsing.
2. CEEC levels are limited to 1–6.
3. Eligible entry tokens contain only `A-Z`, `SPACE`, `PERIOD`, `APOSTROPHE`, `HYPHEN`.
4. `tokenLength === tokens.length`.
5. Repository level-count calculation.
6. Repository rejects malformed top-level data.

Create a Playwright smoke test that starts the built/dev app and confirms:

- the page title/heading contains NIBBLES;
- the Phase 1 boot UI becomes visible;
- vocabulary metadata loads without the error panel;
- the canvas exists.

Do not write E2E tests for gameplay that does not exist yet.

## 8. GitHub Actions

Create CI workflow(s) that run on push and pull request:

```text
npm ci
npm run typecheck
npm run validate:vocabulary
npm run test
npm run build
```

Configure a GitHub Pages deployment workflow using the Vite `dist/` artifact. Use modern official Pages actions. Deployment should be gated on a successful build/validation path.

If Playwright browser installation is too expensive for every generic CI run, it may be placed in a separate E2E job, but the project must provide `npm run test:e2e` and documentation for running it.

## 9. README and changelog

Create/update `README.md` with:

- project overview;
- requirements;
- install/dev/build/test commands;
- vocabulary import/validation commands;
- GitHub Pages notes;
- current development phase;
- directory overview.

Update `CHANGELOG.md` under Phase 1 with Added / Changed / Fixed / Known Issues as appropriate.

## 10. Quality gates

Before declaring Phase 1 complete, run and fix until successful:

```bash
npm run typecheck
npm run validate:vocabulary
npm run test
npm run build
```

Then run, if the environment supports browser installation:

```bash
npm run test:e2e
```

If E2E cannot run because the environment lacks Playwright browser/system dependencies, do not fake success. Report the exact limitation while keeping the Playwright test/config in the repository.

## 11. Phase 1 acceptance criteria

Phase 1 is complete only when:

- Vite TypeScript app starts successfully;
- Three.js renders a smoke scene;
- Phase 0 vocabulary JSON loads through the correct GitHub Pages-safe URL;
- the boot UI shows vocabulary metadata/counts;
- vocabulary validation passes;
- unit tests pass;
- production build succeeds;
- GitHub Actions files are present and coherent;
- README/CHANGELOG are updated;
- no Phase 2 gameplay has been implemented.

## 12. Final Codex response

Stop after Phase 1. Report:

1. what was completed;
2. main files created/changed;
3. commands run and pass/fail results;
4. E2E status;
5. known issues;
6. explicitly state that Phase 2 has **not** been started.
