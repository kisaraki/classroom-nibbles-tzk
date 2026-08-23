# CHANGELOG

## Version 1.1 — 2026-08-23

### Added
- A `↓` relative backward maneuver that completes a deterministic two-corner U-turn only after the snake has travelled one full segment spacing, preserving direct-reversal and anti-inward-curl protection.
- A `J`-key visual first-person backflip with synthesized feedback, duplicate-trigger protection and an exact return to the table pose without changing XZ physics or gameplay state.
- Unit and Chromium coverage for safe backward completion, ordinary reversal rejection, the pinball camera pose, the full backflip/reset cycle and both new keyboard controls.

### Changed
- Replaced the snake-eye follow camera with one fixed PerspectiveCamera at the player's end of the arena, angled down across the complete pinball table.
- Replaced the cockpit mask, struts and center reticle with slim table rails and an apron; the snake head is visible again from the new camera.
- Made batched token quads follow the camera's full orientation so labels remain readable from the angled table view and throughout a backflip.
- Updated the Traditional Chinese mission header, controls, pause-shield wording, browser description and public version metadata to Version 1.1.

### Removed
- Removed the former first-person cockpit/snake-eye presentation and its camera-turn smoothing.

### Fixed
- Refreshed radar position data immediately on state changes so pausing cannot briefly display a stale pre-pause sample.

## Version 1.0 / Phase 9 — 2026-08-23

### Added
- A Traditional Chinese `LEVEL_FAILED` mission report with alert-dialog semantics, focused return action, scene/progress context and a non-lethal rules reminder, eliminating the expired-timer dead end.
- Release-state regression tests covering the full success-to-credits/replay route, the stun/recovery/failure exit and the typing-test pause prohibition.
- A production artifact verifier for repository-subpath-safe references, required runtime data/assets and JavaScript/CSS size budgets; CI and GitHub Pages now run it after every production build.
- Chromium release gates for 1920×1080 frame rate, draw calls, internal render budget, browser/network errors, Traditional Chinese accessible names, focus, unique IDs and pause/resume state.
- Version 1.0 metadata and a repository-safe SVG favicon.

### Changed
- Batched all 30 token billboards into one dynamic texture-atlas mesh, reduced live telemetry DOM updates to 10 Hz and exposed render diagnostics for repeatable performance checks.
- Added a dynamic 800×450 internal pixel budget, high-performance WebGL preference and lower-cost live overlays while keeping the cockpit canvas at full viewport size.
- Added explicit release-version and game-state diagnostics to the application root and replaced the remaining English completion status with Traditional Chinese.
- Added bounded timeouts to CI and Pages jobs and advanced browser metadata, accessibility text, default seed and visible phase markers to Phase 9.

### Fixed
- Prevented duplicate start actions outside `VOCABULARY_SELECT` and disposed both success and failure terminal presentation before replay.
- Refreshed the Chinese simulation-state indicator immediately on pause/resume so visibility-triggered pauses cannot leave stale telemetry when the render timer is suspended.
- Preserved all core mechanics during release hardening, including non-lethal collision recovery, snake length rewards/penalties, three consecutive typing successes, independent Game/Vocabulary levels, active tactical-map simulation and the complete mini-map trail.

## Phase 8 — 2026-08-22

### Added
- A dependency-free Web Audio presentation layer with synthesized feedback for menus, tokens, collisions, power-ups, weapons, typing, pause/resume, scene entry and mission completion.
- Five distinct low-level ambient soundscapes, one per environment, plus a Traditional Chinese sound toggle whose mute preference persists in localStorage and degrades safely to silent play when audio is unavailable.
- Animated cockpit-door cards for every scene entry, user pause/resume, visibility-triggered automatic pause and final mission completion, with reduced-motion handling.
- A KOSMOS TOOLKITS 探真拓知酷 credits screen summarizing all five environments and 25 completed words, with a clean return to vocabulary/seed selection for replay.
- Typed gameplay presentation events and unit/Chromium coverage for audio definitions, mute persistence, collection/impact cues, exact-state pause/resume, visibility behavior, doors and credits.

### Changed
- Made `TRANSITION_IN` a real timer-pausing state between scenes instead of transitioning through it synchronously.
- Added `P` pause/resume for normal gameplay and automatic pause when the document becomes hidden; typing tests remain real-time and cannot be paused with `P`.
- Advanced browser metadata, accessibility text, default seed and visible phase markers to Phase 8.

### Fixed
- Preserved the exact prior `HUNTING`, `STUNNED`, `RECOVERY`, or `MAP_EXPANDED` state across pause/resume and delayed state restoration until the door-open animation completes.
- Reset transient run presentation and initial snake length before replay so a completed mission can begin a clean new run without duplicated HUD elements.

## Phase 7 — 2026-08-22

### Added
- Five typed environment profiles for Cargo Bay, Ship Pipeline, Asteroid Belt, Dense Atmosphere and Alien Forest with distinct palettes, fog ranges, obstacle layouts and Traditional Chinese mechanism labels.
- Instanced Three.js cargo, pipe, asteroid, pressure-pylon and alien-tree treatments that switch with the active Game Level.
- Solid environment geometry in snake collision, seeded token/power-up spawning, projectile impact and both radar sizes.
- Scene-start notifications plus unit and Chromium coverage for five-environment completeness, arena capacity, switching, collision, bullet blocking and live Cargo Bay markers.

### Changed
- Advanced browser metadata, default seed and visible phase markers to Phase 7.
- Reset the snake pose and trail to the safe arena center between scenes while preserving earned length and cumulative ammo.
- Rebuilt tokens and power-ups outside each new obstacle field and cleared only active bullets during scene changes.
- Reported environment mechanics, obstacle collisions and obstacle shot impacts in the Chinese cockpit HUD.

## Phase 6 — 2026-08-22

### Added
- A single snake-eye PerspectiveCamera rig with short heading-change smoothing and no stereo-rendering dependency.
- A fixed cockpit mask, horizon accents and central targeting reticle around the Three.js scene.
- A lower-left mini-map that distinguishes SOLID and WRAP boundaries and shows all tokens, power-ups, active bullets, future obstacle markers, the snake head and the complete snake trail.
- Click and `M` controls for an enlarged tactical map, plus `Esc` and `M` close controls and a visible 0.25× status indicator.
- Unit and Chromium coverage for camera behavior, tactical-map state/input, complete-trail radar data and continued quarter-speed gameplay.

### Changed
- Advanced browser metadata, default seed and visible phase markers to Phase 6.
- Made `MAP_EXPANDED` an active gameplay state whose fixed-step simulation and main timer run at 0.25 speed; steering, collection and firing remain available.
- Replaced the temporary isometric camera and diagnostic layout with the cockpit view and right-side Chinese mission HUD.
- Hid the rendered snake head from the first-person scene while retaining the full snake on the mini-map and tactical map.

### Known Issues
- Phase 7's five functional environments are not implemented; every Game Level still uses the existing cargo arena.

## Phase 5 — 2026-08-22

### Added
- Persistent seeded arena pool containing one each of +10, +5, −10, −5 and ATTACK without overlapping the snake, tokens or other power-ups.
- Signed numeric power-up effects for the scene main timer; negative adjustments reaching zero use the existing non-lethal level-failed flow.
- Cumulative ATTACK rewards of five rounds and Space-key firing restricted to `HUNTING`.
- Fixed-step projectile movement across WRAP axes, four-second safety expiry and removal on SOLID-wall impact.
- Shot-token and shot-power-up repositioning that never advances vocabulary progress or activates the struck power-up.
- Three.js power-up labels and projectile rendering plus Traditional Chinese ammo, power-up and shot telemetry.
- Unit and Chromium coverage for Phase 5 spawn, collection, ammo, firing, impact and browser-HUD behavior.

### Changed
- Advanced browser metadata, default seed and visible phase markers to Phase 5.
- Extended shared spawn occupancy so future token respawns avoid all live power-ups.

### Known Issues
- The current isometric scene and telemetry overlay remain temporary until the cockpit HUD and mini-map work in Phase 6.

## Phase 4 — 2026-08-22

### Added
- Traditional Chinese typing reinforcement modal with target, Chinese meaning, real-time countdown, streak, feedback and auto-focused input.
- Thirty-second absolute-time `TypingTestSession` that remains accurate across animation pauses and hidden-tab intervals.
- Case-insensitive answer comparison after trimming leading/trailing whitespace while preserving exact internal spaces, periods, apostrophes and hyphens.
- Three-consecutive-success progression with immediate streak reset after every wrong submission.
- Enter-key/form submission and copy/cut/paste prevention scoped only to the typing modal.
- Typing-timeout recovery that rolls back only the final token and adds five seconds to the scene timer.
- Unit and Chromium coverage for comparison, streaks, timeout, rollback, keyboard submission, focus and clipboard scope.

### Changed
- Advanced browser metadata and visible phase markers to Phase 4.
- Suspended movement input throughout `TYPING_TEST` and restored it only when gameplay returns to `HUNTING`.
- Completed the existing word/scene progression hook so a successful typing test continues the 25-word run through `GAME_CLEAR`.

### Removed
- Removed the custom 20-second no-progress deadline, final-10-second HUD warning and automatic current-level restart. The configured scene main timer remains the only hunting time limit.

### Fixed
- Typing time now uses an absolute `performance.now()` deadline instead of the fixed-step gameplay clock, so hiding the page cannot pause the test.
- Prevented rapid two-corner input from bypassing direct-reversal protection and curling the snake head inward; U-shaped turns now require one segment spacing of forward travel, with one safe stationary turn retained during recovery.

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
