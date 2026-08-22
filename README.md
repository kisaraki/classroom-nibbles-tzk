# NIBBLES

NIBBLES is a desktop-web, first-person 3D cockpit vocabulary game based on classic snake mechanics. The project uses vanilla TypeScript, Three.js, and Vite, with CEEC Level 1–6 vocabulary prepared during Phase 0.

## Current status

Phase 2 is complete. The browser now runs a test arena with continuous snake movement on the XZ plane, cardinal steering, recorded-trail body following, per-segment wrapping, SOLID wall collision, self collision, and the required non-lethal stun/recovery sequence. Vocabulary collection and spawning remain Phase 3 work.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- A WebGL-capable desktop browser

## Setup and development

```bash
npm install
npm run dev
```

Vite prints the local development URL. The Phase 2 movement lab loads the vocabulary metadata, then starts an interactive Three.js arena.

## Phase 2 controls and arena

- Steer with `WASD` or the arrow keys.
- Movement is continuous at 4.5 world units per second on the horizontal XZ plane.
- Direct 180-degree reversal is rejected.
- The red east/west walls are `SOLID`; a hit causes 1 second of `STUNNED` followed by 500 ms of stationary `RECOVERY`.
- The blue north/south gates are `WRAP`; the head and each body segment cross independently.
- Steering is disabled while stunned and enabled during recovery.
- Wall and self collisions are delay penalties, never death, and do not change snake length.

The isometric movement-lab camera and diagnostic panel are Phase 2 development presentation. The final cockpit HUD belongs to later phases.

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
- Vitest also covers fixed-step timing, cardinal movement, trail sampling, length limits, per-segment wrapping, SOLID walls, self collision, stun, and recovery.
- Playwright checks that the Phase 2 UI, metadata, and Three.js canvas load, accepts a legal turn, rejects a reversal, and reports a wall collision without changing length.
- `.github/workflows/ci.yml` runs quality gates on pushes and pull requests, with E2E isolated in its own job.
- `.github/workflows/deploy-pages.yml` validates and builds `dist/` before deploying it through official GitHub Pages actions on `main`.

## Directory overview

```text
src/core/          Boot coordination, state machine, fixed-step loop, and configuration
src/gameplay/      Three.js-independent snake, trail, arena, collision, and simulation logic
src/input/         Keyboard-to-direction input adapter
src/rendering/     Three.js arena and instanced snake presentation
src/ui/            Boot/error UI and Phase 2 diagnostic panel
src/vocabulary/    Typed runtime vocabulary repository and tests
e2e/               Playwright smoke test
public/data/       Runtime vocabulary dataset and Phase 0 audit report
data/source/       Parsed source rows retained from Phase 0
tools/             Vocabulary importer, normalizer, validator, and shared tool types
docs/reference/    Source CEEC PDF (reference only)
.github/workflows/ CI and GitHub Pages deployment
```

See `SPEC.md` for the full product contract. Phase 3 has not started.
