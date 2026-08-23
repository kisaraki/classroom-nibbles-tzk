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

  it("closes back to hunting and queues requests made while controls recover", () => {
    const { controller, stateMachine } = createHuntingController();
    controller.open();

    expect(controller.close()).toBe(true);
    expect(stateMachine.state).toBe(GameState.HUNTING);
    stateMachine.transition(GameState.STUNNED);
    expect(controller.toggle()).toBe(true);
    expect(controller.pendingOpen).toBe(true);
    expect(controller.timeScale).toBe(1);
    stateMachine.transition(GameState.RECOVERY);
    stateMachine.transition(GameState.HUNTING);
    expect(controller.fulfillPendingOpen()).toBe(true);
    expect(stateMachine.state).toBe(GameState.MAP_EXPANDED);
    expect(controller.pendingOpen).toBe(false);
  });

  it("queues an entrance request and lets a second toggle cancel it", () => {
    const stateMachine = createGameStateMachine();
    stateMachine.transition(GameState.MAIN_MENU);
    stateMachine.transition(GameState.VOCABULARY_SELECT);
    stateMachine.transition(GameState.TRANSITION_IN);
    const controller = new TacticalMapController(stateMachine);

    expect(controller.toggle()).toBe(true);
    expect(controller.pendingOpen).toBe(true);
    expect(controller.toggle()).toBe(true);
    expect(controller.pendingOpen).toBe(false);
    stateMachine.transition(GameState.HUNTING);
    expect(controller.fulfillPendingOpen()).toBe(false);
  });
});
