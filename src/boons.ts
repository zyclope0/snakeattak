import type { RewardId } from './rewards.ts';
import { seededStream, shuffle } from './seededRandom.ts';
import { isArrayOfLength, isIntegerIn, isRecord } from './plainData.ts';
import { HONEY_REWARD_SECONDS } from './gameConstants.ts';

/**
 * The gifts of the endless adventure (decisions of the parent, 20 November 2026): the six
 * cards of the great adventure, and gifts that last and climb a level each time they are
 * taken again. Five places for gifts that last; a new one, when they are full, takes the
 * place the child gives it.
 *
 * One table a version of the endless adventure, like its other rules: a saved game keeps the
 * values it began with, and new values make a new version next to these. Measures and the
 * parent's agreement (« on garde », 20 November 2026): docs/MODE-INFINI.md.
 */
const VERSION_1 = Object.freeze({
  places: 5,
  maxLevel: 3,
  /** What one level of each lasting gift gives. */
  steps: Object.freeze({
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
  }),
});
export type BoonRules = typeof VERSION_1;
/**
 * The gift tables, by version of the endless adventure (`EndlessRules['version']`). Version 2
 * changes the waves of the later rounds, not the gifts: it keeps the table of version 1.
 */
export const BOON_RULES: Readonly<Record<1 | 2, BoonRules>> = Object.freeze({
  1: VERSION_1,
  2: VERSION_1,
});
/** The places and the top level of version 1: what the tests and the measures name. */
export const BOON_PLACES = VERSION_1.places;
export const BOON_MAX_LEVEL = VERSION_1.maxLevel;
const BOON_STEPS = VERSION_1.steps;
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

/** The lasting gifts of a game, in the order they were first taken. */
export type Boons = { id: LastingBoon; level: number }[];
export const boonLevel = (boons: Boons, id: LastingBoon): number =>
  boons.find((b) => b.id === id)?.level ?? 0;
/** « L'armure » : how many times its plain life an ally has, at a level of the gift. */
export const armourAtLevel = (level: number, rules: BoonRules): number =>
  1 + level * rules.steps.armure;
/** The same, for the gifts of a game. */
export const armourFactor = (boons: Boons, rules: BoonRules): number =>
  armourAtLevel(boonLevel(boons, 'armure'), rules);
/** A lasting gift not held yet, when every place is taken: one must be given up for it. */
export const placeNeeded = (boons: Boons, id: unknown, rules: BoonRules): boolean =>
  isLastingBoon(id) && !boonLevel(boons, id) && boons.length >= rules.places;

/**
 * Three gifts to choose from, drawn apart from the fight. A lasting gift already at the top
 * level is never offered again; the others may be offered to climb a level.
 */
export function boonOffer(
  seed: number,
  round: number,
  milestone: number,
  boons: Boons,
  rules: BoonRules = VERSION_1,
): BoonId[] {
  const random = seededStream(
    (seed ^ Math.imul(round + 1, 0x27d4eb2d) ^ Math.imul(milestone, 0x9e3779b9)) >>> 0,
  );
  const pool: BoonId[] = [
    ...LASTING_BOONS.filter((id) => boonLevel(boons, id) < rules.maxLevel),
    ...ONCE_BOONS,
  ];
  return shuffle(random, pool).slice(0, 3);
}

/**
 * Takes a lasting gift: it climbs a level, or takes a free place, or the place `replace`
 * when all five are taken. Returns the new list, or null when it cannot be taken.
 */
export function takeBoon(
  boons: Boons,
  id: LastingBoon,
  replace?: LastingBoon,
  rules: BoonRules = VERSION_1,
): Boons | null {
  const level = boonLevel(boons, id);
  if (level >= rules.maxLevel) return null;
  if (level > 0) return boons.map((b) => (b.id === id ? { id, level: level + 1 } : b));
  if (boons.length < rules.places) return [...boons, { id, level: 1 }];
  if (!replace || !boons.some((b) => b.id === replace)) return null;
  return boons.map((b) => (b.id === replace ? { id, level: 1 } : b));
}

/** Gifts read from a save: five places, known gifts, each once, levels one to three. */
export function readBoons(raw: unknown, rules: BoonRules = VERSION_1): Boons | null {
  if (!isArrayOfLength(raw, 0, rules.places)) return null;
  const boons: Boons = [];
  for (const saved of raw) {
    if (
      !isRecord(saved) ||
      !isLastingBoon(saved.id) ||
      !isIntegerIn(saved.level, 1, rules.maxLevel) ||
      boons.some((b) => b.id === saved.id)
    )
      return null;
    boons.push({ id: saved.id, level: saved.level });
  }
  return boons;
}
