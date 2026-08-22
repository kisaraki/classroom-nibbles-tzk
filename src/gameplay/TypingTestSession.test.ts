import { describe, expect, it } from "vitest";
import {
  TypingAttemptKind,
  TypingTestSession,
  TypingTestState,
  normalizeTypingAnswer,
} from "./TypingTestSession";

const CONFIG = Object.freeze({
  durationSeconds: 30,
  requiredConsecutiveSuccesses: 3,
});

describe("TypingTestSession", () => {
  it("compares case-insensitively after trimming only the outside whitespace", () => {
    expect(normalizeTypingAnswer("  Mass Rapid Transit  ")).toBe("MASS RAPID TRANSIT");
    expect(normalizeTypingAnswer("mass  rapid transit")).toBe("MASS  RAPID TRANSIT");

    const session = new TypingTestSession("MASS RAPID TRANSIT", 1_000, CONFIG);
    expect(session.submit("  mass rapid transit  ", 2_000)).toMatchObject({
      kind: TypingAttemptKind.CORRECT,
      consecutiveSuccesses: 1,
    });
    expect(session.submit("mass  rapid transit", 3_000)).toMatchObject({
      kind: TypingAttemptKind.WRONG,
      consecutiveSuccesses: 0,
    });
  });

  it("requires three consecutive correct submissions and resets the streak on error", () => {
    const session = new TypingTestSession("PING-PONG", 0, CONFIG);

    session.submit("ping-pong", 1_000);
    session.submit("PING-PONG", 2_000);
    expect(session.status.consecutiveSuccesses).toBe(2);
    session.submit("PING PONG", 3_000);
    expect(session.status.consecutiveSuccesses).toBe(0);
    session.submit("ping-pong", 4_000);
    session.submit(" ping-pong ", 5_000);
    const result = session.submit("PING-PONG", 6_000);

    expect(result).toMatchObject({
      kind: TypingAttemptKind.CORRECT,
      completed: true,
      consecutiveSuccesses: 3,
    });
    expect(session.status.state).toBe(TypingTestState.SUCCESS);
    expect(session.status.attemptCount).toBe(6);
  });

  it("requires internal periods, apostrophes, hyphens, and spaces to match", () => {
    const period = new TypingTestSession("THURS.", 0, CONFIG);
    const apostrophe = new TypingTestSession("CAN'T", 0, CONFIG);
    const space = new TypingTestSession("USED TO", 0, CONFIG);

    expect(period.submit("thurs", 1)?.kind).toBe(TypingAttemptKind.WRONG);
    expect(apostrophe.submit("cant", 1)?.kind).toBe(TypingAttemptKind.WRONG);
    expect(space.submit("used-to", 1)?.kind).toBe(TypingAttemptKind.WRONG);
  });

  it("uses an absolute real-time deadline and times out at thirty seconds", () => {
    const session = new TypingTestSession("GREEN", 5_000, CONFIG);

    expect(session.update(25_000).remainingSeconds).toBe(10);
    const status = session.update(35_000);

    expect(status.remainingSeconds).toBe(0);
    expect(status.state).toBe(TypingTestState.TIMED_OUT);
    expect(status.latestAttempt).toBe(TypingAttemptKind.TIMED_OUT);
    expect(session.submit("GREEN", 35_000)?.kind).toBe(TypingAttemptKind.TIMED_OUT);
  });
});
