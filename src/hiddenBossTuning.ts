import type { BalanceRevision } from './balanceRevision.ts';
import * as TEXT from './texts/fr/hiddenBoss.ts';

/**
 * The numbers of the hidden boss's battle (`hiddenBoss.ts`, `engine/bossChain.ts`): every one
 * has its name here and nowhere else. The battle is a decision of the parent of 26 November
 * 2026 (`docs/BOSS-CACHE.md`): a very long snake of clay rings that grows a ring for each
 * fallen ally or honey pot it swallows, loses the ring that is broken, and is beaten when
 * only its head is left.
 *
 * Versions: a battle names the version of these numbers it was started with, and keeps it.
 * A version, once a child has played it, never changes: a new value is a new version, and an
 * old saved fight (lot 3) still plays by its own. Version 1 is the « moyen » tuning measured
 * on 26 November 2026 (`npm run balance:hidden-boss`); no child has played it yet, so it may
 * still be replaced by the tuning the parent chooses, until the battle is published.
 */
export type HiddenBossTuning = Readonly<{
  /** The balance revision of the allies (prices, rules): a later one never reaches the fight. */
  balance: BalanceRevision;
  /** The map: that of this wave of the great adventure (1: la clairière des fougères). */
  terrainWave: number;
  /** The purse of the preparation; the hero and the two club fighters come with the camp. */
  startGold: number;
  /** Rings behind the head when it leaves its den, and the most it can ever have. */
  startRings: number;
  maxRings: number;
  /** Life of one ring, and the coins its breaking pays. */
  ringHp: number;
  ringCoins: number;
  /** Distance between two rings along the body, in board units. */
  ringSpacing: number;
  /** Walking speed of the head, in board units per second. */
  headSpeed: number;
  /** One bite of the head, the seconds between two bites, and how far it reaches. */
  biteDamage: number;
  biteInterval: number;
  biteReach: number;
  /** An ally that falls this close to the head is swallowed. */
  swallowReach: number;
  /** Seconds the head stands still to swallow an ally, and to eat a honey pot. */
  allyGulp: number;
  honeyGulp: number;
  /** The head eats a honey pot of its lane when it comes this close to it, along the road. */
  honeyReach: number;
}>;

/** Three tunings measured for the parent (26 November 2026); names in French, for the parent. */
export const HIDDEN_BOSS_CANDIDATES = Object.freeze({
  doux: Object.freeze({
    balance: 7,
    terrainWave: 1,
    startGold: 1300,
    startRings: 16,
    maxRings: 28,
    ringHp: 400,
    ringCoins: 25,
    ringSpacing: 22,
    headSpeed: 22,
    biteDamage: 12,
    biteInterval: 1,
    biteReach: 44,
    swallowReach: 60,
    allyGulp: 2,
    honeyGulp: 5,
    honeyReach: 12,
  }),
  moyen: Object.freeze({
    balance: 7,
    terrainWave: 1,
    startGold: 1200,
    startRings: 18,
    maxRings: 30,
    ringHp: 450,
    ringCoins: 20,
    ringSpacing: 22,
    headSpeed: 24,
    biteDamage: 14,
    biteInterval: 1,
    biteReach: 44,
    swallowReach: 60,
    allyGulp: 1.5,
    honeyGulp: 4,
    honeyReach: 12,
  }),
  costaud: Object.freeze({
    balance: 7,
    terrainWave: 1,
    startGold: 1300,
    startRings: 20,
    maxRings: 32,
    ringHp: 500,
    ringCoins: 15,
    ringSpacing: 22,
    headSpeed: 26,
    biteDamage: 18,
    biteInterval: 1,
    biteReach: 44,
    swallowReach: 60,
    allyGulp: 1.2,
    honeyGulp: 3,
    honeyReach: 12,
  }),
} satisfies Record<string, HiddenBossTuning>);

/** The versions of the battle; a saved fight names one and is played by it. */
export const HIDDEN_BOSS_VERSIONS = Object.freeze({
  1: HIDDEN_BOSS_CANDIDATES.moyen,
} satisfies Record<number, HiddenBossTuning>);
export type HiddenBossVersion = keyof typeof HIDDEN_BOSS_VERSIONS;
export const CURRENT_HIDDEN_BOSS_VERSION: HiddenBossVersion = 1;
export const isHiddenBossVersion = (value: unknown): value is HiddenBossVersion =>
  typeof value === 'number' && Object.hasOwn(HIDDEN_BOSS_VERSIONS, value);

/** The numbers of a version; an unknown version is refused, never replaced by another. */
export function hiddenBossTuning(version: unknown): HiddenBossTuning {
  if (!isHiddenBossVersion(version)) throw new RangeError(TEXT.versionInconnue);
  return HIDDEN_BOSS_VERSIONS[version];
}
