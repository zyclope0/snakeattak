import type { Game } from './game.ts';
import type { RewardId } from './rewards.ts';
import { isIntegerIn, isOneOf, isRecord } from './plainData.ts';
import { createStageGame, isVoyageSeed, planVoyage, stageRulesFor } from './voyage.ts';
import type { VoyagePlan } from './voyage.ts';
import { isBonusCard } from './voyageRules.ts';
import { CURRENT_VOYAGE_VERSION, isVoyageVersion } from './voyageTuning.ts';
import type { VoyageVersion } from './voyageTuning.ts';

/**
 * Where a child stands in a voyage. The plan is never stored: it is drawn again from the
 * seed, so a state only holds what the child did — stages won, cards kept.
 */
const STATUSES = ['travelling', 'fallen', 'arrived'] as const;
export type VoyageStatus = (typeof STATUSES)[number];
export type VoyageState = Readonly<{
  version: VoyageVersion;
  seed: number;
  /** Stages won so far; while travelling it is also the index of the stage to play. */
  won: number;
  /** The card kept after each stage won, in order: the travel bag. */
  bag: readonly RewardId[];
  status: VoyageStatus;
}>;
/** What the child is asked next: play a stage, pick a card, or nothing more. */
export type VoyagePhase = 'stage' | 'bonus' | 'fallen' | 'arrived';

/** The bag holds one card per stage won, except the one still to pick after the last win. */
function bagFits(state: VoyageState, plan: VoyagePlan): boolean {
  const { won, bag, status } = state;
  const stages = plan.stages.length;
  if (!bag.every((card, index) => plan.stages[index]?.offer.includes(card))) return false;
  if (status === 'arrived') return won === stages && bag.length === stages - 1;
  if (won >= stages) return false;
  return bag.length === won || (status === 'travelling' && bag.length === won - 1);
}

/** Canonical frozen copy of a state that a real voyage can reach; null for anything else. */
export function readVoyageState(raw: unknown): VoyageState | null {
  if (
    !isRecord(raw) ||
    !isVoyageVersion(raw.version) ||
    !isVoyageSeed(raw.seed) ||
    !isIntegerIn(raw.won, 0, 99) ||
    !isOneOf(raw.status, STATUSES) ||
    !Array.isArray(raw.bag) ||
    !raw.bag.every(isBonusCard)
  )
    return null;
  const plan = planVoyage(raw.seed, raw.version);
  const state: VoyageState = Object.freeze({
    version: raw.version,
    seed: raw.seed,
    won: raw.won,
    bag: Object.freeze([...raw.bag]),
    status: raw.status,
  });
  return plan && bagFits(state, plan) ? state : null;
}

/** The first stage of a new voyage; null when the seed is not one. */
export function startVoyage(
  seed: number,
  version: VoyageVersion = CURRENT_VOYAGE_VERSION,
): VoyageState | null {
  return readVoyageState({ version, seed, won: 0, bag: [], status: 'travelling' });
}

/** The plan of a state; a valid state always has one. */
export const voyagePlanOf = (state: VoyageState): VoyagePlan =>
  planVoyage(state.seed, state.version)!;

export function voyagePhase(state: VoyageState): VoyagePhase {
  if (state.status !== 'travelling') return state.status;
  return state.bag.length < state.won ? 'bonus' : 'stage';
}

/** The three cards to choose from after a stage won; empty at any other moment. */
export function bonusOffer(state: VoyageState): readonly RewardId[] {
  return voyagePhase(state) === 'bonus' ? voyagePlanOf(state).stages[state.won - 1].offer : [];
}

/** Keeps one of the three offered cards for the rest of the voyage. Null if it is not offered. */
export function chooseBonus(state: VoyageState, card: unknown): VoyageState | null {
  if (!bonusOffer(state).includes(card as RewardId)) return null;
  return readVoyageState({ ...state, bag: [...state.bag, card] });
}

/** A new camp for the stage to play, with the bag unpacked. Null when no stage is due. */
export function stageGame(state: VoyageState): Game | null {
  if (voyagePhase(state) !== 'stage') return null;
  return createStageGame(voyagePlanOf(state), state.won, state.bag);
}

/** True when `game` is the stage this state is waiting for, with this very bag. */
function playsDueStage(state: VoyageState, game: Game): boolean {
  const plan = voyagePlanOf(state);
  const rules = stageRulesFor(plan, state.won, state.bag);
  return (
    voyagePhase(state) === 'stage' &&
    !!game.stage &&
    JSON.stringify(game.stage) === JSON.stringify(rules) &&
    JSON.stringify(game.mission) === JSON.stringify(plan.stages[state.won].run)
  );
}

/**
 * The voyage after its stage was fought. A stage won opens the choice of a card, or ends
 * the voyage after the last one; a fallen camp ends the voyage there. Null while the fight
 * is not over, or when the game is not the stage that was due: nothing is recorded then.
 */
export function recordStage(state: VoyageState, game: Game): VoyageState | null {
  if (!playsDueStage(state, game)) return null;
  if (game.status === 'lost') return readVoyageState({ ...state, status: 'fallen' });
  if (game.status !== 'won' || game.wave !== game.totalWaves) return null;
  const won = state.won + 1;
  const arrived = won === voyagePlanOf(state).stages.length;
  return readVoyageState({ ...state, won, status: arrived ? 'arrived' : 'travelling' });
}
