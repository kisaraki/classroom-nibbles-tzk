import { StateMachine, type TransitionMap } from "./StateMachine";

export const GameState = Object.freeze({
  BOOT: "BOOT",
  MAIN_MENU: "MAIN_MENU",
  VOCABULARY_SELECT: "VOCABULARY_SELECT",
  TRANSITION_IN: "TRANSITION_IN",
  HUNTING: "HUNTING",
  STUNNED: "STUNNED",
  RECOVERY: "RECOVERY",
  TYPING_TEST: "TYPING_TEST",
  PAUSED: "PAUSED",
  LEVEL_CLEAR: "LEVEL_CLEAR",
  LEVEL_FAILED: "LEVEL_FAILED",
  GAME_CLEAR: "GAME_CLEAR",
  CREDITS: "CREDITS",
} as const);

export type GameState = (typeof GameState)[keyof typeof GameState];

const GAME_TRANSITIONS: TransitionMap<GameState> = Object.freeze({
  [GameState.BOOT]: Object.freeze([GameState.MAIN_MENU]),
  [GameState.MAIN_MENU]: Object.freeze([
    GameState.VOCABULARY_SELECT,
    GameState.TRANSITION_IN,
  ]),
  [GameState.VOCABULARY_SELECT]: Object.freeze([
    GameState.MAIN_MENU,
    GameState.TRANSITION_IN,
  ]),
  [GameState.TRANSITION_IN]: Object.freeze([GameState.HUNTING]),
  [GameState.HUNTING]: Object.freeze([
    GameState.STUNNED,
    GameState.TYPING_TEST,
    GameState.PAUSED,
    GameState.LEVEL_CLEAR,
    GameState.LEVEL_FAILED,
  ]),
  [GameState.STUNNED]: Object.freeze([
    GameState.HUNTING,
    GameState.RECOVERY,
    GameState.PAUSED,
    GameState.LEVEL_FAILED,
  ]),
  [GameState.RECOVERY]: Object.freeze([
    GameState.HUNTING,
    GameState.PAUSED,
    GameState.LEVEL_FAILED,
  ]),
  [GameState.TYPING_TEST]: Object.freeze([
    GameState.HUNTING,
    GameState.LEVEL_CLEAR,
    GameState.LEVEL_FAILED,
  ]),
  [GameState.PAUSED]: Object.freeze([
    GameState.HUNTING,
    GameState.STUNNED,
    GameState.RECOVERY,
  ]),
  [GameState.LEVEL_CLEAR]: Object.freeze([GameState.TRANSITION_IN, GameState.GAME_CLEAR]),
  [GameState.LEVEL_FAILED]: Object.freeze([GameState.MAIN_MENU]),
  [GameState.GAME_CLEAR]: Object.freeze([GameState.CREDITS]),
  [GameState.CREDITS]: Object.freeze([GameState.MAIN_MENU]),
});

export function createGameStateMachine(): StateMachine<GameState> {
  return new StateMachine(GameState.BOOT, GAME_TRANSITIONS);
}
