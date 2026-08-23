import { GameState, type GameState as GameStateValue } from "./GameState";
import type { StateMachine } from "./StateMachine";

export const PauseReason = Object.freeze({
  USER: "USER",
  VISIBILITY: "VISIBILITY",
} as const);

export type PauseReason = (typeof PauseReason)[keyof typeof PauseReason];

export interface PausePresentation {
  closeForPause(reason: PauseReason): void;
  openFromPause(complete: () => void): void;
}

const PAUSABLE_STATES = new Set<GameStateValue>([
  GameState.HUNTING,
  GameState.STUNNED,
  GameState.RECOVERY,
]);

export class PauseController {
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #presentation: PausePresentation;
  #resumeState: GameStateValue = GameState.HUNTING;
  #resumePending = false;

  constructor(
    stateMachine: StateMachine<GameStateValue>,
    presentation: PausePresentation,
  ) {
    this.#stateMachine = stateMachine;
    this.#presentation = presentation;
  }

  get paused(): boolean {
    return this.#stateMachine.state === GameState.PAUSED;
  }

  get resumePending(): boolean {
    return this.#resumePending;
  }

  pause(reason: PauseReason = PauseReason.USER): boolean {
    if (!PAUSABLE_STATES.has(this.#stateMachine.state)) return false;
    this.#resumeState = this.#stateMachine.state;
    this.#resumePending = false;
    this.#stateMachine.transition(GameState.PAUSED);
    this.#presentation.closeForPause(reason);
    return true;
  }

  resume(): boolean {
    if (!this.paused || this.#resumePending) return false;
    this.#resumePending = true;
    this.#presentation.openFromPause(() => {
      this.#resumePending = false;
      if (this.#stateMachine.state !== GameState.PAUSED) return;
      this.#stateMachine.transition(this.#resumeState);
    });
    return true;
  }

  toggle(): boolean {
    return this.paused ? this.resume() : this.pause(PauseReason.USER);
  }
}
