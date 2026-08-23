import { describe, expect, it } from "vitest";
import { createGameStateMachine, GameState } from "./GameState";

function enterRun() {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.VOCABULARY_SELECT);
  stateMachine.transition(GameState.TRANSITION_IN);
  stateMachine.transition(GameState.HUNTING);
  return stateMachine;
}

describe("release game-state lifecycle", () => {
  it("supports the complete successful run-to-credits and replay route", () => {
    const stateMachine = enterRun();
    stateMachine.transition(GameState.TYPING_TEST);
    stateMachine.transition(GameState.LEVEL_CLEAR);
    stateMachine.transition(GameState.GAME_CLEAR);
    stateMachine.transition(GameState.CREDITS);
    stateMachine.transition(GameState.MAIN_MENU);
    stateMachine.transition(GameState.VOCABULARY_SELECT);

    expect(stateMachine.state).toBe(GameState.VOCABULARY_SELECT);
  });

  it("supports failure recovery without introducing collision death", () => {
    const stateMachine = enterRun();
    stateMachine.transition(GameState.STUNNED);
    stateMachine.transition(GameState.PAUSED);
    stateMachine.transition(GameState.STUNNED);
    stateMachine.transition(GameState.RECOVERY);
    stateMachine.transition(GameState.LEVEL_FAILED);
    stateMachine.transition(GameState.MAIN_MENU);
    stateMachine.transition(GameState.VOCABULARY_SELECT);

    expect(stateMachine.state).toBe(GameState.VOCABULARY_SELECT);
  });

  it("rejects pause during the typing-test state", () => {
    const stateMachine = enterRun();
    stateMachine.transition(GameState.TYPING_TEST);

    expect(stateMachine.canTransition(GameState.PAUSED)).toBe(false);
    expect(() => stateMachine.transition(GameState.PAUSED)).toThrow(
      "Illegal state transition: TYPING_TEST -> PAUSED",
    );
  });
});
