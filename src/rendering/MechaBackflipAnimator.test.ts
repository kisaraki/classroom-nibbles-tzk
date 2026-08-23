import { describe, expect, it } from "vitest";
import { MechaBackflipAnimator } from "./MechaBackflipAnimator";

describe("MechaBackflipAnimator", () => {
  it("animates one lifted body rotation without accepting duplicate triggers", () => {
    const animator = new MechaBackflipAnimator(0.8);

    expect(animator.trigger()).toBe(true);
    expect(animator.trigger()).toBe(false);
    animator.update(0.2);

    expect(animator.active).toBe(true);
    expect(animator.progress).toBeCloseTo(0.25);
    expect(animator.pose.rotationRadians).toBeLessThan(0);
    expect(animator.pose.lift).toBeGreaterThan(0);

    animator.update(0.6);
    expect(animator.active).toBe(false);
    expect(animator.progress).toBe(0);
    expect(animator.pose.rotationRadians).toBe(0);
    expect(animator.pose.lift).toBe(0);
  });

  it("rejects invalid frame deltas", () => {
    const animator = new MechaBackflipAnimator(0.8);
    expect(() => animator.update(-0.1)).toThrow(/deltaSeconds/);
  });
});
