import { describe, expect, it } from "vitest";
import { createGameStateMachine, GameState } from "./GameState";
import {
  PauseController,
  PauseReason,
  type PausePresentation,
} from "./PauseController";

class TestPausePresentation implements PausePresentation {
  reason: PauseReason | null = null;
  complete: (() => void) | null = null;

  closeForPause(reason: PauseReason): void {
    this.reason = reason;
  }

  openFromPause(complete: () => void): void {
    this.complete = complete;
  }
}

function activeStateMachine() {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.TRANSITION_IN);
  stateMachine.transition(GameState.HUNTING);
  return stateMachine;
}

describe("PauseController", () => {
  it("pauses immediately and resumes only after the door opens", () => {
    const stateMachine = activeStateMachine();
    const presentation = new TestPausePresentation();
    const controller = new PauseController(stateMachine, presentation);

    expect(controller.pause(PauseReason.USER)).toBe(true);
    expect(stateMachine.state).toBe(GameState.PAUSED);
    expect(presentation.reason).toBe(PauseReason.USER);
    expect(controller.resume()).toBe(true);
    expect(stateMachine.state).toBe(GameState.PAUSED);
    expect(controller.resumePending).toBe(true);

    presentation.complete?.();
    expect(stateMachine.state).toBe(GameState.HUNTING);
    expect(controller.resumePending).toBe(false);
  });

  it("returns to the exact tactical-map state after an automatic pause", () => {
    const stateMachine = activeStateMachine();
    stateMachine.transition(GameState.MAP_EXPANDED);
    const presentation = new TestPausePresentation();
    const controller = new PauseController(stateMachine, presentation);

    expect(controller.pause(PauseReason.VISIBILITY)).toBe(true);
    expect(presentation.reason).toBe(PauseReason.VISIBILITY);
    controller.resume();
    presentation.complete?.();

    expect(stateMachine.state).toBe(GameState.MAP_EXPANDED);
  });

  it("preserves an in-progress stun while paused", () => {
    const stateMachine = activeStateMachine();
    stateMachine.transition(GameState.STUNNED);
    const presentation = new TestPausePresentation();
    const controller = new PauseController(stateMachine, presentation);

    expect(controller.pause()).toBe(true);
    controller.resume();
    presentation.complete?.();

    expect(stateMachine.state).toBe(GameState.STUNNED);
  });

  it("does not pause a typing test or terminal presentation", () => {
    const stateMachine = activeStateMachine();
    stateMachine.transition(GameState.TYPING_TEST);
    const controller = new PauseController(
      stateMachine,
      new TestPausePresentation(),
    );

    expect(controller.pause()).toBe(false);
    expect(controller.toggle()).toBe(false);
    expect(stateMachine.state).toBe(GameState.TYPING_TEST);
  });
});
