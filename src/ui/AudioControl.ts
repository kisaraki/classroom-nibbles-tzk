export type AudioControlListener = () => boolean;

export class AudioControl {
  readonly #button: HTMLButtonElement;
  readonly #listener: AudioControlListener;

  constructor(
    container: HTMLElement,
    initiallyMuted: boolean,
    listener: AudioControlListener,
  ) {
    this.#listener = listener;
    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.className = "audio-control";
    this.#button.dataset.testid = "audio-control";
    this.#button.addEventListener("click", this.#onClick);
    this.setMuted(initiallyMuted);
    container.append(this.#button);
  }

  setMuted(muted: boolean): void {
    this.#button.dataset.muted = String(muted);
    this.#button.setAttribute("aria-pressed", String(muted));
    this.#button.setAttribute("aria-label", muted ? "開啟音效" : "關閉音效");
    this.#button.textContent = muted ? "音效：關" : "音效：開";
  }

  dispose(): void {
    this.#button.removeEventListener("click", this.#onClick);
    this.#button.remove();
  }

  readonly #onClick = (): void => {
    this.setMuted(this.#listener());
  };
}
