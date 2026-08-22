export type PauseInputListener = () => boolean;

export class PauseInput {
  readonly #listener: PauseInputListener;
  #attached = false;

  constructor(listener: PauseInputListener) {
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
    if (event.code !== "KeyP" || event.repeat) return;
    if (this.#listener()) event.preventDefault();
  };
}
