import { describe, expect, it } from "vitest";
import { Direction } from "../gameplay/Direction";
import { playerDirectionForCode } from "./DirectionInput";

describe("playerDirectionForCode", () => {
  it.each([
    ["ArrowUp", Direction.NORTH],
    ["KeyW", Direction.NORTH],
    ["ArrowDown", Direction.SOUTH],
    ["KeyS", Direction.SOUTH],
    ["ArrowLeft", Direction.WEST],
    ["KeyA", Direction.WEST],
    ["ArrowRight", Direction.EAST],
    ["KeyD", Direction.EAST],
  ] as const)("maps %s to the fixed player-view direction %s", (code, direction) => {
    expect(playerDirectionForCode(code)).toBe(direction);
  });

  it("ignores keys outside the player-view direction set", () => {
    expect(playerDirectionForCode("KeyJ")).toBeNull();
  });
});
