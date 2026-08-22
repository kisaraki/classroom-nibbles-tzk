# AGENTS.md — NIBBLES Codex Rules

This file applies to every AI coding agent working in this repository.

## Read first

At the start of each work session read, in order: `AGENTS.md`, `SPEC.md`, `PHASE-01-CODEX.md` when Phase 1 is active, `CHANGELOG.md`, then relevant source/tests. If vocabulary is involved, also inspect `public/data/vocabulary-import-report.json`.

## Priority when instructions conflict

1. User's newest explicit instruction.
2. `SPEC.md`.
3. `AGENTS.md`.
4. Tests that encode the current spec.
5. Existing implementation.
6. README/documentation of lower authority.

Existing code is not automatically correct. Fix code to the spec rather than rewriting the spec to justify old behavior.

## Core gameplay must not be changed without approval

Do not introduce collision death, remove the snake-length reward/penalty, remove the typing test, change the 3-consecutive-input rule, merge Game Level with Vocabulary Level, turn the game into six-degree-of-freedom flight, pause the tactical map completely, or reduce the mini-map snake to a single point.

## Vocabulary source discipline

The supplied CEEC PDF and Phase 0 extracted source JSON are the source reference. Do not silently correct headwords, pronunciations or Chinese glosses from model knowledge or the web. Preserve ambiguous source data and mark/review it. Runtime reads `public/data/vocabulary.json`; runtime never parses the PDF.

If vocabulary import logic changes, run `npm run import:vocabulary`, `npm run validate:vocabulary`, tests and build. Never delete unknown characters just to make validation pass.

## Small, testable work

Work one phase/subsystem/bug at a time. Do not rewrite the entire repository. Gameplay correctness comes before visual polish. Do not spend Phase 1 or Phase 2 on advanced GLTF/shaders/cinematics.

After meaningful changes run at least:

```bash
npm run typecheck
npm run validate:vocabulary
npm run test
npm run build
```

Run Playwright smoke/E2E tests when relevant. A failing test is not permission to delete/skip/weaken it simply to turn CI green.

## TypeScript and architecture

Avoid `any`, broad `as unknown as`, unexplained `@ts-ignore`, empty `catch {}`, magic numbers and God objects. Centralize gameplay configuration. Prefer typed events/interfaces to cross-module direct mutation. Do not add a large dependency when native browser APIs/Three.js can reasonably do the job.

All gameplay randomness that must be reproducible (word selection, spawning, level randomization) must go through a seeded random abstraction rather than direct `Math.random()` at call sites.

## GitHub Pages

The application must work under a repository subpath. Keep Vite `base: "./"` and use `import.meta.env.BASE_URL` or equivalent safe relative paths for runtime data/assets.

## Documentation and completion report

Update `CHANGELOG.md` for meaningful work. Update the relevant spec/readme when a public interface, data schema, build command, controls or gameplay behavior changes.

At the end of a task report: completed items, important files changed, commands/tests run and results, and remaining known issues. Do not continue into a later phase unless requested or the active phase document explicitly authorizes it.
