import type { RewardId } from './rewards.ts';
import { seededStream } from './seededRandom.ts';
import { isArrayOfLength, isIntegerIn, isRecord } from './plainData.ts';
import { HONEY_REWARD_SECONDS } from './gameConstants.ts';

/**
 * The gifts of the endless adventure (decisions of the parent, 20 November 2026): the six
 * cards of the great adventure, and six gifts that last and climb a level each time they are
 * taken again, three levels at most. Five places for gifts that last; a new one, when they
 * are full, takes the place the child gives it.
 *
 * Values to measure (docs/MODE-INFINI.md); the parent named the first ones on 20 November.
 */
export const BOON_PLACES = 5;
export const BOON_MAX_LEVEL = 3;

/** What one level of each lasting gift gives. */
export const BOON_STEPS = Object.freeze({
  /** « La forge » : the blows of every ally, +15 % a level. */
  forge: 0.15,
  /** « L'armure » : the life of every ally, +15 % a level. */
  armure: 0.15,
  /** « Le marché » : recruiting costs 10 % less a level. */
  marche: 0.1,
  /** « La rente » : coins at the end of every wave, a level. */
  rente: 40,
  /** « Le cristal solide » : the crystal mends this much after every wave, a level. */
  solide: 5,
  /** « La longue-vue » : the allies that shoot from afar see 10 % further a level. */
  vue: 0.1,
  /** « La grande réserve de miel » : seconds more for every honey pot, a level. */
  miel: HONEY_REWARD_SECONDS,
});
export type LastingBoon = keyof typeof BOON_STEPS;
/** The cards taken once and spent at once: an ally to place, coins, the crystal's ward. */
export type OnceBoon = Exclude<RewardId, 'miel'>;
export type BoonId = LastingBoon | OnceBoon;
export const LASTING_BOONS = Object.keys(BOON_STEPS) as LastingBoon[];
const ONCE_BOONS: readonly OnceBoon[] = [
  'renfort-bouclier',
  'renfort-ninja',
  'renfort-raptor',
  'cristal',
  'pieces',
];
export const isLastingBoon = (id: unknown): id is LastingBoon =>
  typeof id === 'string' && Object.hasOwn(BOON_STEPS, id);
export const isBoonId = (id: unknown): id is BoonId =>
  isLastingBoon(id) || (ONCE_BOONS as readonly unknown[]).includes(id);

/** The lasting gifts of a game, in the order they were first taken. */
export type Boons = { id: LastingBoon; level: number }[];
export const boonLevel = (boons: Boons, id: LastingBoon): number =>
  boons.find((b) => b.id === id)?.level ?? 0;

/**
 * Three gifts to choose from, drawn apart from the fight. A lasting gift already at the top
 * level is never offered again; the others may be offered to climb a level.
 */
export function boonOffer(seed: number, round: number, milestone: number, boons: Boons): BoonId[] {
  const random = seededStream(
    (seed ^ Math.imul(round + 1, 0x27d4eb2d) ^ Math.imul(milestone, 0x9e3779b9)) >>> 0,
  );
  const pool: BoonId[] = [
    ...LASTING_BOONS.filter((id) => boonLevel(boons, id) < BOON_MAX_LEVEL),
    ...ONCE_BOONS,
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

/**
 * Takes a lasting gift: it climbs a level, or takes a free place, or the place `replace`
 * when all five are taken. Returns the new list, or null when it cannot be taken.
 */
export function takeBoon(boons: Boons, id: LastingBoon, replace?: LastingBoon): Boons | null {
  const level = boonLevel(boons, id);
  if (level >= BOON_MAX_LEVEL) return null;
  if (level > 0) return boons.map((b) => (b.id === id ? { id, level: level + 1 } : b));
  if (boons.length < BOON_PLACES) return [...boons, { id, level: 1 }];
  if (!replace || !boons.some((b) => b.id === replace)) return null;
  return boons.map((b) => (b.id === replace ? { id, level: 1 } : b));
}

/** Gifts read from a save: five places, known gifts, each once, levels one to three. */
export function readBoons(raw: unknown): Boons | null {
  if (!isArrayOfLength(raw, 0, BOON_PLACES)) return null;
  const boons: Boons = [];
  for (const saved of raw) {
    if (
      !isRecord(saved) ||
      !isLastingBoon(saved.id) ||
      !isIntegerIn(saved.level, 1, BOON_MAX_LEVEL) ||
      boons.some((b) => b.id === saved.id)
    )
      return null;
    boons.push({ id: saved.id, level: saved.level });
  }
  return boons;
}
