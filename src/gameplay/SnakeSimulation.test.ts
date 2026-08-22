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
  );
}

describe("SnakeSimulation", () => {
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
    expect(displayed[0]?.z).toBeCloseTo(4.875);
    expect(displayed[1]?.z).toBeCloseTo(-4.375);
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
