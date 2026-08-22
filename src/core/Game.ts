import * as THREE from "three";
import { Arena } from "../gameplay/Arena";
import { CollisionSystem } from "../gameplay/CollisionSystem";
import { Snake } from "../gameplay/Snake";
import { SnakeSimulation } from "../gameplay/SnakeSimulation";
import { DirectionInput } from "../input/DirectionInput";
import { PhaseTwoScene } from "../rendering/PhaseTwoScene";
import { BootScreen } from "../ui/BootScreen";
import { PhaseTwoPanel } from "../ui/PhaseTwoPanel";
import { VocabularyRepository } from "../vocabulary/VocabularyRepository";
import { GAMEPLAY_CONFIG, getVocabularyUrl } from "./Config";
import { FixedStepRunner } from "./FixedStepRunner";
import { createGameStateMachine, GameState } from "./GameState";

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
  readonly #simulation = new SnakeSimulation(
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
    this.#simulation.requestDirection(direction);
  });
  #scene: PhaseTwoScene | null = null;
  #panel: PhaseTwoPanel | null = null;
  #timer: THREE.Timer | null = null;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#bootScreen = new BootScreen(container);
  }

  async start(): Promise<void> {
    this.#bootScreen.setLoading();
    try {
      this.#scene = new PhaseTwoScene(this.#container, this.#arena);
      const timer = new THREE.Timer();
      timer.connect(document);
      this.#timer = timer;
      this.#scene.setAnimationLoop(this.#render);

      const vocabulary = await VocabularyRepository.load(getVocabularyUrl());
      this.#panel = new PhaseTwoPanel(
        this.#container,
        vocabulary.metadata,
        this.#arena.config,
      );
      this.#bootScreen.hide();
      this.#stateMachine.transition(GameState.MAIN_MENU);
      this.#stateMachine.transition(GameState.TRANSITION_IN);
      this.#stateMachine.transition(GameState.HUNTING);
      this.#input.attach();
    } catch (error) {
      this.#bootScreen.showError(error);
    }
  }

  dispose(): void {
    this.#input.detach();
    this.#scene?.dispose();
    this.#timer?.dispose();
  }

  readonly #render = (): void => {
    if (!this.#scene || !this.#timer) return;
    this.#timer.update();
    this.#fixedStepRunner.advance(this.#timer.getDelta(), (stepSeconds) => {
      this.#simulation.update(stepSeconds);
    });
    this.#scene.render(this.#snake, this.#arena);
    this.#panel?.update(this.#simulation.status);
  };
}
