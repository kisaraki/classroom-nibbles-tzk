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

  it("rejects a rapid second corner that would curl the head back into its trail", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);

    expect(snake.trySetDirection(Direction.EAST)).toBe(true);
    expect(snake.trySetDirection(Direction.SOUTH)).toBe(false);
    expect(snake.direction).toBe(Direction.EAST);

    snake.advance(
      GAMEPLAY_CONFIG.snake.minimumUTurnDistance / GAMEPLAY_CONFIG.snake.speed,
    );

    expect(snake.trySetDirection(Direction.SOUTH)).toBe(true);
    expect(snake.direction).toBe(Direction.SOUTH);
  });

  it("places body segments along the recorded trail through corners", () => {
    const snake = new Snake({
      initialLength: 4,
      minimumLength: 3,
      maximumLength: 8,
      segmentSpacing: 1,
      minimumUTurnDistance: 1,
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

  it("restores its initial position, direction, length, and trail", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake, {
      position: { x: 2, z: 3 },
      direction: Direction.EAST,
      length: 9,
    });
    snake.advance(1);
    snake.trySetDirection(Direction.NORTH);
    snake.shrink(4);

    snake.reset();

    expect(snake.headPosition).toEqual({ x: 2, z: 3 });
    expect(snake.direction).toBe(Direction.EAST);
    expect(snake.length).toBe(9);
    expect(snake.getSegmentPositions()[1]).toEqual({ x: 1.25, z: 3 });
  });
});
