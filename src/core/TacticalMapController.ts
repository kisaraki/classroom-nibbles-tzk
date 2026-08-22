import { GAMEPLAY_CONFIG } from "./Config";
import { GameState, type GameState as GameStateValue } from "./GameState";
import type { StateMachine } from "./StateMachine";

export class TacticalMapController {
  readonly #stateMachine: StateMachine<GameStateValue>;
  readonly #expandedTimeScale: number;

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

  open(): boolean {
    if (this.#stateMachine.state !== GameState.HUNTING) return false;
    this.#stateMachine.transition(GameState.MAP_EXPANDED);
    return true;
  }

  close(): boolean {
    if (!this.expanded) return false;
    this.#stateMachine.transition(GameState.HUNTING);
    return true;
  }

  toggle(): boolean {
    return this.expanded ? this.close() : this.open();
  }
}
