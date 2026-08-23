import { Direction, type Direction as DirectionValue } from "../gameplay/Direction";

export type DirectionInputListener = (direction: DirectionValue) => void;

const KEY_DIRECTIONS: Readonly<Record<string, DirectionValue>> = Object.freeze({
  ArrowUp: Direction.NORTH,
  KeyW: Direction.NORTH,
  KeyS: Direction.SOUTH,
  ArrowLeft: Direction.WEST,
  KeyA: Direction.WEST,
  ArrowRight: Direction.EAST,
  KeyD: Direction.EAST,
});

export class DirectionInput {
  readonly #listener: DirectionInputListener;
  #attached = false;

  constructor(listener: DirectionInputListener) {
    this.#listener = listener;
  }

  attach(): void {
    if (this.#attached) return;
    window.addEventListener("keydown", this.#onKeyDown);
    this.#attached = true;
  }

  detach(): void {
    if (!this.#attached) return;
    window.removeEventListener("keydown", this.#onKeyDown);
    this.#attached = false;
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    const direction = KEY_DIRECTIONS[event.code];
    if (!direction) return;
    event.preventDefault();
    this.#listener(direction);
  };
}
