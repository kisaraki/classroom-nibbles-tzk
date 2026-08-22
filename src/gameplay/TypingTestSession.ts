export const TypingTestState = Object.freeze({
  ACTIVE: "ACTIVE",
  SUCCESS: "SUCCESS",
  TIMED_OUT: "TIMED_OUT",
} as const);

export type TypingTestState =
  (typeof TypingTestState)[keyof typeof TypingTestState];

export const TypingAttemptKind = Object.freeze({
  NONE: "NONE",
  CORRECT: "CORRECT",
  WRONG: "WRONG",
  TIMED_OUT: "TIMED_OUT",
} as const);

export type TypingAttemptKind =
  (typeof TypingAttemptKind)[keyof typeof TypingAttemptKind];

export interface TypingTestConfig {
  readonly durationSeconds: number;
  readonly requiredConsecutiveSuccesses: number;
}

export interface TypingTestStatus {
  readonly state: TypingTestState;
  readonly remainingSeconds: number;
  readonly consecutiveSuccesses: number;
  readonly requiredConsecutiveSuccesses: number;
  readonly attemptCount: number;
  readonly latestAttempt: TypingAttemptKind;
}

export interface TypingSubmissionResult {
  readonly kind: TypingAttemptKind;
  readonly completed: boolean;
  readonly consecutiveSuccesses: number;
}

export function normalizeTypingAnswer(value: string): string {
  return value.trim().toLocaleUpperCase("en-US");
}

export class TypingTestSession {
  readonly #expectedAnswer: string;
  readonly #config: TypingTestConfig;
  readonly #deadlineMilliseconds: number;
  #state: TypingTestState = TypingTestState.ACTIVE;
  #remainingSeconds: number;
  #consecutiveSuccesses = 0;
  #attemptCount = 0;
  #latestAttempt: TypingAttemptKind = TypingAttemptKind.NONE;

  constructor(
    expectedAnswer: string,
    startedAtMilliseconds: number,
    config: TypingTestConfig,
  ) {
    if (!expectedAnswer.trim()) throw new Error("Typing-test answer must not be empty.");
    if (!Number.isFinite(startedAtMilliseconds)) {
      throw new Error("Typing-test start time must be finite.");
    }
    if (
      !Number.isFinite(config.durationSeconds) ||
      config.durationSeconds <= 0 ||
      !Number.isInteger(config.requiredConsecutiveSuccesses) ||
      config.requiredConsecutiveSuccesses < 1
    ) {
      throw new Error("Invalid typing-test configuration.");
    }
    this.#expectedAnswer = normalizeTypingAnswer(expectedAnswer);
    this.#config = Object.freeze({ ...config });
    this.#remainingSeconds = config.durationSeconds;
    this.#deadlineMilliseconds = startedAtMilliseconds + config.durationSeconds * 1_000;
  }

  get status(): TypingTestStatus {
    return Object.freeze({
      state: this.#state,
      remainingSeconds: this.#remainingSeconds,
      consecutiveSuccesses: this.#consecutiveSuccesses,
      requiredConsecutiveSuccesses: this.#config.requiredConsecutiveSuccesses,
      attemptCount: this.#attemptCount,
      latestAttempt: this.#latestAttempt,
    });
  }

  update(nowMilliseconds: number): TypingTestStatus {
    this.#assertTime(nowMilliseconds);
    if (this.#state !== TypingTestState.ACTIVE) return this.status;
    this.#remainingSeconds = Math.max(
      0,
      (this.#deadlineMilliseconds - nowMilliseconds) / 1_000,
    );
    if (this.#remainingSeconds === 0) {
      this.#state = TypingTestState.TIMED_OUT;
      this.#latestAttempt = TypingAttemptKind.TIMED_OUT;
    }
    return this.status;
  }

  submit(value: string, nowMilliseconds: number): TypingSubmissionResult | null {
    this.update(nowMilliseconds);
    if (this.#state === TypingTestState.TIMED_OUT) {
      return Object.freeze({
        kind: TypingAttemptKind.TIMED_OUT,
        completed: false,
        consecutiveSuccesses: this.#consecutiveSuccesses,
      });
    }
    if (this.#state !== TypingTestState.ACTIVE) return null;

    this.#attemptCount += 1;
    if (normalizeTypingAnswer(value) !== this.#expectedAnswer) {
      this.#consecutiveSuccesses = 0;
      this.#latestAttempt = TypingAttemptKind.WRONG;
      return Object.freeze({
        kind: TypingAttemptKind.WRONG,
        completed: false,
        consecutiveSuccesses: 0,
      });
    }

    this.#consecutiveSuccesses += 1;
    this.#latestAttempt = TypingAttemptKind.CORRECT;
    const completed =
      this.#consecutiveSuccesses >= this.#config.requiredConsecutiveSuccesses;
    if (completed) this.#state = TypingTestState.SUCCESS;
    return Object.freeze({
      kind: TypingAttemptKind.CORRECT,
      completed,
      consecutiveSuccesses: this.#consecutiveSuccesses,
    });
  }

  #assertTime(nowMilliseconds: number): void {
    if (!Number.isFinite(nowMilliseconds)) {
      throw new Error("Typing-test current time must be finite.");
    }
  }
}
