import { describe, expect, it } from "vitest";
import { normalizeDevicePixelRatio } from "./DeviceResolution";

describe("normalizeDevicePixelRatio", () => {
  it("preserves the full finite device pixel ratio without a quality cap", () => {
    expect(normalizeDevicePixelRatio(1)).toBe(1);
    expect(normalizeDevicePixelRatio(2.625)).toBe(2.625);
    expect(normalizeDevicePixelRatio(4)).toBe(4);
  });

  it("falls back safely when the browser reports an invalid ratio", () => {
    expect(normalizeDevicePixelRatio(0)).toBe(1);
    expect(normalizeDevicePixelRatio(Number.NaN)).toBe(1);
    expect(normalizeDevicePixelRatio(Number.POSITIVE_INFINITY)).toBe(1);
  });
});
