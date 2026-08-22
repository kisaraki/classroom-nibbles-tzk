# CHANGELOG

## Phase 4 — 2026-08-22

### Added
- Traditional Chinese typing reinforcement modal with target, Chinese meaning, real-time countdown, streak, feedback and auto-focused input.
- Thirty-second absolute-time `TypingTestSession` that remains accurate across animation pauses and hidden-tab intervals.
- Case-insensitive answer comparison after trimming leading/trailing whitespace while preserving exact internal spaces, periods, apostrophes and hyphens.
- Three-consecutive-success progression with immediate streak reset after every wrong submission.
- Enter-key/form submission and copy/cut/paste prevention scoped only to the typing modal.
- Typing-timeout recovery that rolls back only the final token, adds five seconds to the scene timer and resets the 20-second progress deadline.
- Unit and Chromium coverage for comparison, streaks, timeout, rollback, keyboard submission, focus and clipboard scope.

### Changed
- Advanced browser metadata and visible phase markers to Phase 4.
- Suspended movement input throughout `TYPING_TEST` and restored it only when gameplay returns to `HUNTING`.
- Completed the existing word/scene progression hook so a successful typing test continues the 25-word run through `GAME_CLEAR`.

### Fixed
- Typing time now uses an absolute `performance.now()` deadline instead of the fixed-step gameplay clock, so hiding the page cannot pause the test.

### Known Issues
- Power-ups, weapon and ammo remain intentionally unavailable until Phase 5.
- The current isometric scene and telemetry overlay remain temporary until the cockpit HUD and mini-map work in Phase 6.

## Phase 3 — 2026-08-22

### Added
- Traditional Chinese browser metadata, boot flow, vocabulary selection, HUD labels, state feedback, controls and accessibility text.
- A 20-second no-progress deadline that resets after every correct token, displays an urgent final-10-second countdown, and restarts the current Game Level on expiry without rerolling its vocabulary.
- Full level-restart restoration for scene time, first-word progress, snake position/direction/length and the 30-token pool.
- Independent vocabulary selection for CEEC Level 1–6, PROGRESSIVE and MIXED 1–6 modes.
- Seeded deterministic random source shared by word selection and spawning; gameplay call sites do not use `Math.random()`.
- Five-scene × five-word run planning with unique ids/targets, scene token-length limits and the specified Progressive mapping.
- Recent-target filtering with the required relaxation order: history first, then maximum token length one token at a time.
- Central SpawnManager with 100 bounded random attempts, deterministic fallback points, arena/body/entity exclusion and four-unit head clearance.
- Runtime token pool containing A–Z plus SPACE, PERIOD, APOSTROPHE and HYPHEN at each new word.
- Ordered token collection, repeated-token immediate respawn, correct shortening and wrong-token growth/stun/respawn.
- Scene main timer and Phase 3 handoff to `TYPING_TEST` after a word is fully collected.
- A Phase 4-facing success hook that advances words and scenes, resets each new scene timer, and reaches `GAME_CLEAR` after word 25.
- Three.js token sprites, pulsing target token, vocabulary selection screen and progress/meaning/level telemetry.
- Unit and E2E coverage for selection, spawning, pool normalization, token outcomes, no-progress restart behavior and the Traditional Chinese Phase 3 browser flow.

### Changed
- Advanced the boot flow through `VOCABULARY_SELECT` before entering `HUNTING`.
- Distinguished wrong-token stun from wall/self collision: wrong tokens return directly to hunting, while wall/self collisions retain RECOVERY.
- Updated the browser title, documentation and test expectations to Phase 3.

### Fixed
- Preserved timer pause and stationary movement at the Phase 4 typing-test boundary without implementing the typing test early.

### Known Issues
- Phase 3 stops after the first completed word because the required three-success typing reinforcement is Phase 4.
- The current isometric scene and telemetry overlay are temporary; the final cockpit HUD and mini-map belong to Phase 6.

## Phase 2 — 2026-08-22

### Added
- Continuous cardinal snake movement on the horizontal XZ plane at a fixed 1/60 simulation step.
- Recorded polyline trail sampling so body segments follow turns at 0.75-unit spacing rather than moving in grid jumps.
- Central snake configuration for initial/minimum/maximum length, speed, spacing and collision radii.
- Per-axis `SOLID` and `WRAP` arena boundaries with per-segment wrap presentation.
- Predictive SOLID wall and self-collision detection, including wrap-aware seam distance.
- Non-lethal 1-second `STUNNED` and 500 ms stationary `RECOVERY` state sequence; recovery allows steering.
- Keyboard steering through WASD and arrow keys with direct 180-degree reversal rejection.
- Instanced Three.js body rendering and an interactive Phase 2 movement-lab scene.
- Unit and E2E coverage for movement, trail behavior, wrapping, collisions, delay states and input rules.

### Changed
- Expanded the explicit main state transition map for Phase 2 collision states and future spec-defined states.
- Replaced the Phase 1 rotating-primitive smoke screen with a functional movement sandbox.
- Updated the development status, controls and architecture documentation for Phase 2.

### Fixed
- Removed the Phase 1-only scene loop in favor of a clamped fixed-step gameplay accumulator.

### Known Issues
- The Phase 2 isometric camera and diagnostic overlay are temporary development presentation; the cockpit HUD and mini-map belong to later phases.
- Vocabulary targets, token spawning and collection are intentionally not implemented until Phase 3.

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
