import { GAMEPLAY_CONFIG } from "../core/Config";
import { GameState, type GameState as GameStateValue } from "../core/GameState";
import type { StateMachine } from "../core/StateMachine";
import type { CharacterToken, VocabularyEntry } from "../vocabulary/types";
import { vocabularyModeLabel } from "../vocabulary/VocabularyMode";
import type { VocabularyRunPlan } from "../vocabulary/WordSelector";
import type { SnakeSimulation } from "./SnakeSimulation";
import { TokenCollisionSystem } from "./TokenCollisionSystem";
import { TokenPool, type TokenEntity } from "./TokenPool";

const TIMER_STATES = new Set<GameStateValue>([
  GameState.HUNTING,
  GameState.STUNNED,
  GameState.RECOVERY,
  GameState.MAP_EXPANDED,
]);

export const TokenCollectionKind = Object.freeze({
  CORRECT: "CORRECT",
  WRONG: "WRONG",
} as const);

export type TokenCollectionKind =
  (typeof TokenCollectionKind)[keyof typeof TokenCollectionKind];

export interface TokenCollectionResult {
  readonly kind: TokenCollectionKind;
  readonly token: CharacterToken;
  readonly progressIndex: number;
}

export interface VocabularyGameplayStatus {
  readonly state: GameStateValue;
  readonly vocabularyMode: string;
  readonly gameLevel: number;
  readonly sceneName: string;
  readonly wordNumber: number;
  readonly totalWords: number;
  readonly timeRemainingSeconds: number;
  readonly entry: VocabularyEntry;
  readonly progressIndex: number;
  readonly nextToken: CharacterToken | null;
  readonly latestCollection: TokenCollectionKind | null;
  readonly typingTimeoutCount: number;
  readonly typingTimeoutNoticeActive: boolean;
}

export type WordStartedListener = (entry: VocabularyEntry) => void;

export class VocabularyGameplaySession {
  readonly #plan: VocabularyRunPlan;
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #snakeSimulation: SnakeSimulation;
  readonly #tokenPool: TokenPool;
  readonly #tokenCollisions: TokenCollisionSystem;
  readonly #wordStartedListeners = new Set<WordStartedListener>();
  #sceneIndex = 0;
  #wordIndex = 0;
  #progressIndex = 0;
  #timeRemainingSeconds: number;
  #pendingWrongToken: CharacterToken | null = null;
  #latestCollection: TokenCollectionKind | null = null;
  #typingTimeoutCount = 0;
  #typingTimeoutNoticeActive = false;

  constructor(
    plan: VocabularyRunPlan,
    stateMachine: StateMachine<GameStateValue>,
    snakeSimulation: SnakeSimulation,
    tokenPool: TokenPool,
    tokenCollisions: TokenCollisionSystem,
  ) {
    if (plan.scenes.length !== 5 || plan.scenes.some((scene) => scene.words.length !== 5)) {
      throw new Error("A vocabulary run must contain five scenes with five words each.");
    }
    this.#plan = plan;
    this.#stateMachine = stateMachine;
    this.#snakeSimulation = snakeSimulation;
    this.#tokenPool = tokenPool;
    this.#tokenCollisions = tokenCollisions;
    this.#timeRemainingSeconds = this.#currentScene.durationSeconds;
    this.#tokenPool.normalize(this.#snakeSimulation.snake);
  }

  get tokenEntities(): readonly TokenEntity[] {
    return this.#tokenPool.entities;
  }

  get status(): VocabularyGameplayStatus {
    const entry = this.#currentEntry;
    return Object.freeze({
      state: this.#stateMachine.state,
      vocabularyMode: vocabularyModeLabel(this.#plan.mode),
      gameLevel: this.#currentScene.gameLevel,
      sceneName: this.#currentScene.sceneName,
      wordNumber: this.#sceneIndex * 5 + this.#wordIndex + 1,
      totalWords: 25,
      timeRemainingSeconds: Math.max(this.#timeRemainingSeconds, 0),
      entry,
      progressIndex: this.#progressIndex,
      nextToken: entry.tokens[this.#progressIndex] ?? null,
      latestCollection: this.#latestCollection,
      typingTimeoutCount: this.#typingTimeoutCount,
      typingTimeoutNoticeActive: this.#typingTimeoutNoticeActive,
    });
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Vocabulary gameplay deltaSeconds must be finite and non-negative.");
    }

    if (TIMER_STATES.has(this.#stateMachine.state)) {
      this.#timeRemainingSeconds -= deltaSeconds;
      if (this.#timeRemainingSeconds <= 0) {
        this.#timeRemainingSeconds = 0;
        this.#stateMachine.transition(GameState.LEVEL_FAILED);
        return;
      }
    }

    this.#snakeSimulation.update(deltaSeconds);
    if (this.#pendingWrongToken && this.#stateMachine.state === GameState.HUNTING) {
      this.#tokenPool.ensureToken(this.#pendingWrongToken, this.#snakeSimulation.snake);
      this.#pendingWrongToken = null;
    }

    if (this.#stateMachine.state !== GameState.HUNTING) return;
    const collision = this.#tokenCollisions.detect(
      this.#snakeSimulation.snake.headPosition,
      this.#tokenPool.entities,
      this.#snakeSimulation.arena,
    );
    if (collision) this.resolveTokenCollision(collision.id);
  }

  resolveTokenCollision(entityId: string): TokenCollectionResult | null {
    if (this.#stateMachine.state !== GameState.HUNTING) return null;
    const entity = this.#tokenPool.getById(entityId);
    if (!entity) return null;
    const expected = this.#currentEntry.tokens[this.#progressIndex];
    if (!expected) return null;

    this.#tokenPool.remove(entity.id);
    if (entity.token === expected) {
      this.#snakeSimulation.snake.shrink();
      this.#progressIndex += 1;
      this.#latestCollection = TokenCollectionKind.CORRECT;
      this.#typingTimeoutNoticeActive = false;
      const nextToken = this.#currentEntry.tokens[this.#progressIndex];
      if (!nextToken) {
        this.#stateMachine.transition(GameState.TYPING_TEST);
      } else if (nextToken === entity.token) {
        this.#tokenPool.ensureToken(nextToken, this.#snakeSimulation.snake);
      }
      return Object.freeze({
        kind: TokenCollectionKind.CORRECT,
        token: entity.token,
        progressIndex: this.#progressIndex,
      });
    }

    this.#snakeSimulation.snake.grow();
    this.#pendingWrongToken = entity.token;
    this.#latestCollection = TokenCollectionKind.WRONG;
    this.#snakeSimulation.applyWrongTokenCollision(entity.position);
    return Object.freeze({
      kind: TokenCollectionKind.WRONG,
      token: entity.token,
      progressIndex: this.#progressIndex,
    });
  }

  advanceAfterTypingSuccess(): boolean {
    if (this.#stateMachine.state !== GameState.TYPING_TEST) return false;
    if (this.#wordIndex + 1 >= this.#currentScene.words.length) {
      this.#stateMachine.transition(GameState.LEVEL_CLEAR);
      if (this.#sceneIndex + 1 >= this.#plan.scenes.length) {
        this.#stateMachine.transition(GameState.GAME_CLEAR);
        return true;
      }

      this.#sceneIndex += 1;
      this.#wordIndex = 0;
      this.#timeRemainingSeconds = this.#currentScene.durationSeconds;
      this.#resetForCurrentWord();
      this.#stateMachine.transition(GameState.TRANSITION_IN);
      this.#stateMachine.transition(GameState.HUNTING);
      return true;
    }

    this.#wordIndex += 1;
    this.#resetForCurrentWord();
    this.#stateMachine.transition(GameState.HUNTING);
    return true;
  }

  handleTypingTimeout(
    mainTimeBonusSeconds = GAMEPLAY_CONFIG.typingTest.timeoutMainTimeBonusSeconds,
  ): boolean {
    if (this.#stateMachine.state !== GameState.TYPING_TEST) return false;
    if (!Number.isFinite(mainTimeBonusSeconds) || mainTimeBonusSeconds < 0) {
      throw new Error("Typing timeout main-time bonus must be finite and non-negative.");
    }
    const lastToken = this.#currentEntry.tokens[this.#currentEntry.tokens.length - 1];
    if (!lastToken) throw new Error("Typing timeout requires a non-empty target.");

    this.#progressIndex = Math.max(0, this.#currentEntry.tokenLength - 1);
    this.#timeRemainingSeconds += mainTimeBonusSeconds;
    this.#latestCollection = null;
    this.#typingTimeoutCount += 1;
    this.#typingTimeoutNoticeActive = true;
    this.#tokenPool.ensureToken(lastToken, this.#snakeSimulation.snake);
    this.#stateMachine.transition(GameState.HUNTING);
    return true;
  }

  adjustMainTime(deltaSeconds: number): number {
    if (!Number.isFinite(deltaSeconds)) {
      throw new Error("Main-time adjustment must be finite.");
    }
    if (!TIMER_STATES.has(this.#stateMachine.state)) {
      return Math.max(this.#timeRemainingSeconds, 0);
    }
    this.#timeRemainingSeconds = Math.max(0, this.#timeRemainingSeconds + deltaSeconds);
    if (this.#timeRemainingSeconds === 0) {
      this.#stateMachine.transition(GameState.LEVEL_FAILED);
    }
    return this.#timeRemainingSeconds;
  }

  #resetForCurrentWord(): void {
    this.#progressIndex = 0;
    this.#latestCollection = null;
    this.#typingTimeoutNoticeActive = false;
    this.#tokenPool.normalize(this.#snakeSimulation.snake);
    for (const listener of this.#wordStartedListeners) listener(this.#currentEntry);
  }

  subscribeToWordStarted(listener: WordStartedListener): () => void {
    this.#wordStartedListeners.add(listener);
    return () => this.#wordStartedListeners.delete(listener);
  }

  get #currentScene(): VocabularyRunPlan["scenes"][number] {
    return this.#plan.scenes[this.#sceneIndex]!;
  }

  get #currentEntry(): VocabularyEntry {
    return this.#currentScene.words[this.#wordIndex]!;
  }
}
