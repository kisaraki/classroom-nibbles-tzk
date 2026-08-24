export class PinballTableOverlay {
  readonly #element: HTMLElement;

  constructor(container: HTMLElement) {
    this.#element = document.createElement("div");
    this.#element.className = "pinball-table-overlay";
    this.#element.dataset.testid = "pinball-table-overlay";
    this.#element.setAttribute("aria-hidden", "true");

    const leftRail = document.createElement("span");
    leftRail.className = "pinball-table-overlay__rail pinball-table-overlay__rail--left";
    const rightRail = document.createElement("span");
    rightRail.className = "pinball-table-overlay__rail pinball-table-overlay__rail--right";
    const apron = document.createElement("span");
    apron.className = "pinball-table-overlay__apron";
    const label = document.createElement("span");
    label.className = "pinball-table-overlay__label";
    label.textContent = "NIBBLES // 深空航行";
    this.#element.append(leftRail, rightRail, apron, label);
    container.append(this.#element);
  }

  dispose(): void {
    this.#element.remove();
  }
}
