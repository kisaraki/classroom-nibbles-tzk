export interface ManeuverInputListeners {
  readonly backward: () => void;
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
    if (event.code !== "ArrowDown" && event.code !== "KeyJ") return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.code === "ArrowDown") this.#listeners.backward();
    else this.#listeners.backflip();
  };
}
