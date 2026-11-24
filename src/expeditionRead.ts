import type { RewardId } from './rewards.ts';
import { readBoons } from './boons.ts';
import type { Boons } from './boons.ts';
import { readCarriedCamp } from './checkpointUnits.ts';
import { isArrayOfLength, isIntegerIn, isOneOf, isRecord } from './plainData.ts';
import { isBonusCard, STAGE_BAG_LIMIT } from './voyageRules.ts';
import { isVoyageSeed } from './voyage.ts';
import { GOLD_LIMIT } from './gameConstants.ts';
import { EXPEDITION_GIFT_RULES, EXPEDITION_TUNINGS } from './expeditionTuning.ts';
import type { ExpeditionVersion } from './expeditionTuning.ts';
import {
  CHOICES_PER_TABLEAU,
  choicesBefore,
  planExpedition,
  SHAPE,
  STEPS_PER_TABLEAU,
} from './expeditionPlan.ts';
import type { ExpeditionPlan } from './expeditionPlan.ts';
import { armourOf, carryUnits, EXPEDITION_STATUSES, giftCoins } from './expeditionState.ts';
import type { Camp, ExpeditionState, Pending } from './expeditionState.ts';

/**
 * A saved expedition read back. Each field is read on its own, then the state as a whole
 * must be one a real expedition can reach: anything else is refused.
 */

/** The plan a saved state names: a version that has a table, and a seed of the voyage. */
function readPlan(raw: Record<string, unknown>): ExpeditionPlan | null {
  if (
    typeof raw.version !== 'number' ||
    !Object.hasOwn(EXPEDITION_TUNINGS, raw.version) ||
    !isVoyageSeed(raw.seed)
  )
    return null;
  return planExpedition(raw.seed, raw.version as ExpeditionVersion);
}

/** One pick, 0 or 1, for every fork and halt passed before this step of this tableau. */
function readPicks(raw: unknown, tableau: number, step: number): readonly (0 | 1)[] | null {
  const passed = tableau * CHOICES_PER_TABLEAU + choicesBefore(step);
  if (!isArrayOfLength(raw, passed, passed) || !raw.every((p) => p === 0 || p === 1)) return null;
  return Object.freeze([...(raw as (0 | 1)[])]);
}

/** Cards « once » for the next battle: bonus cards only, never more than a bag holds. */
function readBag(raw: unknown): readonly RewardId[] | null {
  if (!isArrayOfLength(raw, 0, STAGE_BAG_LIMIT) || !raw.every(isBonusCard)) return null;
  return Object.freeze([...(raw as RewardId[])]);
}

/** A carried camp read back: its allies as the next camp will receive them, its coins, its crystal. */
function readCamp(raw: unknown, boons: Boons): Camp | null {
  const carried = isRecord(raw) ? readCarriedCamp(raw, armourOf(boons)) : null;
  if (!carried) return null;
  const units = carryUnits(carried.units);
  if (!units) return null;
  return Object.freeze({ units: Object.freeze(units), gold: carried.gold, base: carried.base });
}

function readPending(raw: unknown): Pending | null | undefined {
  if (raw === null) return null;
  if (!isRecord(raw)) return undefined;
  if (raw.kind === 'roulotte') return Object.freeze({ kind: 'roulotte' });
  if (raw.kind === 'gift' && typeof raw.rare === 'boolean' && typeof raw.rerolled === 'boolean')
    return Object.freeze({ kind: 'gift', rare: raw.rare, rerolled: raw.rerolled });
  return undefined;
}

/**
 * One gift between two battles: at most one card « once » in the bag, and coins in the
 * purse only while a new camp waits, at the first step of the second or third tableau.
 */
function giftsFit({ tableau, step, status, bag, purse, boons }: ExpeditionState): boolean {
  const opening = tableau === 0 && step === 0;
  const waiting = status === 'travelling' && step === 0 && tableau > 0;
  return !(
    bag.length > 1 ||
    (bag.length && (opening || status === 'arrived')) ||
    (purse > 0 && !waiting) ||
    purse > giftCoins(true) ||
    (opening && boons.length)
  );
}

/** Arrived: past the last guardian, with no camp and nothing left to answer. */
function arrivalFits(plan: ExpeditionPlan, state: ExpeditionState): boolean {
  const last = state.tableau === plan.tableaux.length - 1 && state.step === STEPS_PER_TABLEAU - 1;
  return last && !state.pending && !state.camp;
}

/** A gift waits after a battle won only, and a rare one after the brave path only. */
function giftMayWait({ tableau, step, picks }: ExpeditionState, rare: boolean): boolean {
  const before = SHAPE[step - 1];
  const afterBattle = step === 0 ? tableau > 0 : before !== 'halt';
  const brave = before === 'fork' && picks.at(-1) === 1;
  return afterBattle && (!rare || brave);
}

/** The roulotte waits only right after the halt where the child chose it. */
function roulotteMayWait(plan: ExpeditionPlan, { tableau, step, picks }: ExpeditionState) {
  const halt = plan.tableaux[tableau][step - 1];
  return halt?.kind === 'halt' && halt.halts[picks.at(-1)!] === 'roulotte';
}

/** On the way: the camp of the tableau, and the question that waits where the child stands. */
function journeyFits(plan: ExpeditionPlan, state: ExpeditionState): boolean {
  const { step, camp, pending } = state;
  // The camp travels within a tableau: none at its first step, always one after.
  if ((step === 0) !== (camp === null)) return false;
  if (pending?.kind === 'gift') return giftMayWait(state, pending.rare);
  if (pending?.kind === 'roulotte') return roulotteMayWait(plan, state);
  return true;
}

/**
 * Canonical frozen copy of a state that a real expedition can reach; null for anything else.
 * The plan is never stored: it is drawn again from the seed.
 */
export function readExpeditionState(raw: unknown): ExpeditionState | null {
  try {
    const plan = isRecord(raw) ? readPlan(raw) : null;
    if (
      !isRecord(raw) ||
      !plan ||
      !isIntegerIn(raw.tableau, 0, plan.tableaux.length - 1) ||
      !isIntegerIn(raw.step, 0, STEPS_PER_TABLEAU - 1) ||
      !isOneOf(raw.status, EXPEDITION_STATUSES) ||
      !isIntegerIn(raw.purse, 0, GOLD_LIMIT)
    )
      return null;
    const bag = readBag(raw.bag);
    const picks = readPicks(raw.picks, raw.tableau, raw.step);
    const boons = readBoons(raw.boons, EXPEDITION_GIFT_RULES);
    const pending = readPending(raw.pending);
    if (!bag || !picks || !boons || pending === undefined) return null;
    const camp = raw.camp === null ? null : readCamp(raw.camp, boons);
    if (raw.camp !== null && !camp) return null;
    const state: ExpeditionState = Object.freeze({
      version: plan.version,
      seed: plan.seed,
      tableau: raw.tableau,
      step: raw.step,
      picks,
      camp,
      boons,
      bag,
      purse: raw.purse,
      pending,
      status: raw.status,
    });
    const fits = state.status === 'arrived' ? arrivalFits(plan, state) : journeyFits(plan, state);
    return giftsFit(state) && fits ? state : null;
  } catch {
    return null;
  }
}
