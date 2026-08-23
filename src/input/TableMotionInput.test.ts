import { describe, expect, it } from "vitest";
import { tableSideForCode } from "./TableMotionInput";

describe("tableSideForCode", () => {
  it("distinguishes physical left and right Shift keys", () => {
    expect(tableSideForCode("ShiftLeft")).toBe("LEFT");
    expect(tableSideForCode("ShiftRight")).toBe("RIGHT");
  });

  it("ignores generic and unrelated key codes", () => {
    expect(tableSideForCode("Shift")).toBeNull();
    expect(tableSideForCode("KeyJ")).toBeNull();
  });
});
