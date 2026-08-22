import { describe, expect, it } from "vitest";
import { createGameStateMachine, GameState } from "./GameState";
import { TacticalMapController } from "./TacticalMapController";

function createHuntingController(): {
  readonly controller: TacticalMapController;
  readonly stateMachine: ReturnType<typeof createGameStateMachine>;
} {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.VOCABULARY_SELECT);
  stateMachine.transition(GameState.TRANSITION_IN);
  stateMachine.transition(GameState.HUNTING);
  return { controller: new TacticalMapController(stateMachine), stateMachine };
}

describe("TacticalMapController", () => {
  it("opens only from hunting and applies the required quarter-speed scale", () => {
    const { controller, stateMachine } = createHuntingController();

    expect(controller.timeScale).toBe(1);
    expect(controller.open()).toBe(true);
    expect(stateMachine.state).toBe(GameState.MAP_EXPANDED);
    expect(controller.expanded).toBe(true);
    expect(controller.timeScale).toBe(0.25);
    expect(controller.open()).toBe(false);
  });

  it("closes back to hunting and refuses unavailable states", () => {
    const { controller, stateMachine } = createHuntingController();
    controller.open();

    expect(controller.close()).toBe(true);
    expect(stateMachine.state).toBe(GameState.HUNTING);
    stateMachine.transition(GameState.STUNNED);
    expect(controller.toggle()).toBe(false);
    expect(controller.timeScale).toBe(1);
  });
});
