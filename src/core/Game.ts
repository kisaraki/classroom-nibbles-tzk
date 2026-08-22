import * as THREE from "three";
import { AudioManager, SoundCue } from "../audio/AudioManager";
import { Arena } from "../gameplay/Arena";
import { CollisionSystem } from "../gameplay/CollisionSystem";
import { EnvironmentController } from "../gameplay/Environment";
import { PowerUpPool } from "../gameplay/PowerUpPool";
import { PowerUpWeaponSession } from "../gameplay/PowerUpWeaponSession";
import { Snake } from "../gameplay/Snake";
import { SnakeSimulation } from "../gameplay/SnakeSimulation";
import { SpawnManager } from "../gameplay/SpawnManager";
import { TokenCollisionSystem } from "../gameplay/TokenCollisionSystem";
import { TokenPool } from "../gameplay/TokenPool";
import { WeaponSystem } from "../gameplay/WeaponSystem";
import {
  TypingAttemptKind,
  TypingTestSession,
  TypingTestState,
} from "../gameplay/TypingTestSession";
import {
  TokenCollectionKind,
  VocabularyGameplaySession,
} from "../gameplay/VocabularyGameplaySession";
import { DirectionInput } from "../input/DirectionInput";
import { PauseInput } from "../input/PauseInput";
import { TacticalMapInput } from "../input/TacticalMapInput";
import { WeaponInput } from "../input/WeaponInput";
import { PhaseThreeScene } from "../rendering/PhaseThreeScene";
import { BootScreen } from "../ui/BootScreen";
import { AudioControl } from "../ui/AudioControl";
import { CockpitOverlay } from "../ui/CockpitOverlay";
import { CreditsScreen } from "../ui/CreditsScreen";
import { PhaseThreePanel } from "../ui/PhaseThreePanel";
import { RadarMap } from "../ui/RadarMap";
import { TypingTestModal } from "../ui/TypingTestModal";
import { TransitionOverlay } from "../ui/TransitionOverlay";
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
import { PauseController, PauseReason } from "./PauseController";
import { SeededRandom } from "./SeededRandom";
import { TacticalMapController } from "./TacticalMapController";

export class Game {
  readonly #container: HTMLElement;
  readonly #bootScreen: BootScreen;
  readonly #stateMachine = createGameStateMachine();
  readonly #arena = new Arena(GAMEPLAY_CONFIG.arena);
  readonly #environment = new EnvironmentController();
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
    () => this.#environment.obstacles,
  );
  readonly #fixedStepRunner = new FixedStepRunner({
    stepSeconds: GAMEPLAY_CONFIG.fixedStepSeconds,
    maximumFrameDeltaSeconds: GAMEPLAY_CONFIG.maximumFrameDeltaSeconds,
    maximumUpdatesPerFrame: GAMEPLAY_CONFIG.maximumUpdatesPerFrame,
  });
  readonly #input = new DirectionInput((direction) => {
    this.#snakeSimulation.requestDirection(direction);
  });
  readonly #weaponInput = new WeaponInput(() => {
    if (this.#powerUpWeapon?.fire()) this.#audio.play(SoundCue.SHOT);
  });
  readonly #tacticalMapController = new TacticalMapController(this.#stateMachine);
  readonly #tacticalMapInput = new TacticalMapInput({
    toggle: () => this.#tacticalMapController.toggle(),
    close: () => this.#tacticalMapController.close(),
  });
  readonly #recentHistory = new RecentTargetHistory();
  readonly #audio = new AudioManager();
  readonly #transitionOverlay: TransitionOverlay;
  readonly #pauseController: PauseController;
  readonly #pauseInput: PauseInput;
  readonly #audioControl: AudioControl;
  readonly #unsubscribeStateChange: () => void;
  readonly #unsubscribeCollision: () => void;
  #scene: PhaseThreeScene | null = null;
  #selectionScreen: VocabularySelectScreen | null = null;
  #panel: PhaseThreePanel | null = null;
  #cockpitOverlay: CockpitOverlay | null = null;
  #radarMap: RadarMap | null = null;
  #repository: VocabularyRepository | null = null;
  #gameplay: VocabularyGameplaySession | null = null;
  #powerUpWeapon: PowerUpWeaponSession | null = null;
  #typingTest: TypingTestSession | null = null;
  #typingModal: TypingTestModal | null = null;
  #creditsScreen: CreditsScreen | null = null;
  #timer: THREE.Timer | null = null;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#bootScreen = new BootScreen(container);
    this.#transitionOverlay = new TransitionOverlay(container);
    this.#pauseController = new PauseController(
      this.#stateMachine,
      this.#transitionOverlay,
    );
    this.#pauseInput = new PauseInput(() => this.#pauseController.toggle());
    this.#audioControl = new AudioControl(
      container,
      this.#audio.muted,
      () => this.#audio.toggleMuted(),
    );
    this.#unsubscribeStateChange = this.#stateMachine.subscribe(this.#onStateChange);
    this.#unsubscribeCollision = this.#snakeSimulation.subscribeToCollisions(() => {
      this.#audio.play(SoundCue.COLLISION);
    });
    document.addEventListener("visibilitychange", this.#onVisibilityChange);
  }

  async start(): Promise<void> {
    this.#bootScreen.setLoading();
    try {
      this.#scene = new PhaseThreeScene(
        this.#container,
        this.#arena,
        this.#environment.current,
      );
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
      this.#pauseInput.attach();
      this.#bootScreen.hide();
    } catch (error) {
      this.#bootScreen.showError(error);
    }
  }

  dispose(): void {
    this.#input.detach();
    this.#weaponInput.detach();
    this.#tacticalMapInput.detach();
    this.#pauseInput.detach();
    this.#stopTypingTest();
    this.#disposeRunPresentation();
    this.#unsubscribeStateChange();
    this.#unsubscribeCollision();
    document.removeEventListener("visibilitychange", this.#onVisibilityChange);
    this.#selectionScreen?.dispose();
    this.#audioControl.dispose();
    this.#transitionOverlay.dispose();
    this.#audio.dispose();
    this.#scene?.dispose();
    this.#timer?.dispose();
  }

  readonly #startRun = (selection: VocabularySelection): void => {
    if (!this.#repository || !this.#selectionScreen) return;
    try {
      this.#disposeRunPresentation();
      this.#snake.resetPose({ length: GAMEPLAY_CONFIG.snake.initialLength });
      this.#fixedStepRunner.reset();
      const selector = new WordSelector(this.#repository.eligibleEntries);
      const plan = selector.createRun(
        selection.mode,
        selection.seed,
        this.#recentHistory.load(),
      );
      const initialEnvironment = this.#environment.select(plan.scenes[0]!.gameLevel);
      this.#scene?.setEnvironment(initialEnvironment);
      this.#audio.setEnvironment(initialEnvironment.kind);
      void this.#audio.unlock().then(() => {
        this.#audio.play(SoundCue.MENU_ACCEPT);
      });
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
        () => this.#environment.obstacles,
      );
      let powerUpPool: PowerUpPool | null = null;
      const tokenPool = new TokenPool(
        spawnManager,
        GAMEPLAY_CONFIG.token.collisionRadius,
        () => powerUpPool?.spawnOccupants ?? [],
      );
      powerUpPool = new PowerUpPool(
        spawnManager,
        GAMEPLAY_CONFIG.powerUp.collisionRadius,
        () => tokenPool.entities.map((entity) => ({
          position: entity.position,
          radius: entity.radius,
        })),
      );
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
      const powerUpWeapon = new PowerUpWeaponSession(
        this.#stateMachine,
        this.#snake,
        this.#arena,
        tokenPool,
        powerUpPool,
        new WeaponSystem(
          this.#arena,
          GAMEPLAY_CONFIG.weapon,
          () => this.#environment.obstacles,
        ),
        GAMEPLAY_CONFIG.snake.headCollisionRadius,
        GAMEPLAY_CONFIG.powerUp.attackAmmoReward,
        (deltaSeconds) => {
          gameplay.adjustMainTime(deltaSeconds);
        },
      );
      gameplay.subscribeToWordStarted((entry) => this.#recentHistory.remember(entry.target));
      gameplay.subscribeToTokenCollections((result) => {
        this.#audio.play(
          result.kind === TokenCollectionKind.CORRECT
            ? SoundCue.CORRECT_TOKEN
            : SoundCue.WRONG_TOKEN,
        );
      });
      gameplay.subscribeToSceneStarted((scenePlan) => {
        const environment = this.#environment.select(scenePlan.gameLevel);
        this.#snakeSimulation.resetForScene();
        this.#fixedStepRunner.reset();
        this.#scene?.setEnvironment(environment);
        this.#audio.setEnvironment(environment.kind);
        powerUpWeapon.resetEnvironment();
        tokenPool.reset(this.#snake);
      });
      powerUpWeapon.subscribeToPowerUpCollections(() => {
        this.#audio.play(SoundCue.POWER_UP);
      });
      powerUpWeapon.subscribeToBulletImpacts(() => {
        this.#audio.play(SoundCue.BULLET_IMPACT);
      });

      this.#gameplay = gameplay;
      this.#powerUpWeapon = powerUpWeapon;
      this.#panel = new PhaseThreePanel(this.#container);
      this.#cockpitOverlay = new CockpitOverlay(this.#container);
      this.#radarMap = new RadarMap(
        this.#container,
        this.#arena,
        () => {
          this.#tacticalMapController.toggle();
        },
      );
      this.#tacticalMapInput.attach();
      this.#selectionScreen.hide();
      this.#recentHistory.remember(gameplay.status.entry.target);
      this.#stateMachine.transition(GameState.TRANSITION_IN);
    } catch (error) {
      this.#selectionScreen.showError(error);
    }
  };

  readonly #render = (): void => {
    if (!this.#scene || !this.#timer) return;
    this.#timer.update();
    this.#updateTypingTest(performance.now());
    const frameDeltaSeconds = this.#timer.getDelta();
    this.#fixedStepRunner.advance(
      frameDeltaSeconds * this.#tacticalMapController.timeScale,
      (stepSeconds) => {
        this.#gameplay?.update(stepSeconds);
        this.#powerUpWeapon?.update(stepSeconds);
      },
    );

    const gameplayStatus = this.#gameplay?.status;
    this.#scene.render(
      this.#snake,
      this.#arena,
      this.#gameplay?.tokenEntities ?? [],
      this.#powerUpWeapon?.powerUpEntities ?? [],
      this.#powerUpWeapon?.bulletEntities ?? [],
      gameplayStatus?.nextToken ?? null,
      this.#timer.getElapsed(),
      frameDeltaSeconds,
    );
    if (gameplayStatus && this.#powerUpWeapon) {
      this.#radarMap?.update({
        snakeSegments: this.#snake.getSegmentPositions(),
        snakeDirection: this.#snake.direction,
        tokens: this.#gameplay?.tokenEntities ?? [],
        powerUps: this.#powerUpWeapon.powerUpEntities,
        bullets: this.#powerUpWeapon.bulletEntities,
        obstacles: this.#environment.obstacles,
        nextToken: gameplayStatus.nextToken,
      });
    }
    if (gameplayStatus && this.#powerUpWeapon) {
      this.#panel?.update(
        gameplayStatus,
        this.#snakeSimulation.status,
        this.#powerUpWeapon.status,
        this.#environment.current,
      );
    }
  };

  readonly #onStateChange = (
    current: ReturnType<typeof createGameStateMachine>["state"],
    previous: ReturnType<typeof createGameStateMachine>["state"],
  ): void => {
    this.#radarMap?.setExpanded(
      current === GameState.MAP_EXPANDED,
      current === GameState.MAP_EXPANDED ? this.#tacticalMapController.timeScale : 1,
    );
    if (current === GameState.TRANSITION_IN) {
      this.#input.detach();
      this.#weaponInput.detach();
      this.#transitionOverlay.playSceneTransition(this.#environment.current, () => {
        if (this.#stateMachine.state !== GameState.TRANSITION_IN) return;
        this.#audio.play(SoundCue.SCENE_ENTER);
        this.#stateMachine.transition(GameState.HUNTING);
      });
      return;
    }
    if (current === GameState.PAUSED) {
      this.#audio.play(SoundCue.PAUSE);
      return;
    }
    if (previous === GameState.PAUSED) this.#audio.play(SoundCue.RESUME);
    if (current === GameState.TYPING_TEST) {
      this.#startTypingTest();
      return;
    }
    if (previous === GameState.TYPING_TEST) this.#stopTypingTest();
    if (current === GameState.GAME_CLEAR) {
      this.#input.detach();
      this.#weaponInput.detach();
      this.#audio.play(SoundCue.GAME_CLEAR);
      this.#transitionOverlay.playMissionComplete(() => {
        if (this.#stateMachine.state === GameState.GAME_CLEAR) {
          this.#stateMachine.transition(GameState.CREDITS);
        }
      });
      return;
    }
    if (current === GameState.CREDITS) {
      this.#creditsScreen?.dispose();
      this.#creditsScreen = new CreditsScreen(this.#container, this.#returnToSelection);
      return;
    }
    if (current === GameState.HUNTING) {
      this.#input.attach();
      this.#weaponInput.attach();
    }
  };

  readonly #onVisibilityChange = (): void => {
    this.#updateTypingTest(performance.now());
    if (document.hidden) this.#pauseController.pause(PauseReason.VISIBILITY);
  };

  #startTypingTest(): void {
    if (!this.#gameplay) return;
    this.#input.detach();
    this.#weaponInput.detach();
    this.#stopTypingTest();
    const config = GAMEPLAY_CONFIG.typingTest;
    const typingTest = new TypingTestSession(
      this.#gameplay.status.entry.target,
      performance.now(),
      {
        durationSeconds: config.durationSeconds,
        requiredConsecutiveSuccesses: config.requiredConsecutiveSuccesses,
      },
    );
    this.#typingTest = typingTest;
    this.#typingModal = new TypingTestModal(
      this.#container,
      this.#gameplay.status.entry,
      typingTest.status,
      this.#submitTypingAnswer,
    );
  }

  #stopTypingTest(): void {
    this.#typingModal?.dispose();
    this.#typingModal = null;
    this.#typingTest = null;
  }

  readonly #submitTypingAnswer = (value: string): void => {
    if (!this.#typingTest || !this.#gameplay) return;
    const result = this.#typingTest.submit(value, performance.now());
    this.#typingModal?.update(this.#typingTest.status);
    if (!result) return;
    if (result.kind === TypingAttemptKind.TIMED_OUT) {
      this.#audio.play(SoundCue.TYPING_WRONG);
      this.#gameplay.handleTypingTimeout();
    } else if (result.completed) {
      this.#audio.play(SoundCue.TYPING_COMPLETE);
      this.#gameplay.advanceAfterTypingSuccess();
    } else if (result.kind === TypingAttemptKind.CORRECT) {
      this.#audio.play(SoundCue.TYPING_CORRECT);
    } else {
      this.#audio.play(SoundCue.TYPING_WRONG);
    }
  };

  #updateTypingTest(nowMilliseconds: number): void {
    if (!this.#typingTest || !this.#gameplay) return;
    const status = this.#typingTest.update(nowMilliseconds);
    this.#typingModal?.update(status);
    if (status.state === TypingTestState.TIMED_OUT) {
      this.#audio.play(SoundCue.TYPING_WRONG);
      this.#gameplay.handleTypingTimeout();
    }
  }

  readonly #returnToSelection = (): void => {
    if (this.#stateMachine.state !== GameState.CREDITS) return;
    this.#disposeRunPresentation();
    this.#stateMachine.transition(GameState.MAIN_MENU);
    this.#stateMachine.transition(GameState.VOCABULARY_SELECT);
    this.#selectionScreen?.show();
  };

  #disposeRunPresentation(): void {
    this.#input.detach();
    this.#weaponInput.detach();
    this.#tacticalMapInput.detach();
    this.#stopTypingTest();
    this.#panel?.dispose();
    this.#cockpitOverlay?.dispose();
    this.#radarMap?.dispose();
    this.#creditsScreen?.dispose();
    this.#panel = null;
    this.#cockpitOverlay = null;
    this.#radarMap = null;
    this.#creditsScreen = null;
    this.#gameplay = null;
    this.#powerUpWeapon = null;
  }
}
