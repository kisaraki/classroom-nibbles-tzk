import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { Direction } from "./Direction";
import { Snake } from "./Snake";

describe("Snake", () => {
  it("moves continuously on the XZ plane at configured speed", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);

    snake.advance(0.5);

    expect(snake.headPosition.x).toBeCloseTo(0);
    expect(snake.headPosition.z).toBeCloseTo(-2.25);
  });

  it("changes cardinal direction immediately but rejects direct reversal", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);

    expect(snake.trySetDirection(Direction.SOUTH)).toBe(false);
    expect(snake.direction).toBe(Direction.NORTH);
    expect(snake.trySetDirection(Direction.EAST)).toBe(true);
    expect(snake.direction).toBe(Direction.EAST);
    expect(snake.trySetDirection(Direction.WEST)).toBe(false);
    expect(snake.direction).toBe(Direction.EAST);
  });

  it("places body segments along the recorded trail through corners", () => {
    const snake = new Snake({
      initialLength: 4,
      minimumLength: 3,
      maximumLength: 8,
      segmentSpacing: 1,
      speed: 1,
    });
    snake.advance(2);
    snake.trySetDirection(Direction.EAST);
    snake.advance(1);

    const segments = snake.getSegmentPositions();
    expect(segments[0]).toEqual({ x: 1, z: -2 });
    expect(segments[1]?.x).toBeCloseTo(0);
    expect(segments[1]?.z).toBeCloseTo(-2);
    expect(segments[2]?.x).toBeCloseTo(0);
    expect(segments[2]?.z).toBeCloseTo(-1);
  });

  it("clamps length changes to the configured minimum and maximum", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);

    snake.shrink(100);
    expect(snake.length).toBe(3);
    snake.grow(100);
    expect(snake.length).toBe(40);
  });
});
