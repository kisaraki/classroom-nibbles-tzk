export interface FixedStepResult {
  readonly frameDeltaSeconds: number;
  readonly updateCount: number;
  readonly interpolationAlpha: number;
}

export interface FixedStepRunnerConfig {
  readonly stepSeconds: number;
  readonly maximumFrameDeltaSeconds: number;
  readonly maximumUpdatesPerFrame: number;
}

const STEP_EPSILON = 1e-12;

export class FixedStepRunner {
  readonly #config: FixedStepRunnerConfig;
  #accumulatorSeconds = 0;

  constructor(config: FixedStepRunnerConfig) {
    if (config.stepSeconds <= 0 || config.maximumFrameDeltaSeconds <= 0) {
      throw new Error("Fixed-step timing values must be positive.");
    }
    if (!Number.isInteger(config.maximumUpdatesPerFrame) || config.maximumUpdatesPerFrame < 1) {
      throw new Error("maximumUpdatesPerFrame must be a positive integer.");
    }
    this.#config = config;
  }

  advance(frameDeltaSeconds: number, update: (stepSeconds: number) => void): FixedStepResult {
    if (!Number.isFinite(frameDeltaSeconds) || frameDeltaSeconds < 0) {
      throw new Error("frameDeltaSeconds must be a finite non-negative number.");
    }

    const clampedDelta = Math.min(frameDeltaSeconds, this.#config.maximumFrameDeltaSeconds);
    this.#accumulatorSeconds += clampedDelta;
    let updateCount = 0;

    while (
      this.#accumulatorSeconds + STEP_EPSILON >= this.#config.stepSeconds &&
      updateCount < this.#config.maximumUpdatesPerFrame
    ) {
      update(this.#config.stepSeconds);
      this.#accumulatorSeconds -= this.#config.stepSeconds;
      updateCount += 1;
    }

    if (this.#accumulatorSeconds < 0) this.#accumulatorSeconds = 0;

    return Object.freeze({
      frameDeltaSeconds: clampedDelta,
      updateCount,
      interpolationAlpha: this.#accumulatorSeconds / this.#config.stepSeconds,
    });
  }

  reset(): void {
    this.#accumulatorSeconds = 0;
  }
}
