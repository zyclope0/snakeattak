/**
 * The numbers that shape a game and that several modules must agree on. Each one has its
 * name here and nowhere else; rules, saves, rendering and screens import it.
 *
 * Giving a name never changes a value. A new value is a new balance revision
 * (`balanceRevision.ts`), measured first and agreed with the parent: old starting codes and
 * old saves keep their rules. `tests/game-constants.test.ts` retypes every number.
 */

/** The lanes the serpents come down. */
export const LANE_COUNT = 3;

/** The classic adventure: three chapters of four waves, the king at the last one. */
export const CHAPTER_COUNT = 3;
export const WAVES_PER_CHAPTER = 4;
export const TOTAL_WAVES = 12;

/** The camps where a reward is offered: after the first and the second chapter. */
export const REWARD_WAVES = [4, 8] as const;

/** What a new game starts with: its purse, its crystal, the hero and two fighters. */
export const START_GOLD = 300;
export const CRYSTAL_MAX = 100;
export const START_TEAM_SIZE = 3;

/** No purse holds more; a save that claims more was not written by the game. */
export const GOLD_LIMIT = 10000000;

/** The seed of a game started without one. */
export const DEFAULT_SEED = 2026;

/** Chapter 0, 1 or 2 of a one-based wave; camp zero belongs to the first chapter. */
export const chapterOfWave = (wave: number): number =>
  Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor((wave - 1) / WAVES_PER_CHAPTER)));
