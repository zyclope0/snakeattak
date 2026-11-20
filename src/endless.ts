import { isIntegerIn, isNumberIn, isRecord } from './plainData.ts';
import { TOTAL_WAVES } from './gameConstants.ts';

/**
 * The endless adventure (idea of the parent, 20 November 2026): the twelve waves of the great
 * adventure, King Snake at the twelfth, then the same twelve waves again, round after round,
 * with the same camp. Nothing comes back to life. After each king, a bonus to choose; the
 * snakes of the next round are stronger, never more numerous (choice of the parent).
 *
 * Versioned like a balance revision: once children have played a version, it never changes;
 * new values make a new version next to it.
 */
export type EndlessRules = Readonly<{
  version: 1;
  /** Each king beaten adds this share of their life to the snakes (0.25: +25 % a round). */
  hpStep: number;
  /** Each king beaten adds this share to the bite of the snakes. */
  biteStep: number;
  /** Each king beaten adds this share to the coins a wave brings (may be negative). */
  coinStep: number;
}>;

/**
 * Values to measure, not yet chosen by the parent: `npm run balance:endless` plays them and
 * the parent decides. Until then the endless adventure is not offered to children.
 */
export const ENDLESS_RULES: Readonly<Record<EndlessRules['version'], EndlessRules>> = {
  1: Object.freeze({ version: 1, hpStep: 0.35, biteStep: 0.15, coinStep: 0 }),
};

/** Steps beyond these are typos, never values to measure. */
const STEP_LIMIT = 10;

/** Canonical frozen copy, or null: the engine never trusts the object it was handed. */
export function readEndlessRules(raw: unknown): EndlessRules | null {
  if (
    !isRecord(raw) ||
    !isIntegerIn(raw.version, 1, 1) ||
    !isNumberIn(raw.hpStep, 0, STEP_LIMIT) ||
    !isNumberIn(raw.biteStep, 0, STEP_LIMIT) ||
    !isNumberIn(raw.coinStep, -0.9, STEP_LIMIT)
  )
    return null;
  return Object.freeze({
    version: 1,
    hpStep: raw.hpStep,
    biteStep: raw.biteStep,
    coinStep: raw.coinStep,
  });
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
    hp: stats.hp * (1 + rules.hpStep * kings),
    damage: stats.damage * (1 + rules.biteStep * kings),
    reward: Math.round(stats.reward * Math.max(0.1, 1 + rules.coinStep * kings)),
  };
}

/** The wave reached, counted from the very first one: the record of an endless game. */
export const endlessWave = (kings: number, wave: number) => kings * TOTAL_WAVES + wave;
