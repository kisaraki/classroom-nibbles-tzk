import { describe, expect, it, vi } from "vitest";
import { FixedStepRunner } from "./FixedStepRunner";

const stepSeconds = 1 / 60;

function createRunner(): FixedStepRunner {
  return new FixedStepRunner({
    stepSeconds,
    maximumFrameDeltaSeconds: 0.1,
    maximumUpdatesPerFrame: 6,
  });
}

describe("FixedStepRunner", () => {
  it("accumulates partial frames into fixed 1/60 updates", () => {
    const update = vi.fn();
    const runner = createRunner();

    expect(runner.advance(stepSeconds / 2, update).updateCount).toBe(0);
    expect(runner.advance(stepSeconds / 2, update).updateCount).toBe(1);
    expect(update).toHaveBeenCalledWith(stepSeconds);
  });

  it("clamps long frames to 0.1 seconds and caps update work", () => {
    const update = vi.fn();
    const result = createRunner().advance(2, update);

    expect(result.frameDeltaSeconds).toBe(0.1);
    expect(result.updateCount).toBe(6);
    expect(update).toHaveBeenCalledTimes(6);
  });
});
