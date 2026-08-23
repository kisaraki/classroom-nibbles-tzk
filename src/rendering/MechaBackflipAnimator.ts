export interface MechaBackflipPose {
  readonly active: boolean;
  readonly progress: number;
  readonly rotationRadians: number;
  readonly lift: number;
}

function easeInOut(progress: number): number {
  return 0.5 - Math.cos(Math.PI * progress) / 2;
}

export class MechaBackflipAnimator {
  readonly #durationSeconds: number;
  #elapsedSeconds = 0;
  #active = false;

  constructor(durationSeconds: number) {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error("Mecha backflip duration must be finite and positive.");
    }
    this.#durationSeconds = durationSeconds;
  }

  get active(): boolean {
    return this.#active;
  }

  get progress(): number {
    return this.#active
      ? Math.min(this.#elapsedSeconds / this.#durationSeconds, 1)
      : 0;
  }

  get pose(): MechaBackflipPose {
    if (!this.#active) {
      return Object.freeze({
        active: false,
        progress: 0,
        rotationRadians: 0,
        lift: 0,
      });
    }
    const progress = this.progress;
    return Object.freeze({
      active: this.#active,
      progress,
      rotationRadians: -Math.PI * 2 * easeInOut(progress),
      lift: Math.sin(Math.PI * progress) * 0.82,
    });
  }

  trigger(): boolean {
    if (this.#active) return false;
    this.#elapsedSeconds = 0;
    this.#active = true;
    return true;
  }

  update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error("Mecha backflip deltaSeconds must be finite and non-negative.");
    }
    if (!this.#active) return;
    this.#elapsedSeconds = Math.min(
      this.#elapsedSeconds + deltaSeconds,
      this.#durationSeconds,
    );
    if (this.#elapsedSeconds >= this.#durationSeconds) {
      this.#elapsedSeconds = 0;
      this.#active = false;
    }
  }
}
