const STORAGE_KEY = "nibbles.recent-targets.v1";

export class RecentTargetHistory {
  readonly #maximumEntries: number;

  constructor(maximumEntries = 50) {
    this.#maximumEntries = maximumEntries;
  }

  load(): readonly string[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        return Object.freeze([]);
      }
      return Object.freeze(value.slice(0, this.#maximumEntries));
    } catch (error) {
      console.warn("Unable to read recent vocabulary history.", error);
      return Object.freeze([]);
    }
  }

  remember(target: string): void {
    const history = this.load().filter((entry) => entry !== target);
    history.unshift(target);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history.slice(0, this.#maximumEntries)),
      );
    } catch (error) {
      console.warn("Unable to persist recent vocabulary history.", error);
    }
  }
}
