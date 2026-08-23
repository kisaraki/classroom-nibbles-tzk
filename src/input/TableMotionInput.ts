export interface TableMotionControls {
  readonly leftLifted: boolean;
  readonly rightLifted: boolean;
}

export type TableSide = "LEFT" | "RIGHT";
export type TableMotionInputListener = (controls: TableMotionControls) => void;

export function tableSideForCode(code: string): TableSide | null {
  if (code === "ShiftLeft") return "LEFT";
  if (code === "ShiftRight") return "RIGHT";
  return null;
}

export class TableMotionInput {
  readonly #listener: TableMotionInputListener;
  #leftLifted = false;
  #rightLifted = false;
  #attached = false;

  constructor(listener: TableMotionInputListener) {
    this.#listener = listener;
  }

  attach(): void {
    if (this.#attached) return;
    window.addEventListener("keydown", this.#onKeyDown);
    window.addEventListener("keyup", this.#onKeyUp);
    window.addEventListener("blur", this.#onBlur);
    this.#attached = true;
  }

  detach(): void {
    if (this.#attached) {
      window.removeEventListener("keydown", this.#onKeyDown);
      window.removeEventListener("keyup", this.#onKeyUp);
      window.removeEventListener("blur", this.#onBlur);
      this.#attached = false;
    }
    this.#clear();
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    const side = tableSideForCode(event.code);
    if (!side) return;
    event.preventDefault();
    if (side === "LEFT") {
      if (this.#leftLifted) return;
      this.#leftLifted = true;
    } else {
      if (this.#rightLifted) return;
      this.#rightLifted = true;
    }
    this.#emit();
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    const side = tableSideForCode(event.code);
    if (!side) return;
    event.preventDefault();
    if (side === "LEFT") {
      if (!this.#leftLifted) return;
      this.#leftLifted = false;
    } else {
      if (!this.#rightLifted) return;
      this.#rightLifted = false;
    }
    this.#emit();
  };

  readonly #onBlur = (): void => {
    this.#clear();
  };

  #clear(): void {
    if (!this.#leftLifted && !this.#rightLifted) return;
    this.#leftLifted = false;
    this.#rightLifted = false;
    this.#emit();
  }

  #emit(): void {
    this.#listener(Object.freeze({
      leftLifted: this.#leftLifted,
      rightLifted: this.#rightLifted,
    }));
  }
}
