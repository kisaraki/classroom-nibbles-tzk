export class CockpitOverlay {
  readonly #element: HTMLElement;

  constructor(container: HTMLElement) {
    this.#element = document.createElement("div");
    this.#element.className = "cockpit-overlay";
    this.#element.dataset.testid = "cockpit-overlay";
    this.#element.setAttribute("aria-hidden", "true");

    const reticle = document.createElement("span");
    reticle.className = "cockpit-overlay__reticle";
    const horizon = document.createElement("span");
    horizon.className = "cockpit-overlay__horizon";
    const leftStrut = document.createElement("span");
    leftStrut.className = "cockpit-overlay__strut cockpit-overlay__strut--left";
    const rightStrut = document.createElement("span");
    rightStrut.className = "cockpit-overlay__strut cockpit-overlay__strut--right";
    this.#element.append(reticle, horizon, leftStrut, rightStrut);
    container.append(this.#element);
  }

  dispose(): void {
    this.#element.remove();
  }
}
