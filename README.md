# NIBBLES

NIBBLES is a desktop-web, first-person 3D cockpit vocabulary game based on classic snake mechanics. The project uses vanilla TypeScript, Three.js, and Vite, with CEEC Level 1–6 vocabulary prepared during Phase 0.

## Current status

Phase 4 is complete. The browser supports the full vocabulary hunt plus a Traditional Chinese 30-second typing reinforcement modal. Every word now advances only after three consecutive correct submissions; an error resets the streak, while timeout returns only the final token and adds five seconds to the scene timer.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- A WebGL-capable desktop browser

## Setup and development

```bash
npm install
npm run dev
```

Vite prints the local development URL. Choose a vocabulary mode and deterministic seed, then start the interactive Phase 4 vocabulary run.

## Phase 4 gameplay and controls

- Choose CEEC Level 1–6, Progressive, or Mixed 1–6 independently from the Game Level.
- A seed creates a reproducible five-scene × five-word run without repeated ids or targets.
- Steer with `WASD` or the arrow keys.
- Rapid double-corner input cannot fold the head back into the snake: a U-shaped second turn is accepted only after moving at least one 0.75-unit segment spacing. Recovery still permits one stationary escape turn.
- Collect the outlined/pulsing next token shown in the target sequence.
- A correct token advances progress and shortens the snake by one segment, with a minimum length of 3.
- A wrong token lengthens the snake by one segment, with a maximum length of 40, stuns for one second, then respawns.
- All 30 gameplay token types—A–Z, SPACE, PERIOD, APOSTROPHE, and HYPHEN—exist at the start of every word.
- Red east/west walls are `SOLID`; blue north/south gates are `WRAP`.
- Wall and self collisions retain the Phase 2 non-lethal stun/recovery behavior.

Completing the final token pauses movement and the main timer in `TYPING_TEST` and opens the typing reinforcement modal:

- The typing timer is 30 seconds of real time and continues while the page is hidden.
- Type the target and press `Enter` or the submit button. Leading/trailing whitespace and letter case are ignored; internal spaces, periods, apostrophes and hyphens must match.
- Three consecutive correct submissions complete the word. Any error resets the streak to zero.
- Timeout returns to hunting with only the final token rolled back and five seconds added to the main timer.
- Copy, cut and paste are blocked only inside the typing modal; normal browser clipboard behavior remains available elsewhere.

The isometric camera and diagnostic HUD remain development presentation until the cockpit/HUD phase.

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
- Phase 3 tests cover deterministic run selection, Progressive mapping, filter relaxation, spawn constraints/fallback, token-pool normalization, ordered progress, repeated tokens, wrong-token respawn, length rewards/penalties and timer pausing.
- Phase 4 tests cover answer normalization, exact internal punctuation/spacing, consecutive-success streaks, real-time timeout, final-token rollback and the five-second timer bonus.
- Playwright checks vocabulary selection, independent Game/Vocabulary labels, the 30-token scene, non-color target cue, steering rules, typing-modal submission and modal-scoped clipboard blocking.
- `.github/workflows/ci.yml` runs quality gates on pushes and pull requests, with E2E isolated in its own job.
- `.github/workflows/deploy-pages.yml` validates and builds `dist/` before deploying it through official GitHub Pages actions on `main`.

## Directory overview

```text
src/core/          Boot coordination, state machine, fixed-step loop, and configuration
src/gameplay/      Three.js-independent snake, trail, arena, collision, and simulation logic
src/input/         Keyboard-to-direction input adapter
src/rendering/     Three.js arena, instanced snake, and token-sprite presentation
src/ui/            Boot/error UI, vocabulary selection, gameplay telemetry, and typing modal
src/vocabulary/    Runtime repository, modes, deterministic WordSelector, and tests
e2e/               Playwright smoke test
public/data/       Runtime vocabulary dataset and Phase 0 audit report
data/source/       Parsed source rows retained from Phase 0
tools/             Vocabulary importer, normalizer, validator, and shared tool types
docs/reference/    Source CEEC PDF (reference only)
.github/workflows/ CI and GitHub Pages deployment
```

See `SPEC.md` for the full product contract. Phase 5 has not started.
