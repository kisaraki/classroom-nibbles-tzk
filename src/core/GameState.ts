import { StateMachine, type TransitionMap } from "./StateMachine";

export const GameState = Object.freeze({
  BOOT: "BOOT",
  MAIN_MENU: "MAIN_MENU",
  VOCABULARY_SELECT: "VOCABULARY_SELECT",
  TRANSITION_IN: "TRANSITION_IN",
  HUNTING: "HUNTING",
  STUNNED: "STUNNED",
  RECOVERY: "RECOVERY",
  MAP_EXPANDED: "MAP_EXPANDED",
  TYPING_TEST: "TYPING_TEST",
  PAUSED: "PAUSED",
  LEVEL_CLEAR: "LEVEL_CLEAR",
  LEVEL_FAILED: "LEVEL_FAILED",
  GAME_CLEAR: "GAME_CLEAR",
  CREDITS: "CREDITS",
} as const);

export type GameState = (typeof GameState)[keyof typeof GameState];

const PHASE_ONE_TRANSITIONS: TransitionMap<GameState> = Object.freeze({
  [GameState.BOOT]: Object.freeze([GameState.MAIN_MENU]),
});

export function createPhaseOneStateMachine(): StateMachine<GameState> {
  return new StateMachine(GameState.BOOT, PHASE_ONE_TRANSITIONS);
}
