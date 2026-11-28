import { grown } from './repeatedGrowth.ts';
import { isIntegerIn, isNumberIn, isRecord } from './plainData.ts';
import { TOTAL_WAVES } from './gameConstants.ts';

/**
 * The endless adventure (idea of the parent, 20 November 2026): the twelve waves of the great
 * adventure, King Snake at the twelfth, then the same twelve waves again, round after round,
 * with the same camp. Nothing comes back to life. After each king, a bonus to choose; the
 * snakes of the next round are stronger (choice of the parent). Version 2 also starts each
 * later round from a later wave of the great adventure, never beyond its waves.
 *
 * Versioned like a balance revision: once children have played a version, it never changes;
 * new values make a new version next to it.
 */
type EndlessSteps = {
  /** The balance revision of the great adventure that is played on. */
  balance: 7;
  /**
   * Each king beaten multiplies the life of the snakes by 1 + this share (0.25: ×1.25, then
   * ×1.56…): the growth speeds up, so even a full camp falls one day.
   */
  hpStep: number;
  /** Each king beaten multiplies their bite by 1 + this share. */
  biteStep: number;
  /** Each king beaten multiplies the coins of a wave by 1 + this share (may be negative). */
  coinStep: number;
};
export type EndlessRules = Readonly<
  EndlessSteps &
    (
      | { version: 1 }
      | {
          version: 2;
          /**
           * From the second round on, wave w of a round is played as wave
           * min(TOTAL_WAVES - 1, roundStart + ⌈w / 2⌉): with 6, the waves 7, 7, 8, 8, 9, 9,
           * 10, 10, 11, 11, 11, then King Snake. A round no longer starts again from the
           * first wave (`playedWave`).
           */
          roundStart: number;
          /**
           * True: a snake that enters the crystal hurts it as much more as the bite grew
           * with the kings (`crystalDamage`), as the snakes' bite grows against the allies.
           */
          crystalBite: boolean;
        }
    )
>;

/**
 * Version 1, chosen by the parent on 20 November 2026 (« la version ferme ») after 60 games
 * per automatic player (docs/MODE-INFINI.md): life ×1.45, bite ×1.2 and coins ×0.9 at each
 * king. The expert beats one or two kings; the player who buys big allies, four or five.
 */
const VERSION_1 = Object.freeze({
  version: 1,
  balance: 7,
  hpStep: 0.45,
  biteStep: 0.2,
  coinStep: -0.1,
} as const);
/**
 * Version 2, chosen by the parent on 28 November 2026 (« OK r4 b ») after the measures of
 * lot C (docs/BILAN-INFINI-LOT-C-2026-11-27.md, « Départ plus doux après chaque roi »): the
 * growth of version 1 at each king; from the second round, a round starts from the fifth
 * wave (10 snakes instead of 5) and climbs to the tenth before the king; the crystal feels
 * the kings as the allies do. As strong as version 1 for every measured player; the strong
 * camp falls at the king half as often.
 */
const VERSION_2 = Object.freeze({
  ...VERSION_1,
  version: 2,
  roundStart: 4,
  crystalBite: true,
} as const);
export const ENDLESS_RULES: Readonly<Record<EndlessRules['version'], EndlessRules>> = {
  1: VERSION_1,
  2: VERSION_2,
};

/**
 * The rules a new endless adventure is played by (version 2 from 28 November 2026). A game
 * begun with version 1 keeps version 1.
 */
export const CURRENT_ENDLESS_VERSION: EndlessRules['version'] = 2;
/** True for a version of the endless adventure this game knows. */
export const isEndlessVersion = (value: unknown): value is EndlessRules['version'] =>
  typeof value === 'number' && Object.hasOwn(ENDLESS_RULES, value);

/** Steps beyond these are typos, never values to measure. */
const STEP_LIMIT = 10;
const COIN_STEP_MIN = -0.9;
/** However many kings, a wave never brings less than this share of its coins. */
const COIN_FLOOR = 0.1;

/** Canonical frozen copy, or null: the engine never trusts the object it was handed. */
export function readEndlessRules(raw: unknown): EndlessRules | null {
  if (
    !isRecord(raw) ||
    !isEndlessVersion(raw.version) ||
    raw.balance !== ENDLESS_RULES[raw.version].balance ||
    !isNumberIn(raw.hpStep, 0, STEP_LIMIT) ||
    !isNumberIn(raw.biteStep, 0, STEP_LIMIT) ||
    !isNumberIn(raw.coinStep, COIN_STEP_MIN, STEP_LIMIT)
  )
    return null;
  const steps = {
    balance: ENDLESS_RULES[raw.version].balance,
    hpStep: raw.hpStep,
    biteStep: raw.biteStep,
    coinStep: raw.coinStep,
  };
  if (raw.version === 1) return Object.freeze({ version: 1, ...steps });
  // The seventh wave at most for the first wave of a round: never the king's.
  if (!isIntegerIn(raw.roundStart, 0, TOTAL_WAVES - 2) || typeof raw.crystalBite !== 'boolean')
    return null;
  return Object.freeze({
    version: 2,
    ...steps,
    roundStart: raw.roundStart,
    crystalBite: raw.crystalBite,
  });
}

/**
 * The wave whose snakes come at wave `wave` of a round: the same, except in version 2 after
 * the first king, where the waves of a round start from `roundStart` + 1 and climb by one
 * every two waves, never to the king's. The king's wave stays the king's. Only the snakes
 * follow it: the map, the gifts and the count of the waves keep the wave of the round.
 */
export function playedWave(rules: EndlessRules | null, kings: number, wave: number): number {
  if (rules?.version !== 2 || kings <= 0 || wave < 1 || wave >= TOTAL_WAVES) return wave;
  return Math.min(TOTAL_WAVES - 1, rules.roundStart + Math.ceil(wave / 2));
}

/**
 * What a snake that enters the crystal takes from it: `damage`, made stronger for each king
 * beaten as the bite is, in a version whose crystal feels the kings.
 */
export function crystalDamage(rules: EndlessRules | null, kings: number, damage: number): number {
  if (rules?.version !== 2 || !rules.crystalBite || kings <= 0) return damage;
  return damage * grown(rules.biteStep, kings);
}

/** The numbers of a wave, made stronger for each king already beaten. */
export function endlessStats<T extends { hp: number; damage: number; reward: number }>(
  stats: T,
  rules: EndlessRules | null,
  kings: number,
): T {
  if (!rules || kings <= 0) return stats;
  return {
    ...stats,
    hp: stats.hp * grown(rules.hpStep, kings),
    damage: stats.damage * grown(rules.biteStep, kings),
    reward: Math.round(stats.reward * Math.max(COIN_FLOOR, grown(rules.coinStep, kings))),
  };
}

/** The wave reached, counted from the very first one: the record of an endless game. */
export const endlessWave = (kings: number, wave: number) => kings * TOTAL_WAVES + wave;

/** More kings than this were never beaten: a save that says so was not written by the game. */
export const KINGS_LIMIT = 1000;

/**
 * The endless adventure opens once King Snake is beaten in the great adventure (decision of
 * the parent, 20 November 2026): the last chapter of the career has a star.
 */
export const endlessUnlocked = (bestStars: readonly number[]) => (bestStars.at(-1) ?? 0) > 0;

/**
 * The wave an endless game has reached, for its record: the wave it fell at, or, in the camp
 * after a king, the wave of that king. Zero while nothing is reached yet.
 */
export function endlessReached(game: { kings: number; wave: number; status: string }): number {
  if (game.status === 'lost') return endlessWave(game.kings, game.wave);
  return game.status === 'preparing' && game.wave === 0 ? game.kings * TOTAL_WAVES : 0;
}

/**
 * The camp right after a king of the endless adventure, its gift chosen: the child goes on, or
 * goes home with the record (the game stays saved, and may be taken up again).
 */
export const atKingCamp = (game: {
  endless: unknown;
  status: string;
  wave: number;
  kings: number;
  rewards: { pending: unknown };
}) =>
  !!game.endless &&
  game.status === 'preparing' &&
  game.wave === 0 &&
  game.kings > 0 &&
  game.rewards.pending === null;
