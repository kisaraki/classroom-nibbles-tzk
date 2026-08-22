export interface TacticalMapInputActions {
  readonly toggle: () => boolean;
  readonly close: () => boolean;
}

export class TacticalMapInput {
  readonly #actions: TacticalMapInputActions;
  #attached = false;

  constructor(actions: TacticalMapInputActions) {
    this.#actions = actions;
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
    const handled = event.code === "KeyM"
      ? this.#actions.toggle()
      : event.code === "Escape"
        ? this.#actions.close()
        : false;
    if (handled) event.preventDefault();
  };
}
