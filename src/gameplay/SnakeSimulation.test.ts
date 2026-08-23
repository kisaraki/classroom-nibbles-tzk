import { describe, expect, it } from "vitest";
import { GAMEPLAY_CONFIG } from "../core/Config";
import { createGameStateMachine, GameState } from "../core/GameState";
import { Arena, BoundaryMode } from "./Arena";
import { CollisionKind, CollisionSystem } from "./CollisionSystem";
import { Direction } from "./Direction";
import { Snake, type SnakeInitialState } from "./Snake";
import { SnakeSimulation } from "./SnakeSimulation";

function createActiveSimulation(
  arena: Arena,
  initial: SnakeInitialState = {},
  length: number = GAMEPLAY_CONFIG.snake.initialLength,
  obstacles: readonly { readonly position: { readonly x: number; readonly z: number }; readonly radius: number }[] = [],
): SnakeSimulation {
  const stateMachine = createGameStateMachine();
  stateMachine.transition(GameState.MAIN_MENU);
  stateMachine.transition(GameState.TRANSITION_IN);
  stateMachine.transition(GameState.HUNTING);
  const snake = new Snake(GAMEPLAY_CONFIG.snake, { ...initial, length });
  const collisions = new CollisionSystem({
    headRadius: GAMEPLAY_CONFIG.snake.headCollisionRadius,
    bodyRadius: GAMEPLAY_CONFIG.snake.bodyCollisionRadius,
    ignoredLeadingSegments: GAMEPLAY_CONFIG.snake.selfCollisionIgnoreSegments,
  });
  return new SnakeSimulation(
    snake,
    arena,
    collisions,
    stateMachine,
    GAMEPLAY_CONFIG.collision,
    () => obstacles,
  );
}

describe("SnakeSimulation", () => {
  it("continues movement and steering while hunting", () => {
    const arena = new Arena({
      halfWidth: 20,
      halfDepth: 20,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.SOLID,
    });
    const simulation = createActiveSimulation(arena);

    expect(simulation.requestDirection(Direction.EAST)).toBe(true);
    simulation.update(0.25);

    expect(simulation.status.state).toBe(GameState.HUNTING);
    expect(simulation.snake.headPosition.x).toBeCloseTo(
      GAMEPLAY_CONFIG.snake.speed * 0.25,
    );
  });

  it("wraps crossing segments individually instead of teleporting the whole snake", () => {
    const arena = new Arena({
      halfWidth: 5,
      halfDepth: 5,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.WRAP,
    });
    const simulation = createActiveSimulation(arena, {
      position: { x: 0, z: -4.9 },
      direction: Direction.NORTH,
    });

    simulation.update(0.05);
    const displayed = simulation.snake
      .getSegmentPositions()
      .slice(0, 2)
      .map((point) => arena.toDisplayPoint(point));

    expect(simulation.status.state).toBe(GameState.HUNTING);
    expect(displayed[0]?.z).toBeCloseTo(4.95);
    expect(displayed[1]?.z).toBeCloseTo(-4.3);
  });

  it("treats opposite WRAP edges as adjacent for collision distance", () => {
    const arena = new Arena({
      halfWidth: 5,
      halfDepth: 5,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.WRAP,
    });

    expect(arena.distanceSquared({ x: 0, z: -4.9 }, { x: 0, z: 4.9 })).toBeCloseTo(0.04);
  });

  it("applies stun and recovery after a SOLID wall without changing length", () => {
    const arena = new Arena({
      halfWidth: 5,
      halfDepth: 5,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.WRAP,
    });
    const simulation = createActiveSimulation(arena, {
      position: { x: 4.65, z: 0 },
      direction: Direction.EAST,
    });
    const startPosition = simulation.snake.headPosition;
    const startLength = simulation.snake.length;

    simulation.update(1 / 60);
    expect(simulation.status.state).toBe(GameState.STUNNED);
    expect(simulation.status.latestCollision).toBe(CollisionKind.SOLID_WALL);
    expect(simulation.snake.headPosition).toEqual(startPosition);
    expect(simulation.snake.length).toBe(startLength);
    expect(simulation.requestDirection(Direction.NORTH)).toBe(false);

    simulation.update(1);
    expect(simulation.status.state).toBe(GameState.RECOVERY);
    expect(simulation.requestDirection(Direction.NORTH)).toBe(true);
    expect(simulation.snake.direction).toBe(Direction.NORTH);
    expect(simulation.requestDirection(Direction.WEST)).toBe(false);
    expect(simulation.snake.direction).toBe(Direction.NORTH);
    simulation.update(0.5);
    expect(simulation.status.state).toBe(GameState.HUNTING);
    expect(simulation.snake.headPosition).toEqual(startPosition);
  });

  it("applies the same non-lethal stun and recovery to environment obstacles", () => {
    const arena = new Arena({
      halfWidth: 9,
      halfDepth: 9,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.WRAP,
    });
    const simulation = createActiveSimulation(
      arena,
      { position: { x: 0, z: 0 }, direction: Direction.NORTH },
      8,
      [{ position: { x: 0, z: -1 }, radius: 0.6 }],
    );
    const startLength = simulation.snake.length;

    for (let index = 0; index < 10 && simulation.status.state === GameState.HUNTING; index += 1) {
      simulation.update(1 / 60);
    }

    expect(simulation.status.state).toBe(GameState.STUNNED);
    expect(simulation.status.latestCollision).toBe(CollisionKind.SOLID_OBSTACLE);
    expect(simulation.snake.length).toBe(startLength);
    simulation.update(1);
    expect(simulation.status.state).toBe(GameState.RECOVERY);
    simulation.update(0.5);
    expect(simulation.status.state).toBe(GameState.HUNTING);
  });

  it("clears collision telemetry and restores a safe pose between environments", () => {
    const arena = new Arena({
      halfWidth: 5,
      halfDepth: 5,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.WRAP,
    });
    const simulation = createActiveSimulation(arena, {
      position: { x: 4.65, z: 0 },
      direction: Direction.EAST,
    });
    simulation.update(1 / 60);
    expect(simulation.status.latestCollision).toBe(CollisionKind.SOLID_WALL);

    simulation.resetForScene();

    expect(simulation.snake.headPosition).toEqual({ x: 0, z: 0 });
    expect(simulation.snake.direction).toBe(Direction.NORTH);
    expect(simulation.status.latestCollision).toBeNull();
  });

  it("prevents two rapid corners from bypassing the direct-reversal guard", () => {
    const arena = new Arena({
      halfWidth: 20,
      halfDepth: 20,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.SOLID,
    });
    const simulation = createActiveSimulation(arena);

    expect(simulation.requestDirection(Direction.EAST)).toBe(true);
    expect(simulation.requestDirection(Direction.SOUTH)).toBe(false);
    expect(simulation.snake.direction).toBe(Direction.EAST);

    simulation.update(
      GAMEPLAY_CONFIG.snake.minimumUTurnDistance / GAMEPLAY_CONFIG.snake.speed,
    );

    expect(simulation.requestDirection(Direction.SOUTH)).toBe(true);
    expect(simulation.snake.direction).toBe(Direction.SOUTH);
  });

  it("maps the player's backward position to SOUTH regardless of nose heading", () => {
    const arena = new Arena({
      halfWidth: 20,
      halfDepth: 20,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.SOLID,
    });
    const simulation = createActiveSimulation(arena, {
      direction: Direction.EAST,
    });

    expect(simulation.requestPlayerDirection(Direction.SOUTH)).toBe(true);
    expect(simulation.snake.direction).toBe(Direction.SOUTH);
    expect(simulation.status.safeUTurnActive).toBe(false);
  });

  it("completes an opposite player-view request through a segment-spaced safe turn", () => {
    const arena = new Arena({
      halfWidth: 20,
      halfDepth: 20,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.SOLID,
    });
    const simulation = createActiveSimulation(arena);

    expect(simulation.requestPlayerDirection(Direction.SOUTH)).toBe(true);
    expect(simulation.snake.direction).toBe(Direction.EAST);
    expect(simulation.status.safeUTurnActive).toBe(true);
    expect(simulation.requestPlayerDirection(Direction.SOUTH)).toBe(false);

    for (let step = 0; step < 20; step += 1) simulation.update(1 / 60);

    expect(simulation.snake.direction).toBe(Direction.SOUTH);
    expect(simulation.status.safeUTurnActive).toBe(false);
    expect(simulation.status.state).toBe(GameState.HUNTING);
    expect(simulation.snake.headPosition.x).toBeGreaterThanOrEqual(
      GAMEPLAY_CONFIG.snake.segmentSpacing,
    );
  });

  it("uses a backflip escape to swap head and tail and reverse away from the body", () => {
    const arena = new Arena({
      halfWidth: 20,
      halfDepth: 20,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.SOLID,
    });
    const simulation = createActiveSimulation(arena);
    const oldHead = simulation.snake.headPosition;
    const oldTail = simulation.snake.getSegmentPositions().at(-1)!;

    expect(simulation.requestBackflipEscape()).toBe(true);
    expect(simulation.snake.headPosition).toEqual(oldTail);
    expect(simulation.snake.direction).toBe(Direction.SOUTH);
    expect(simulation.snake.headPosition).not.toEqual(oldHead);

    simulation.update(1 / 60);
    expect(simulation.status.state).toBe(GameState.HUNTING);
    expect(simulation.snake.headPosition.z).toBeGreaterThan(oldTail.z);
  });

  it("permits one backflip escape during recovery but never during stun", () => {
    const arena = new Arena({
      halfWidth: 5,
      halfDepth: 5,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.WRAP,
    });
    const simulation = createActiveSimulation(arena, {
      position: { x: 4.65, z: 0 },
      direction: Direction.EAST,
    });

    simulation.update(1 / 60);
    expect(simulation.status.state).toBe(GameState.STUNNED);
    expect(simulation.requestBackflipEscape()).toBe(false);

    simulation.update(1);
    expect(simulation.status.state).toBe(GameState.RECOVERY);
    expect(simulation.requestBackflipEscape()).toBe(true);
    expect(simulation.requestBackflipEscape()).toBe(false);
  });

  it("detects self collision as the same non-lethal delay penalty", () => {
    const arena = new Arena({
      halfWidth: 20,
      halfDepth: 20,
      xBoundaryMode: BoundaryMode.SOLID,
      zBoundaryMode: BoundaryMode.SOLID,
    });
    const simulation = createActiveSimulation(arena, {}, 24);
    const events: CollisionKind[] = [];
    simulation.subscribeToCollisions((event) => events.push(event.kind));
    const step = 1 / 60;
    const advance = (updates: number): void => {
      for (let index = 0; index < updates && simulation.status.state === GameState.HUNTING; index += 1) {
        simulation.update(step);
      }
    };

    advance(60);
    simulation.requestDirection(Direction.EAST);
    advance(60);
    simulation.requestDirection(Direction.SOUTH);
    advance(60);
    simulation.requestDirection(Direction.WEST);
    advance(80);

    expect(simulation.status.state).toBe(GameState.STUNNED);
    expect(simulation.status.latestCollision).toBe(CollisionKind.SELF);
    expect(events).toContain(CollisionKind.SELF);
    expect(simulation.snake.length).toBe(24);
  });
});
