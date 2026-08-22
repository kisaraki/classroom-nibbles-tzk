import * as THREE from "three";
import { Arena } from "../gameplay/Arena";
import { CollisionSystem } from "../gameplay/CollisionSystem";
import { Snake } from "../gameplay/Snake";
import { SnakeSimulation } from "../gameplay/SnakeSimulation";
import { SpawnManager } from "../gameplay/SpawnManager";
import { TokenCollisionSystem } from "../gameplay/TokenCollisionSystem";
import { TokenPool } from "../gameplay/TokenPool";
import { VocabularyGameplaySession } from "../gameplay/VocabularyGameplaySession";
import { DirectionInput } from "../input/DirectionInput";
import { PhaseThreeScene } from "../rendering/PhaseThreeScene";
import { BootScreen } from "../ui/BootScreen";
import { PhaseThreePanel } from "../ui/PhaseThreePanel";
import {
  VocabularySelectScreen,
  type VocabularySelection,
} from "../ui/VocabularySelectScreen";
import { RecentTargetHistory } from "../vocabulary/RecentTargetHistory";
import { VocabularyRepository } from "../vocabulary/VocabularyRepository";
import { WordSelector } from "../vocabulary/WordSelector";
import { GAMEPLAY_CONFIG, getVocabularyUrl } from "./Config";
import { FixedStepRunner } from "./FixedStepRunner";
import { createGameStateMachine, GameState } from "./GameState";
import { SeededRandom } from "./SeededRandom";

export class Game {
  readonly #container: HTMLElement;
  readonly #bootScreen: BootScreen;
  readonly #stateMachine = createGameStateMachine();
  readonly #arena = new Arena(GAMEPLAY_CONFIG.arena);
  readonly #snake = new Snake(GAMEPLAY_CONFIG.snake);
  readonly #collisionSystem = new CollisionSystem({
    headRadius: GAMEPLAY_CONFIG.snake.headCollisionRadius,
    bodyRadius: GAMEPLAY_CONFIG.snake.bodyCollisionRadius,
    ignoredLeadingSegments: GAMEPLAY_CONFIG.snake.selfCollisionIgnoreSegments,
  });
  readonly #snakeSimulation = new SnakeSimulation(
    this.#snake,
    this.#arena,
    this.#collisionSystem,
    this.#stateMachine,
    GAMEPLAY_CONFIG.collision,
  );
  readonly #fixedStepRunner = new FixedStepRunner({
    stepSeconds: GAMEPLAY_CONFIG.fixedStepSeconds,
    maximumFrameDeltaSeconds: GAMEPLAY_CONFIG.maximumFrameDeltaSeconds,
    maximumUpdatesPerFrame: GAMEPLAY_CONFIG.maximumUpdatesPerFrame,
  });
  readonly #input = new DirectionInput((direction) => {
    this.#snakeSimulation.requestDirection(direction);
  });
  readonly #recentHistory = new RecentTargetHistory();
  #scene: PhaseThreeScene | null = null;
  #selectionScreen: VocabularySelectScreen | null = null;
  #panel: PhaseThreePanel | null = null;
  #repository: VocabularyRepository | null = null;
  #gameplay: VocabularyGameplaySession | null = null;
  #timer: THREE.Timer | null = null;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#bootScreen = new BootScreen(container);
  }

  async start(): Promise<void> {
    this.#bootScreen.setLoading();
    try {
      this.#scene = new PhaseThreeScene(this.#container, this.#arena);
      const timer = new THREE.Timer();
      timer.connect(document);
      this.#timer = timer;
      this.#scene.setAnimationLoop(this.#render);

      this.#repository = await VocabularyRepository.load(getVocabularyUrl());
      this.#stateMachine.transition(GameState.MAIN_MENU);
      this.#stateMachine.transition(GameState.VOCABULARY_SELECT);
      this.#selectionScreen = new VocabularySelectScreen(
        this.#container,
        this.#repository.metadata,
        this.#startRun,
      );
      this.#bootScreen.hide();
    } catch (error) {
      this.#bootScreen.showError(error);
    }
  }

  dispose(): void {
    this.#input.detach();
    this.#selectionScreen?.dispose();
    this.#scene?.dispose();
    this.#timer?.dispose();
  }

  readonly #startRun = (selection: VocabularySelection): void => {
    if (!this.#repository || !this.#selectionScreen) return;
    try {
      const selector = new WordSelector(this.#repository.eligibleEntries);
      const plan = selector.createRun(
        selection.mode,
        selection.seed,
        this.#recentHistory.load(),
      );
      const spawnManager = new SpawnManager(
        this.#arena,
        new SeededRandom(`${selection.seed}:spawns`),
        {
          minimumHeadDistance: GAMEPLAY_CONFIG.token.minimumHeadDistance,
          minimumEntitySpacing: GAMEPLAY_CONFIG.token.minimumEntitySpacing,
          bodyClearance: GAMEPLAY_CONFIG.token.bodyClearance,
          maximumRandomAttempts: GAMEPLAY_CONFIG.token.maximumRandomAttempts,
          fallbackGridSpacing: GAMEPLAY_CONFIG.token.fallbackGridSpacing,
        },
      );
      const tokenPool = new TokenPool(spawnManager, GAMEPLAY_CONFIG.token.collisionRadius);
      const tokenCollisions = new TokenCollisionSystem(
        GAMEPLAY_CONFIG.snake.headCollisionRadius,
      );
      const gameplay = new VocabularyGameplaySession(
        plan,
        this.#stateMachine,
        this.#snakeSimulation,
        tokenPool,
        tokenCollisions,
      );
      gameplay.subscribeToWordStarted((entry) => this.#recentHistory.remember(entry.target));

      this.#stateMachine.transition(GameState.TRANSITION_IN);
      this.#gameplay = gameplay;
      this.#panel = new PhaseThreePanel(this.#container);
      this.#selectionScreen.hide();
      this.#stateMachine.transition(GameState.HUNTING);
      this.#recentHistory.remember(gameplay.status.entry.target);
      this.#input.attach();
    } catch (error) {
      this.#selectionScreen.showError(error);
    }
  };

  readonly #render = (): void => {
    if (!this.#scene || !this.#timer) return;
    this.#timer.update();
    this.#fixedStepRunner.advance(this.#timer.getDelta(), (stepSeconds) => {
      this.#gameplay?.update(stepSeconds);
    });

    const gameplayStatus = this.#gameplay?.status;
    this.#scene.render(
      this.#snake,
      this.#arena,
      this.#gameplay?.tokenEntities ?? [],
      gameplayStatus?.nextToken ?? null,
      this.#timer.getElapsed(),
    );
    if (gameplayStatus) this.#panel?.update(gameplayStatus, this.#snakeSimulation.status);
  };
}
