import { describe, expect, it } from "vitest";
import { ENVIRONMENT_PROFILES } from "../gameplay/Environment";
import { spaceBackdropCssVariables } from "./SpaceBackdrop";

describe("SpaceBackdrop", () => {
  it("creates distinct scalable CSS palettes for every space theme", () => {
    const variables = ENVIRONMENT_PROFILES.map((profile) =>
      spaceBackdropCssVariables(profile.spaceBackdrop)
    );

    expect(new Set(variables.map((theme) => theme.deep)).size).toBe(5);
    expect(new Set(variables.map((theme) => theme.nebulaPrimary)).size).toBe(5);
    expect(new Set(variables.map((theme) => theme.celestialX)).size).toBe(5);
    expect(variables.every((theme) => theme.deep.startsWith("#"))).toBe(true);
  });
});
