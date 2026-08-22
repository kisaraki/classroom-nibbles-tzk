import { PRESENTATION_CONFIG } from "../core/Config";
import {
  EnvironmentKind,
  type EnvironmentKind as EnvironmentKindValue,
} from "../gameplay/Environment";

export const SoundCue = Object.freeze({
  MENU_ACCEPT: "MENU_ACCEPT",
  SCENE_ENTER: "SCENE_ENTER",
  CORRECT_TOKEN: "CORRECT_TOKEN",
  WRONG_TOKEN: "WRONG_TOKEN",
  COLLISION: "COLLISION",
  POWER_UP: "POWER_UP",
  SHOT: "SHOT",
  BULLET_IMPACT: "BULLET_IMPACT",
  TYPING_CORRECT: "TYPING_CORRECT",
  TYPING_WRONG: "TYPING_WRONG",
  TYPING_COMPLETE: "TYPING_COMPLETE",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  GAME_CLEAR: "GAME_CLEAR",
} as const);

export type SoundCue = (typeof SoundCue)[keyof typeof SoundCue];

export interface ToneStep {
  readonly frequency: number;
  readonly delaySeconds: number;
  readonly durationSeconds: number;
  readonly gain: number;
  readonly waveform: OscillatorType;
}

type AudioPreferenceStore = Pick<Storage, "getItem" | "setItem">;

export interface AudioManagerOptions {
  readonly storage?: AudioPreferenceStore | null;
  readonly createContext?: () => AudioContext;
}

const SOUND_RECIPES: Readonly<Record<SoundCue, readonly ToneStep[]>> = Object.freeze({
  [SoundCue.MENU_ACCEPT]: Object.freeze([
    Object.freeze({ frequency: 420, delaySeconds: 0, durationSeconds: 0.08, gain: 0.34, waveform: "sine" }),
    Object.freeze({ frequency: 630, delaySeconds: 0.07, durationSeconds: 0.12, gain: 0.28, waveform: "sine" }),
  ]),
  [SoundCue.SCENE_ENTER]: Object.freeze([
    Object.freeze({ frequency: 150, delaySeconds: 0, durationSeconds: 0.18, gain: 0.25, waveform: "triangle" }),
    Object.freeze({ frequency: 300, delaySeconds: 0.14, durationSeconds: 0.22, gain: 0.24, waveform: "triangle" }),
    Object.freeze({ frequency: 600, delaySeconds: 0.3, durationSeconds: 0.25, gain: 0.2, waveform: "sine" }),
  ]),
  [SoundCue.CORRECT_TOKEN]: Object.freeze([
    Object.freeze({ frequency: 740, delaySeconds: 0, durationSeconds: 0.11, gain: 0.32, waveform: "sine" }),
    Object.freeze({ frequency: 980, delaySeconds: 0.06, durationSeconds: 0.13, gain: 0.25, waveform: "sine" }),
  ]),
  [SoundCue.WRONG_TOKEN]: Object.freeze([
    Object.freeze({ frequency: 180, delaySeconds: 0, durationSeconds: 0.24, gain: 0.34, waveform: "sawtooth" }),
  ]),
  [SoundCue.COLLISION]: Object.freeze([
    Object.freeze({ frequency: 95, delaySeconds: 0, durationSeconds: 0.28, gain: 0.4, waveform: "square" }),
  ]),
  [SoundCue.POWER_UP]: Object.freeze([
    Object.freeze({ frequency: 520, delaySeconds: 0, durationSeconds: 0.1, gain: 0.28, waveform: "triangle" }),
    Object.freeze({ frequency: 780, delaySeconds: 0.08, durationSeconds: 0.1, gain: 0.24, waveform: "triangle" }),
    Object.freeze({ frequency: 1040, delaySeconds: 0.16, durationSeconds: 0.16, gain: 0.2, waveform: "sine" }),
  ]),
  [SoundCue.SHOT]: Object.freeze([
    Object.freeze({ frequency: 210, delaySeconds: 0, durationSeconds: 0.07, gain: 0.3, waveform: "square" }),
  ]),
  [SoundCue.BULLET_IMPACT]: Object.freeze([
    Object.freeze({ frequency: 130, delaySeconds: 0, durationSeconds: 0.09, gain: 0.24, waveform: "triangle" }),
  ]),
  [SoundCue.TYPING_CORRECT]: Object.freeze([
    Object.freeze({ frequency: 660, delaySeconds: 0, durationSeconds: 0.09, gain: 0.24, waveform: "sine" }),
  ]),
  [SoundCue.TYPING_WRONG]: Object.freeze([
    Object.freeze({ frequency: 220, delaySeconds: 0, durationSeconds: 0.16, gain: 0.28, waveform: "square" }),
  ]),
  [SoundCue.TYPING_COMPLETE]: Object.freeze([
    Object.freeze({ frequency: 523.25, delaySeconds: 0, durationSeconds: 0.14, gain: 0.28, waveform: "sine" }),
    Object.freeze({ frequency: 659.25, delaySeconds: 0.12, durationSeconds: 0.14, gain: 0.25, waveform: "sine" }),
    Object.freeze({ frequency: 783.99, delaySeconds: 0.24, durationSeconds: 0.3, gain: 0.23, waveform: "sine" }),
  ]),
  [SoundCue.PAUSE]: Object.freeze([
    Object.freeze({ frequency: 300, delaySeconds: 0, durationSeconds: 0.12, gain: 0.25, waveform: "triangle" }),
    Object.freeze({ frequency: 180, delaySeconds: 0.1, durationSeconds: 0.18, gain: 0.22, waveform: "triangle" }),
  ]),
  [SoundCue.RESUME]: Object.freeze([
    Object.freeze({ frequency: 220, delaySeconds: 0, durationSeconds: 0.1, gain: 0.22, waveform: "triangle" }),
    Object.freeze({ frequency: 440, delaySeconds: 0.08, durationSeconds: 0.16, gain: 0.22, waveform: "triangle" }),
  ]),
  [SoundCue.GAME_CLEAR]: Object.freeze([
    Object.freeze({ frequency: 392, delaySeconds: 0, durationSeconds: 0.18, gain: 0.28, waveform: "sine" }),
    Object.freeze({ frequency: 523.25, delaySeconds: 0.16, durationSeconds: 0.18, gain: 0.26, waveform: "sine" }),
    Object.freeze({ frequency: 659.25, delaySeconds: 0.32, durationSeconds: 0.18, gain: 0.24, waveform: "sine" }),
    Object.freeze({ frequency: 783.99, delaySeconds: 0.48, durationSeconds: 0.42, gain: 0.22, waveform: "sine" }),
  ]),
});

const AMBIENT_FREQUENCIES: Readonly<Record<EnvironmentKindValue, number>> = Object.freeze({
  [EnvironmentKind.CARGO_BAY]: 48,
  [EnvironmentKind.SHIP_PIPELINE]: 55,
  [EnvironmentKind.ASTEROID_BELT]: 42,
  [EnvironmentKind.DENSE_ATMOSPHERE]: 62,
  [EnvironmentKind.ALIEN_FOREST]: 51,
});

export function soundRecipeFor(cue: SoundCue): readonly ToneStep[] {
  return SOUND_RECIPES[cue];
}

export function ambientFrequencyFor(environment: EnvironmentKindValue): number {
  return AMBIENT_FREQUENCIES[environment];
}

function browserStorage(): AudioPreferenceStore | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn("無法讀取音效偏好儲存空間", error);
    return null;
  }
}

function browserAudioContext(): AudioContext {
  if (typeof AudioContext === "undefined") {
    throw new Error("This browser does not provide Web Audio.");
  }
  return new AudioContext();
}

export class AudioManager {
  readonly #storage: AudioPreferenceStore | null;
  readonly #createContext: () => AudioContext;
  #context: AudioContext | null = null;
  #masterGain: GainNode | null = null;
  #ambientOscillator: OscillatorNode | null = null;
  #ambientGain: GainNode | null = null;
  #environment: EnvironmentKindValue = EnvironmentKind.CARGO_BAY;
  #muted: boolean;
  #available = true;

  constructor(options: AudioManagerOptions = {}) {
    this.#storage = options.storage === undefined ? browserStorage() : options.storage;
    this.#createContext = options.createContext ?? browserAudioContext;
    this.#muted = this.#loadMutedPreference();
  }

  get muted(): boolean {
    return this.#muted;
  }

  get available(): boolean {
    return this.#available;
  }

  get unlocked(): boolean {
    return this.#context !== null;
  }

  async unlock(): Promise<boolean> {
    if (!this.#available) return false;
    try {
      if (!this.#context) {
        const context = this.#createContext();
        const masterGain = context.createGain();
        masterGain.gain.value = this.#muted ? 0 : PRESENTATION_CONFIG.audio.masterGain;
        masterGain.connect(context.destination);
        this.#context = context;
        this.#masterGain = masterGain;
        this.#startAmbience();
      }
      if (this.#context.state === "suspended") await this.#context.resume();
      return true;
    } catch (error) {
      console.warn("音效系統無法啟動，遊戲將以靜音模式繼續", error);
      this.#available = false;
      return false;
    }
  }

  setMuted(muted: boolean): void {
    this.#muted = muted;
    this.#saveMutedPreference();
    this.#applyMasterGain();
    if (!muted && !this.#context) void this.unlock();
  }

  toggleMuted(): boolean {
    this.setMuted(!this.#muted);
    return this.#muted;
  }

  setEnvironment(environment: EnvironmentKindValue): void {
    this.#environment = environment;
    if (!this.#context || !this.#ambientOscillator) return;
    this.#ambientOscillator.frequency.setTargetAtTime(
      ambientFrequencyFor(environment),
      this.#context.currentTime,
      0.18,
    );
  }

  play(cue: SoundCue): boolean {
    if (this.#muted || !this.#context || !this.#masterGain || !this.#available) {
      return false;
    }
    const now = this.#context.currentTime;
    for (const tone of soundRecipeFor(cue)) this.#scheduleTone(tone, now);
    return true;
  }

  dispose(): void {
    if (this.#ambientOscillator) {
      this.#ambientOscillator.stop();
      this.#ambientOscillator.disconnect();
    }
    this.#ambientGain?.disconnect();
    this.#masterGain?.disconnect();
    if (this.#context) void this.#context.close();
    this.#ambientOscillator = null;
    this.#ambientGain = null;
    this.#masterGain = null;
    this.#context = null;
  }

  #scheduleTone(tone: ToneStep, baseTime: number): void {
    if (!this.#context || !this.#masterGain) return;
    const start = baseTime + tone.delaySeconds;
    const end = start + tone.durationSeconds;
    const oscillator = this.#context.createOscillator();
    const gain = this.#context.createGain();
    oscillator.type = tone.waveform;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(this.#masterGain);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  }

  #startAmbience(): void {
    if (!this.#context || !this.#masterGain || this.#ambientOscillator) return;
    const oscillator = this.#context.createOscillator();
    const gain = this.#context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = ambientFrequencyFor(this.#environment);
    gain.gain.value = PRESENTATION_CONFIG.audio.ambientGain;
    oscillator.connect(gain);
    gain.connect(this.#masterGain);
    oscillator.start();
    this.#ambientOscillator = oscillator;
    this.#ambientGain = gain;
  }

  #applyMasterGain(): void {
    if (!this.#context || !this.#masterGain) return;
    this.#masterGain.gain.setTargetAtTime(
      this.#muted ? 0 : PRESENTATION_CONFIG.audio.masterGain,
      this.#context.currentTime,
      0.025,
    );
  }

  #loadMutedPreference(): boolean {
    if (!this.#storage) return false;
    try {
      return this.#storage.getItem(PRESENTATION_CONFIG.audio.mutedStorageKey) === "true";
    } catch (error) {
      console.warn("無法載入音效偏好", error);
      return false;
    }
  }

  #saveMutedPreference(): void {
    if (!this.#storage) return;
    try {
      this.#storage.setItem(
        PRESENTATION_CONFIG.audio.mutedStorageKey,
        String(this.#muted),
      );
    } catch (error) {
      console.warn("無法儲存音效偏好", error);
    }
  }
}
