import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { createGameStateMachine, GameState } from "../core/GameState";
import { SeededRandom } from "../core/SeededRandom";
import type { StateMachine } from "../core/StateMachine";
import type { CharacterToken, VocabularyEntry } from "../vocabulary/types";
import { VocabularyMode } from "../vocabulary/VocabularyMode";
import type { VocabularyRunPlan } from "../vocabulary/WordSelector";
import { Arena, BoundaryMode } from "./Arena";
import { CollisionSystem } from "./CollisionSystem";
import { Snake } from "./Snake";
import { SnakeSimulation } from "./SnakeSimulation";
import { SpawnManager } from "./SpawnManager";
import { TokenCollisionSystem } from "./TokenCollisionSystem";
import { TokenPool } from "./TokenPool";
import {
  TokenCollectionKind,
  VocabularyGameplaySession,
} from "./VocabularyGameplaySession";

function entry(target: string): VocabularyEntry {
  const tokens = Object.freeze([...target] as CharacterToken[]);
  return Object.freeze({
    id: `entry-${target}`,
    sourceEntryId: `source-${target}`,
    sourceLevel: 1,
    sourceHeadword: target,
    target,
    displayTarget: target,
    meaningZh: "測試",
    partOfSpeech: "n.",
    pronunciation: null,
    tokens,
    tokenLength: tokens.length,
    variants: Object.freeze([target]),
    tags: Object.freeze([]),
    eligible: true,
    needsReview: false,
    reviewReasons: Object.freeze([]),
    normalizationNotes: Object.freeze([]),
  });
}

function planFor(target: string): VocabularyRunPlan {
  const vocabularyEntry = entry(target);
  return Object.freeze({
    mode: VocabularyMode.CEEC_1,
    seed: "session-test",
    scenes: Object.freeze(
      Array.from({ length: 5 }, (_, index) =>
        Object.freeze({
          gameLevel: (index + 1) as 1 | 2 | 3 | 4 | 5,
          sceneName: `Scene ${index + 1}`,
          durationSeconds: index === 0 ? 120 : 90,
          maximumTokenLength: index < 3 ? 5 + index * 3 : null,
          words: Object.freeze(Array.from({ length: 5 }, () => vocabularyEntry)),
        }),
      ),
    ),
  });
}

interface SessionFixture {
  readonly session: VocabularyGameplaySession;
  readonly stateMachine: StateMachine<ReturnType<typeof createGameStateMachine>["state"]>;
  readonly snake: Snake;
}

function createSession(target: string, initialLength = 8): SessionFixture {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.VOCABULARY_SELECT);
  stateMachine.transition(GameState.TRANSITION_IN);
  const arena = new Arena({
    halfWidth: 9,
    halfDepth: 9,
    xBoundaryMode: BoundaryMode.SOLID,
    zBoundaryMode: BoundaryMode.WRAP,
  });
  const snake = new Snake(GAMEPLAY_CONFIG.snake, { length: initialLength });
  const collisions = new CollisionSystem({
    headRadius: GAMEPLAY_CONFIG.snake.headCollisionRadius,
    bodyRadius: GAMEPLAY_CONFIG.snake.bodyCollisionRadius,
    ignoredLeadingSegments: GAMEPLAY_CONFIG.snake.selfCollisionIgnoreSegments,
  });
  const snakeSimulation = new SnakeSimulation(
    snake,
    arena,
    collisions,
    stateMachine,
    GAMEPLAY_CONFIG.collision,
  );
  const spawns = new SpawnManager(arena, new SeededRandom("session-spawns"), {
    minimumHeadDistance: 4,
    minimumEntitySpacing: 0.82,
    bodyClearance: 0.68,
    maximumRandomAttempts: 100,
    fallbackGridSpacing: 1.15,
  });
  const tokenPool = new TokenPool(spawns, GAMEPLAY_CONFIG.token.collisionRadius);
  const session = new VocabularyGameplaySession(
    planFor(target),
    stateMachine,
    snakeSimulation,
    tokenPool,
    new TokenCollisionSystem(GAMEPLAY_CONFIG.snake.headCollisionRadius),
  );
  stateMachine.transition(GameState.HUNTING);
  return { session, stateMachine, snake };
}

describe("VocabularyGameplaySession", () => {
  it("shortens for correct repeated tokens and immediately respawns the next copy", () => {
    const { session, snake } = createSession("AA");
    const firstA = session.tokenEntities.find((entity) => entity.token === "A")!;

    expect(session.resolveTokenCollision(firstA.id)).toMatchObject({
      kind: TokenCollectionKind.CORRECT,
      progressIndex: 1,
    });
    expect(snake.length).toBe(7);
    const secondA = session.tokenEntities.find((entity) => entity.token === "A");
    expect(secondA).toBeDefined();
    expect(secondA?.id).not.toBe(firstA.id);

    session.resolveTokenCollision(secondA!.id);
    expect(snake.length).toBe(6);
    expect(session.status.state).toBe(GameState.TYPING_TEST);
    expect(session.status.progressIndex).toBe(2);
  });

  it("lengthens and stuns for a wrong token, then spits it back without recovery", () => {
    const { session, snake } = createSession("A");
    const wrong = session.tokenEntities.find((entity) => entity.token === "B")!;

    expect(session.resolveTokenCollision(wrong.id)).toMatchObject({
      kind: TokenCollectionKind.WRONG,
      progressIndex: 0,
    });
    expect(snake.length).toBe(9);
    expect(session.status.state).toBe(GameState.STUNNED);
    expect(session.tokenEntities.some((entity) => entity.token === "B")).toBe(false);

    session.update(1);
    expect(session.status.state).toBe(GameState.HUNTING);
    expect(session.tokenEntities.some((entity) => entity.token === "B")).toBe(true);
    expect(session.status.timeRemainingSeconds).toBeCloseTo(119);
  });

  it("respects snake length limits for vocabulary rewards and penalties", () => {
    const minimum = createSession("A", 3);
    const correct = minimum.session.tokenEntities.find((entity) => entity.token === "A")!;
    minimum.session.resolveTokenCollision(correct.id);
    expect(minimum.snake.length).toBe(3);

    const maximum = createSession("A", 40);
    const wrong = maximum.session.tokenEntities.find((entity) => entity.token === "B")!;
    maximum.session.resolveTokenCollision(wrong.id);
    expect(maximum.snake.length).toBe(40);
  });

  it("pauses the main timer after the final token enters TYPING_TEST", () => {
    const { session } = createSession("A");
    const correct = session.tokenEntities.find((entity) => entity.token === "A")!;
    session.resolveTokenCollision(correct.id);
    const remaining = session.status.timeRemainingSeconds;

    session.update(10);

    expect(session.status.state).toBe(GameState.TYPING_TEST);
    expect(session.status.timeRemainingSeconds).toBe(remaining);
  });

  it("rolls back only the last token and adds five main-timer seconds on typing timeout", () => {
    const { session, snake } = createSession("AB");
    const first = session.tokenEntities.find((entity) => entity.token === "A")!;
    session.resolveTokenCollision(first.id);
    const last = session.tokenEntities.find((entity) => entity.token === "B")!;
    session.resolveTokenCollision(last.id);
    expect(session.status.state).toBe(GameState.TYPING_TEST);
    expect(session.status.progressIndex).toBe(2);
    expect(snake.length).toBe(6);

    expect(session.handleTypingTimeout()).toBe(true);

    expect(session.status.state).toBe(GameState.HUNTING);
    expect(session.status.progressIndex).toBe(1);
    expect(session.status.nextToken).toBe("B");
    expect(session.status.timeRemainingSeconds).toBe(125);
    expect(session.status.typingTimeoutCount).toBe(1);
    expect(session.status.typingTimeoutNoticeActive).toBe(true);
    expect(session.tokenEntities.some((entity) => entity.token === "B")).toBe(true);
    expect(session.tokenEntities.some((entity) => entity.token === "A")).toBe(false);
    expect(snake.length).toBe(6);
  });

  it("keeps the current word after twenty seconds without a correct token", () => {
    const { session, stateMachine } = createSession("AB");
    stateMachine.transition(GameState.MAP_EXPANDED);

    session.update(20);

    expect(session.status.state).toBe(GameState.MAP_EXPANDED);
    expect(session.status.wordNumber).toBe(1);
    expect(session.status.progressIndex).toBe(0);
    expect(session.status.timeRemainingSeconds).toBe(100);
  });

  it("advances across all five scenes only through the future typing-success hook", () => {
    const { session } = createSession("A");

    for (let completedWords = 0; completedWords < 25; completedWords += 1) {
      const correct = session.tokenEntities.find((entity) => entity.token === "A")!;
      session.resolveTokenCollision(correct.id);
      expect(session.status.state).toBe(GameState.TYPING_TEST);
      expect(session.advanceAfterTypingSuccess()).toBe(true);

      if (completedWords === 4) {
        expect(session.status.gameLevel).toBe(2);
        expect(session.status.timeRemainingSeconds).toBe(90);
      }
    }

    expect(session.status.state).toBe(GameState.GAME_CLEAR);
    expect(session.status.wordNumber).toBe(25);
  });
});
