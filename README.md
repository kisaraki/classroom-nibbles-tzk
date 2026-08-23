# NIBBLES

NIBBLES is a desktop-web, first-person 3D cockpit vocabulary game based on classic snake mechanics. The project uses vanilla TypeScript, Three.js, and Vite, with CEEC Level 1–6 vocabulary prepared during Phase 0.

## Current status

Phase 9 and the Version 1.0 release are complete. The full five-scene vocabulary loop now has production failure/replay exits, Traditional Chinese accessibility coverage, deterministic state-machine regression tests, a batched token renderer, dynamic render-resolution budgeting, release-asset verification, and automated GitHub Pages gates while preserving every Phase 8 gameplay rule.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- A WebGL-capable desktop browser

## Setup and development

```bash
npm install
npm run dev
```

Vite prints the local development URL. Choose a vocabulary mode and deterministic seed, then start the Version 1.0 vocabulary run.

## Version 1.0 gameplay and controls

- Choose CEEC Level 1–6, Progressive, or Mixed 1–6 independently from the Game Level.
- A seed creates a reproducible five-scene × five-word run without repeated ids or targets.
- Steer with `WASD` or the arrow keys.
- Rapid double-corner input cannot fold the head back into the snake: a U-shaped second turn is accepted only after moving at least one 0.75-unit segment spacing. Recovery still permits one stationary escape turn.
- Collect the outlined/pulsing next token shown in the target sequence.
- A correct token advances progress and shortens the snake by one segment, with a minimum length of 3.
- A wrong token lengthens the snake by one segment, with a maximum length of 40, stuns for one second, then respawns.
- All 30 gameplay token types—A–Z, SPACE, PERIOD, APOSTROPHE, and HYPHEN—exist at the start of every word.
- One each of +10, +5, −10, −5 and ATTACK always exists. Numeric power-ups adjust the scene main timer by the displayed seconds; a negative adjustment reaching zero uses the normal level-failed flow.
- ATTACK adds five cumulative rounds. Press `Space` while hunting to fire one round in the current heading; firing is disabled during stun, recovery and typing.
- A bullet repositions a hit token or power-up without collecting or activating it. Solid walls and environment obstacles destroy bullets, and otherwise unspent bullets expire after four seconds.
- Red east/west walls are `SOLID`; blue north/south gates are `WRAP`.
- Wall, environment-obstacle and self collisions retain the Phase 2 non-lethal stun/recovery behavior.
- The single snake-eye camera follows the snake's heading with a short visual smoothing transition; the cockpit mask and reticle stay fixed around the view.
- The lower-left mini-map shows SOLID/WRAP boundaries, all tokens and power-ups, active bullets, environment obstacles, the snake head and the complete snake trail.
- Click the mini-map or press `M` to open the enlarged tactical map. Gameplay, collection, firing and the main timer continue at 0.25 speed; press `Esc` or `M` to close it.
- Press `P` during normal gameplay to pause through a closing cockpit-door transition. Press `P` again to resume after the door opens; the exact prior hunting, stun, recovery, or tactical-map state is restored.
- Leaving or hiding the page automatically pauses normal gameplay and requires `P` to resume. `P` never pauses the typing test, whose timer continues in real time while hidden.
- If a scene's main timer reaches zero, a Chinese mission report returns the player to mission settings. This is a time-limit failure only; collisions remain non-lethal delay penalties.
- Use the Chinese `音效：開／關` control to persist the sound preference. Audio is synthesized with native Web Audio and gracefully falls back to silent play if audio is unavailable.
- Scene changes use closed-door mission cards. Completing all 25 words opens the KOSMOS TOOLKITS 探真拓知酷 credits and a return-to-mission-settings action.
- The token pool is rendered as one texture-atlas mesh, and the internal render resolution scales to a 800×450-pixel budget while retaining the full CSS viewport and cockpit layout.

Completing the final token pauses movement and the main timer in `TYPING_TEST` and opens the typing reinforcement modal:

- The typing timer is 30 seconds of real time and continues while the page is hidden.
- Type the target and press `Enter` or the submit button. Leading/trailing whitespace and letter case are ignored; internal spaces, periods, apostrophes and hyphens must match.
- Three consecutive correct submissions complete the word. Any error resets the streak to zero.
- Timeout returns to hunting with only the final token rolled back and five seconds added to the main timer.
- Copy, cut and paste are blocked only inside the typing modal; normal browser clipboard behavior remains available elsewhere.

Each Game Level has its own environment profile:

- Game Level 1 — Cargo Bay: cargo containers form solid cover.
- Game Level 2 — Ship Pipeline: paired pipe columns form long travel lanes.
- Game Level 3 — Asteroid Belt: irregular solid asteroids interrupt direct routes.
- Game Level 4 — Dense Atmosphere: pressure pylons and short-range fog reduce visibility.
- Game Level 5 — Alien Forest: dense tree trunks create winding routes.

Scene changes preserve earned snake length and cumulative ammo, reset the snake to a safe central pose, clear active bullets and seed all tokens/power-ups outside the new solid geometry.

## Quality and build commands

```bash
npm run typecheck
npm run validate:vocabulary
npm run test
npm run build
npm run verify:release
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
- Phase 5 tests cover persistent mutually spaced power-ups, signed timer effects, cumulative ammo, firing restrictions, projectile motion, WRAP travel, solid-wall removal and non-activating shot repositioning.
- Phase 6 tests cover the snake-eye camera rig, smoothed cardinal turns, tactical-map state/input, 0.25 time scaling and continued gameplay while the enlarged map is open.
- Phase 7 tests cover all five environment profiles, obstacle-safe arena capacity, level switching, safe pose reset, non-lethal obstacle collision and projectile blocking.
- Phase 8 tests cover synthesized cue/ambient definitions, mute persistence, token/power-up/impact event routing, exact-state pause/resume, hidden-page auto-pause, door transitions and credits/replay presentation.
- Phase 9 tests cover successful and failed state-machine exits, the Chinese failure dialog and focus, release metadata, unique IDs, accessible names, asset/network errors, draw-call and render-resolution budgets, and the 30 FPS minimum at 1920×1080.
- Playwright also checks vocabulary selection, independent Game/Vocabulary labels, the Cargo Bay environment and obstacle markers, the 30-token and five-power-up scene, cockpit and complete-trail mini-map, steering/firing rules, tactical-map controls, continued quarter-speed movement, typing-modal submission and modal-scoped clipboard blocking.
- `.github/workflows/ci.yml` runs typecheck, vocabulary validation, unit tests, production build, artifact verification and isolated Chromium E2E jobs on pushes and pull requests.
- `.github/workflows/deploy-pages.yml` repeats the release gates before deploying `dist/` through official GitHub Pages actions on `main`.

## Directory overview

```text
src/audio/         Native Web Audio cues, ambient soundscapes, and mute preference
src/core/          Boot coordination, state machine, fixed-step loop, pause, and configuration
src/gameplay/      Snake, arena, five environment profiles, collision, spawning, and simulation
src/input/         Keyboard direction, weapon, and tactical-map input adapters
src/rendering/     Three.js arena/environment/entity views plus the snake-eye camera rig
src/ui/            Chinese screens, cockpit HUD, radar/tactical map, and typing modal
src/vocabulary/    Runtime repository, modes, deterministic WordSelector, and tests
e2e/               Playwright smoke test
public/data/       Runtime vocabulary dataset and Phase 0 audit report
data/source/       Parsed source rows retained from Phase 0
tools/             Vocabulary import/validation tools and the production release verifier
docs/reference/    Source CEEC PDF (reference only)
.github/workflows/ CI and GitHub Pages deployment
```

See `SPEC.md` for the full product contract. Phase 9 is complete and NIBBLES Version 1.0 is release-ready.
