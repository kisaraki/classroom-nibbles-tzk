# NIBBLES — Engineering Specification

Version: 1.3 (Version 1.0 release hardened)
Team: KOSMOS TOOLKITS 探真拓知酷  
Target: Desktop Web / GitHub Pages  
Core stack: TypeScript + Three.js + Vite

## 1. Product goal

NIBBLES is a first-person 3D cockpit vocabulary game based on classic snake mechanics. The learning loop is:

1. Show a target English vocabulary item and Chinese meaning.
2. Drive the snake-mecha around a 3D arena on the horizontal XZ plane.
3. Eat the target characters in order.
4. Correct character: advance progress and shorten the snake by 1 segment (minimum 3).
5. Wrong character: lengthen the snake by 1 segment (maximum 40), stun for 1 second, then spit the wrong character back out.
6. After the final character, pause the main game timer and open a 30-second typing test.
7. The player must type the target correctly 3 consecutive times. Any wrong attempt resets the streak to 0.
8. Typing timeout rolls back only the last token, adds 5 seconds to the main timer, and returns to hunting.

Golden rules: collision is a delay penalty, not death; correct answers make the snake shorter; wrong answers make it longer.

## 2. Technical constraints

Use TypeScript, Three.js, Vite, Vitest, Playwright, HTML/CSS, Web Audio/HTMLAudioElement, localStorage, GitHub Actions and GitHub Pages. Do not add React, Vue, Angular, Unity, Electron, a backend, database, Firebase, WebSocket or account system in Version 1.x unless explicitly requested.

Vite must use `base: "./"`. Runtime assets/data must work from a repository subpath on GitHub Pages.

## 3. Spatial and movement model

The world is true 3D, but gameplay movement is constrained to the XZ plane. Directions are NORTH (-Z), SOUTH (+Z), WEST (-X), EAST (+X). Direct 180-degree reversal is illegal. Physics direction changes immediately; camera/cockpit visual rotation may smooth over roughly 120–180 ms. Snake motion is continuous and the body follows a recorded trail, not grid jumps.

Two rapid 90-degree inputs must not bypass the reversal rule and curl the head into its own trail. If a second corner would reverse the heading from before the previous turn, reject it until the head has travelled at least one segment spacing. During `RECOVERY`, allow one legal stationary turn, but never a direct reversal or a second stationary turn.

Default configuration: initial length 8, min 3, max 40, segment spacing 0.75 world unit, speed approximately 4.5 units/sec. Put gameplay constants in a central config module.

## 4. State machine

Use one explicit main state machine, not combinations of booleans:

`BOOT`, `MAIN_MENU`, `VOCABULARY_SELECT`, `TRANSITION_IN`, `HUNTING`, `STUNNED`, `RECOVERY`, `MAP_EXPANDED`, `TYPING_TEST`, `PAUSED`, `LEVEL_CLEAR`, `LEVEL_FAILED`, `GAME_CLEAR`, `CREDITS`.

Main timer runs in HUNTING, STUNNED, RECOVERY and MAP_EXPANDED. It pauses in PAUSED, TRANSITION_IN, TYPING_TEST and terminal/transition states. Tactical map uses `timeScale = 0.25` for gameplay and main timer. Typing timer always uses real time.

## 5. Collision rules

Correct character: snake length -1. Wrong character: length +1, stun 1 second, controls/fire disabled, then respawn/spit character. SOLID wall: stun 1 second, no length change. Self collision: same as SOLID wall. After wall/self stun, provide 500 ms RECOVERY: snake remains stationary, turning is allowed, firing is not. WRAP walls transport crossing segments to the opposite boundary; do not teleport the entire snake at once.

## 6. Vocabulary data

The supplied CEEC Level 1–6 PDF is the source reference. Each level is labeled 1,080 words in the source document. Phase 0 creates a parsed source layer and a normalized runtime layer:

- `docs/reference/ceec-vocabulary-level1-6.pdf` — reference only.
- `data/source/ceec-vocabulary-source.json` — parsed source rows preserving raw text and source locations.
- `public/data/vocabulary.json` — runtime vocabulary dataset.
- `public/data/vocabulary-import-report.json` — audit/review report.

Runtime must never parse the PDF.

Game Level and Vocabulary Level are independent. Vocabulary selection supports CEEC 1–6, PROGRESSIVE, and MIXED 1–6. A full run contains 5 game scenes × 5 words = 25 words. Avoid repeating the same entry/target in one run. Word selection must support a deterministic seed.

PROGRESSIVE mapping: Game 1→CEEC 1, Game 2→CEEC 2, Game 3→CEEC 3, Game 4→3 words from CEEC 4 + 2 from CEEC 5, Game 5→CEEC 6.

Supported gameplay character tokens: `A-Z`, `SPACE`, `PERIOD`, `APOSTROPHE`, `HYPHEN`. Slash is a source variant delimiter and never a gameplay token. Token length, not JavaScript string length, controls level word-length constraints.

## 7. Game scenes

- Game Level 1: Cargo Bay, max token length 5, 5 words, 120 seconds.
- Game Level 2: Ship Pipeline, max token length 8, 5 words, 90 seconds.
- Game Level 3: Asteroid Belt, max token length 10, 5 words, 90 seconds.
- Game Level 4: Dense Atmosphere, unlimited token length, 5 words, 90 seconds.
- Game Level 5: Alien Forest, unlimited token length, 5 words, 60 seconds.

Each scene has a distinct palette, fog range, solid obstacle layout and 3D obstacle treatment. Environment obstacles use the same non-lethal stun/recovery rule as SOLID walls, block bullets, appear on both map sizes and are excluded from every token/power-up spawn. A scene change resets the snake pose/trail to the safe center while preserving earned length and cumulative ammo, then rebuilds entities outside the new geometry.

If a vocabulary filter yields fewer than 5 candidates, relax recent-history filtering first, then increase max token length one token at a time until sufficient.

## 8. HUD and cockpit

Use one PerspectiveCamera plus a cockpit/snake-eye mask rather than stereo rendering in Version 1. HUD shows game level, vocabulary level, word number, main time, target, Chinese meaning, optional part of speech, token progress, heading, speed and ammo. The next required token must use pulse/outline or another non-color-only cue.

Mini-map in lower left shows arena, walls/obstacles, all characters/power-ups, snake head and full snake trail. Clicking the mini-map or pressing `M` opens the enlarged tactical map. It runs gameplay at 0.25 speed; `Esc` or `M` closes it.

The Version 1.x user interface uses Traditional Chinese for navigation, labels, state feedback, countdown warnings and accessibility text. English vocabulary targets, CEEC names and conventional control abbreviations may remain where they are learning content or proper names.

## 9. Character pool and spawning

At the start of a word/arena ensure at least one of every token type: A–Z, SPACE, PERIOD, APOSTROPHE, HYPHEN. If a consumed correct token occurs again later in the same target, immediately respawn that token. At each new word normalize the token pool so all token types exist.

All spawning goes through one SpawnManager. A spawn must be inside the arena, outside solid geometry and snake body, non-overlapping with entities, and at least 4 world units from the snake head. Try at most 100 random locations, then use precomputed valid spawn points.

## 10. Power-ups and weapon

Always keep one each of +10, +5, -10, -5, ATTACK in the arena. Numeric power-ups adjust the scene main timer by their signed number of seconds; reaching zero through a negative power-up uses the normal `LEVEL_FAILED` flow. ATTACK adds 5 ammo and ammo may accumulate. Space fires if ammo > 0. A bullet can destroy/reposition characters or power-ups; shooting a power-up does not activate it. Shooting the target character does not count as correct/wrong. Bullet hitting a solid wall disappears. To prevent unbounded projectiles on WRAP axes, an otherwise unspent bullet expires after 4 seconds.

## 11. Typing test

Main timer pauses. Typing timer is 30 seconds real time. Comparison is case-insensitive after trimming leading/trailing whitespace; internal spaces, periods, apostrophes and hyphens must match. Enter submits. Three consecutive correct submissions succeed. Wrong submission resets streak to 0. Disable copy/cut/paste only within the typing modal. Do not globally disable clipboard behavior.

## 12. Pause and visibility

P pauses normal gameplay through a door-close transition; P resumes with door-open. P does not pause Typing Test. Hiding the document auto-pauses normal gameplay. Typing Test continues using real time while the tab is hidden.

## 13. Performance and game loop

Use fixed-step gameplay update at 1/60 sec with accumulator. Clamp frame delta to at most 0.1 sec. Target 60 FPS at 1920×1080, minimum acceptable 30 FPS. Prefer InstancedMesh for repeated geometry and aim for fewer than about 200 draw calls in typical scenes. Asset failure must fall back gracefully rather than crash the game.

## 14. Architecture boundaries

`Game.ts` coordinates boot, services, state machine and loop only. Snake does not own UI. UI does not own collision. WordSelector does not touch Three.js scenes. SpawnManager does not know vocabulary progression. AudioManager does not change gameplay state. Use typed interfaces/events.

## 15. Development phases

- Phase 0 — vocabulary source extraction, normalization, validator and audit report. **Completed by supplied files.**
- Phase 1 — project scaffold: Vite/TypeScript/Three.js/Vitest/Playwright/GitHub Pages, and verify Phase 0 data loads. **Completed.**
- Phase 2 — snake movement/trail/wrap/solid/self collision. **Completed.**
- Phase 3 — vocabulary gameplay/selection/token spawning/HUD progress. **Completed.**
- Phase 4 — typing test. **Completed.**
- Phase 5 — power-ups and weapon. **Completed.**
- Phase 6 — cockpit HUD, mini-map and tactical map. **Completed.**
- Phase 7 — five functional environments. **Completed.**
- Phase 8 — presentation/audio/transitions/credits. **Completed.**
- Phase 9 — full QA and release hardening. **Completed for Version 1.0.**

Do not start the next phase until the current phase passes typecheck, tests and build.

## 16. Definition of Done for Version 1.x

A player can choose CEEC vocabulary mode, complete all five game scenes, collect target characters in order, experience length rewards/penalties without collision death, use radar/power-ups/weapon, complete the 3× typing reinforcement for every word, finish Level 5, and reach KOSMOS TOOLKITS credits. A main-timer failure has a Chinese, keyboard-accessible route back to mission settings. Vocabulary validation, unit tests, 1920×1080 performance/accessibility E2E tests, production build, release-artifact budgets and GitHub Pages deployment all pass.
