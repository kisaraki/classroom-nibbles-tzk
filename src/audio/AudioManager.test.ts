import { describe, expect, it, vi } from "vitest";
import { EnvironmentKind } from "../gameplay/Environment";
import {
  AudioManager,
  SoundCue,
  ambientFrequencyFor,
  soundRecipeFor,
} from "./AudioManager";

describe("AudioManager", () => {
  it("provides a valid synthesized recipe for every presentation cue", () => {
    for (const cue of Object.values(SoundCue)) {
      const recipe = soundRecipeFor(cue);
      expect(recipe.length).toBeGreaterThan(0);
      for (const tone of recipe) {
        expect(tone.frequency).toBeGreaterThan(0);
        expect(tone.durationSeconds).toBeGreaterThan(0);
        expect(tone.delaySeconds).toBeGreaterThanOrEqual(0);
        expect(tone.gain).toBeGreaterThan(0);
        expect(tone.gain).toBeLessThanOrEqual(1);
      }
    }
  });

  it("uses a distinct ambient drone for all five environments", () => {
    const frequencies = Object.values(EnvironmentKind).map(ambientFrequencyFor);
    expect(new Set(frequencies).size).toBe(5);
  });

  it("loads and persists the muted preference without requiring an audio context", () => {
    const values = new Map<string, string>([["nibbles.audio.muted", "false"]]);
    const storage = {
      getItem: (key: string): string | null => values.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        values.set(key, value);
      },
    };
    const audio = new AudioManager({ storage });

    expect(audio.muted).toBe(false);
    expect(audio.unlocked).toBe(false);
    audio.setMuted(true);
    expect(values.get("nibbles.audio.muted")).toBe("true");
  });

  it("falls back to unavailable silent mode when Web Audio cannot start", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const audio = new AudioManager({
      storage: null,
      createContext: () => {
        throw new Error("audio unavailable");
      },
    });

    await expect(audio.unlock()).resolves.toBe(false);
    expect(audio.available).toBe(false);
    expect(audio.play(SoundCue.MENU_ACCEPT)).toBe(false);
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });
});
