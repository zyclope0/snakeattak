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

/** The actions of the camp, between two waves: mending the crystal, training the hero. */
export const REPAIR_COST = 80;
export const REPAIR_AMOUNT = 25;
export const HERO_TRAINING_COST = 90;
/** How long « Courage ! » makes the allies strike faster. */
export const ENCOURAGEMENT_SECONDS = 8;

/** What the three rewards without an ally give: coins, a ward for the crystal, longer honey. */
export const REWARD_COINS = 100;
export const CRYSTAL_WARD = 18;
export const HONEY_REWARD_SECONDS = 4;

/** A chapter or an expedition earns three stars at most; there are six expeditions. */
export const STAR_MAX = 3;
export const MISSION_COUNT = 6;
/** A team of favourites always holds this many different allies. */
export const ROSTER_SIZE = 8;

/** No purse holds more; a save that claims more was not written by the game. */
export const GOLD_LIMIT = 10000000;

/** The seed of a game started without one. */
export const DEFAULT_SEED = 2026;

/** Chapter 0, 1 or 2 of a one-based wave; camp zero belongs to the first chapter. */
export const chapterOfWave = (wave: number): number =>
  Math.max(0, Math.min(CHAPTER_COUNT - 1, Math.floor((wave - 1) / WAVES_PER_CHAPTER)));
