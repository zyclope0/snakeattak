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
  /**
   * Each king beaten multiplies the life of the snakes by 1 + this share (0.25: ×1.25, then
   * ×1.56…): the growth speeds up, so even a full camp falls one day.
   */
  hpStep: number;
  /** Each king beaten multiplies their bite by 1 + this share. */
  biteStep: number;
  /** Each king beaten multiplies the coins of a wave by 1 + this share (may be negative). */
  coinStep: number;
}>;

/**
 * Version 1, chosen by the parent on 20 November 2026 (« la version ferme ») after 60 games
 * per automatic player (docs/MODE-INFINI.md): life ×1.45, bite ×1.2 and coins ×0.9 at each
 * king. The expert beats one or two kings; the player who buys big allies, four or five.
 */
export const ENDLESS_RULES: Readonly<Record<EndlessRules['version'], EndlessRules>> = {
  1: Object.freeze({ version: 1, hpStep: 0.45, biteStep: 0.2, coinStep: -0.1 }),
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
    hp: stats.hp * (1 + rules.hpStep) ** kings,
    damage: stats.damage * (1 + rules.biteStep) ** kings,
    reward: Math.round(stats.reward * Math.max(0.1, (1 + rules.coinStep) ** kings)),
  };
}

/** The wave reached, counted from the very first one: the record of an endless game. */
export const endlessWave = (kings: number, wave: number) => kings * TOTAL_WAVES + wave;
