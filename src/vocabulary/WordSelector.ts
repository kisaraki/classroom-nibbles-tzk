import { GAME_LEVEL_CONFIGS } from "../core/Config";
import { SeededRandom } from "../core/SeededRandom";
import {
  CEEC_LEVELS,
  type VocabularyEntry,
  type VocabularyLevel,
} from "./types";
import {
  VocabularyMode,
  fixedLevelForMode,
  type VocabularyMode as VocabularyModeValue,
} from "./VocabularyMode";

export type GameLevel = 1 | 2 | 3 | 4 | 5;

export interface RunScenePlan {
  readonly gameLevel: GameLevel;
  readonly sceneName: string;
  readonly durationSeconds: number;
  readonly maximumTokenLength: number | null;
  readonly words: readonly VocabularyEntry[];
}

export interface VocabularyRunPlan {
  readonly mode: VocabularyModeValue;
  readonly seed: string;
  readonly scenes: readonly RunScenePlan[];
}

interface SelectionBucket {
  readonly levels: readonly VocabularyLevel[];
  readonly count: number;
}

export class WordSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordSelectionError";
  }
}

function progressiveBuckets(gameLevel: GameLevel): readonly SelectionBucket[] {
  if (gameLevel === 4) {
    return Object.freeze([
      Object.freeze({ levels: Object.freeze([4 as const]), count: 3 }),
      Object.freeze({ levels: Object.freeze([5 as const]), count: 2 }),
    ]);
  }
  const sourceLevel: VocabularyLevel = gameLevel === 5 ? 6 : gameLevel;
  return Object.freeze([Object.freeze({ levels: Object.freeze([sourceLevel]), count: 5 })]);
}

function bucketsForMode(
  mode: VocabularyModeValue,
  gameLevel: GameLevel,
): readonly SelectionBucket[] {
  const fixedLevel = fixedLevelForMode(mode);
  if (fixedLevel) {
    return Object.freeze([Object.freeze({ levels: Object.freeze([fixedLevel]), count: 5 })]);
  }
  if (mode === VocabularyMode.PROGRESSIVE) return progressiveBuckets(gameLevel);
  return Object.freeze([
    Object.freeze({ levels: CEEC_LEVELS, count: 5 }),
  ]);
}

export class WordSelector {
  readonly #entries: readonly VocabularyEntry[];

  constructor(entries: readonly VocabularyEntry[]) {
    this.#entries = Object.freeze(entries.filter((entry) => entry.eligible));
  }

  createRun(
    mode: VocabularyModeValue,
    seed: string,
    recentTargets: readonly string[] = [],
  ): VocabularyRunPlan {
    const random = new SeededRandom(seed);
    const recent = new Set(recentTargets);
    const usedIds = new Set<string>();
    const usedTargets = new Set<string>();

    const scenes = GAME_LEVEL_CONFIGS.map((config): RunScenePlan => {
      const selected: VocabularyEntry[] = [];
      for (const bucket of bucketsForMode(mode, config.gameLevel)) {
        const bucketEntries = this.#selectBucket(
          bucket,
          config.maximumTokenLength,
          recent,
          usedIds,
          usedTargets,
          random,
        );
        for (const entry of bucketEntries) {
          selected.push(entry);
          usedIds.add(entry.id);
          usedTargets.add(entry.target);
        }
      }

      return Object.freeze({
        gameLevel: config.gameLevel,
        sceneName: config.sceneName,
        durationSeconds: config.durationSeconds,
        maximumTokenLength: config.maximumTokenLength,
        words: Object.freeze(random.shuffle(selected)),
      });
    });

    return Object.freeze({ mode, seed, scenes: Object.freeze(scenes) });
  }

  #selectBucket(
    bucket: SelectionBucket,
    initialMaximumTokenLength: number | null,
    recentTargets: ReadonlySet<string>,
    usedIds: ReadonlySet<string>,
    usedTargets: ReadonlySet<string>,
    random: SeededRandom,
  ): readonly VocabularyEntry[] {
    const levelSet = new Set<VocabularyLevel>(bucket.levels);
    const baseCandidates = this.#entries
      .filter(
        (entry) =>
          levelSet.has(entry.sourceLevel) &&
          !usedIds.has(entry.id) &&
          !usedTargets.has(entry.target),
      )
      .sort((first, second) => first.id.localeCompare(second.id));

    let maximumTokenLength = initialMaximumTokenLength;
    let candidates = this.#filterByLengthAndHistory(
      baseCandidates,
      maximumTokenLength,
      recentTargets,
      true,
    );

    if (candidates.length < bucket.count) {
      candidates = this.#filterByLengthAndHistory(
        baseCandidates,
        maximumTokenLength,
        recentTargets,
        false,
      );
    }

    const longestAvailable = baseCandidates.reduce(
      (longest, entry) => Math.max(longest, entry.tokenLength),
      0,
    );
    while (
      candidates.length < bucket.count &&
      maximumTokenLength !== null &&
      maximumTokenLength < longestAvailable
    ) {
      maximumTokenLength += 1;
      candidates = this.#filterByLengthAndHistory(
        baseCandidates,
        maximumTokenLength,
        recentTargets,
        false,
      );
    }

    if (candidates.length < bucket.count) {
      throw new WordSelectionError(
        `Unable to select ${bucket.count} unique entries from CEEC level(s) ${bucket.levels.join(", ")}.`,
      );
    }
    return Object.freeze(random.shuffle(candidates).slice(0, bucket.count));
  }

  #filterByLengthAndHistory(
    entries: readonly VocabularyEntry[],
    maximumTokenLength: number | null,
    recentTargets: ReadonlySet<string>,
    excludeRecent: boolean,
  ): VocabularyEntry[] {
    return entries.filter((entry) => {
      if (maximumTokenLength !== null && entry.tokenLength > maximumTokenLength) return false;
      if (excludeRecent && recentTargets.has(entry.target)) return false;
      return true;
    });
  }
}
