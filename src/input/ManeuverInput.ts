export interface ManeuverInputListeners {
  readonly backflip: () => void;
}

export class ManeuverInput {
  readonly #listeners: ManeuverInputListeners;
  #attached = false;

  constructor(listeners: ManeuverInputListeners) {
    this.#listeners = listeners;
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
    if (event.code !== "KeyJ") return;
    event.preventDefault();
    if (event.repeat) return;
    this.#listeners.backflip();
  };
}
