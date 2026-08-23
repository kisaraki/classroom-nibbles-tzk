import { GAMEPLAY_CONFIG } from "./Config";
import { GameState, type GameState as GameStateValue } from "./GameState";
import type { StateMachine } from "./StateMachine";

export class TacticalMapController {
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #expandedTimeScale: number;
  #pendingOpen = false;

  constructor(
    stateMachine: StateMachine<GameStateValue>,
    expandedTimeScale = GAMEPLAY_CONFIG.tacticalMap.timeScale,
  ) {
    if (!Number.isFinite(expandedTimeScale) || expandedTimeScale <= 0 || expandedTimeScale >= 1) {
      throw new Error("Tactical-map time scale must be finite and between zero and one.");
    }
    this.#stateMachine = stateMachine;
    this.#expandedTimeScale = expandedTimeScale;
  }

  get expanded(): boolean {
    return this.#stateMachine.state === GameState.MAP_EXPANDED;
  }

  get timeScale(): number {
    return this.expanded ? this.#expandedTimeScale : 1;
  }

  get pendingOpen(): boolean {
    return this.#pendingOpen;
  }

  open(): boolean {
    if (this.#stateMachine.state === GameState.HUNTING) {
      this.#pendingOpen = false;
      this.#stateMachine.transition(GameState.MAP_EXPANDED);
      return true;
    }
    if (
      this.#stateMachine.state === GameState.TRANSITION_IN ||
      this.#stateMachine.state === GameState.STUNNED ||
      this.#stateMachine.state === GameState.RECOVERY
    ) {
      this.#pendingOpen = true;
      return true;
    }
    return false;
  }

  close(): boolean {
    if (this.#pendingOpen) {
      this.#pendingOpen = false;
      return true;
    }
    if (!this.expanded) return false;
    this.#stateMachine.transition(GameState.HUNTING);
    return true;
  }

  toggle(): boolean {
    return this.expanded || this.#pendingOpen ? this.close() : this.open();
  }

  fulfillPendingOpen(): boolean {
    if (!this.#pendingOpen || this.#stateMachine.state !== GameState.HUNTING) {
      return false;
    }
    return this.open();
  }

  cancelPendingOpen(): void {
    this.#pendingOpen = false;
  }
}
