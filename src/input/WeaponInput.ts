export type FireInputListener = () => void;

export class WeaponInput {
  readonly #listener: FireInputListener;
  #attached = false;

  constructor(listener: FireInputListener) {
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
    if (event.code !== "Space") return;
    event.preventDefault();
    if (!event.repeat) this.#listener();
  };
}
