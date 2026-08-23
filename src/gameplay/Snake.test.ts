import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { Direction } from "./Direction";
import { Snake } from "./Snake";

describe("Snake", () => {
  it("moves continuously on the XZ plane at configured speed", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);

    snake.advance(0.5);

    expect(snake.headPosition.x).toBeCloseTo(0);
    expect(snake.headPosition.z).toBeCloseTo(-1.5);
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

  it("switches to a positive finite per-level speed", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);

    snake.setSpeed(6);
    snake.advance(0.5);

    expect(snake.speed).toBe(6);
    expect(snake.headPosition.z).toBeCloseTo(-3);
    expect(() => snake.setSpeed(0)).toThrow("finite and positive");
  });

  it("turns the tail into the new head without curling into the preserved body", () => {
    const snake = new Snake({
      initialLength: 6,
      minimumLength: 3,
      maximumLength: 8,
      segmentSpacing: 1,
      minimumUTurnDistance: 1,
      speed: 1,
    });
    snake.advance(2);
    snake.trySetDirection(Direction.EAST);
    snake.advance(2);
    const originalSegments = snake.getSegmentPositions();

    snake.reverseOrientation();

    const reversedSegments = snake.getSegmentPositions();
    expect(snake.headPosition).toEqual(originalSegments.at(-1));
    expect(snake.direction).toBe(Direction.SOUTH);
    reversedSegments.forEach((segment, index) => {
      const original = originalSegments.at(-(index + 1));
      expect(segment.x).toBeCloseTo(original!.x);
      expect(segment.z).toBeCloseTo(original!.z);
    });

    snake.advance(0.25);
    expect(snake.headPosition.z).toBeGreaterThan(reversedSegments[0]!.z);
  });

  it("resets the scene pose and trail without discarding earned length", () => {
    const snake = new Snake(GAMEPLAY_CONFIG.snake);
    snake.grow(3);
    snake.advance(1);
    snake.trySetDirection(Direction.EAST);
    snake.advance(1);

    snake.resetPose();

    expect(snake.headPosition).toEqual({ x: 0, z: 0 });
    expect(snake.direction).toBe(Direction.NORTH);
    expect(snake.length).toBe(11);
    expect(snake.getSegmentPositions()[1]).toEqual({ x: 0, z: 0.75 });
    expect(snake.trySetDirection(Direction.EAST)).toBe(true);
    expect(snake.trySetDirection(Direction.SOUTH)).toBe(false);
  });
});
