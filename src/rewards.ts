import type { Kind } from './data.ts';
import { isArrayOfLength, isIntegerIn, isNumberIn, isRecord, isUint32 } from './plainData.ts';
import * as TEXT from './texts/fr/rewards.ts';
import { seededStream } from './seededRandom.ts';
import { CRYSTAL_WARD, HONEY_REWARD_SECONDS, REWARD_WAVES, TOTAL_WAVES } from './gameConstants.ts';
/**
 * The camps where a card is offered: after waves 4 and 8, and in the endless adventure after
 * each king too (wave 12).
 */
export type Milestone = (typeof REWARD_WAVES)[number] | typeof TOTAL_WAVES;
export const REWARDS = {
  'renfort-bouclier': {
    title: TEXT.unGardienArrive,
    detail: TEXT.unBouclierOffertAPlacerDansTonCamp,
    kind: 'shield',
  },
  'renfort-ninja': {
    title: TEXT.unEclairEnRenfort,
    detail: TEXT.unNinjaOffertAPlacerDansTonCamp,
    kind: 'ninja',
  },
  'renfort-raptor': {
    title: TEXT.unAmiAGriffes,
    detail: TEXT.unVelociraptorOffertAPlacerDansTon,
    kind: 'raptor',
  },
  miel: {
    title: TEXT.laGrandeReserveDeMiel,
    detail: TEXT.n4SecondesPourChaquePotJusquALaFin,
    kind: null,
  },
  cristal: {
    title: TEXT.laGardeDuCristal,
    detail: TEXT.absorbe18DegatsAuCristalNeBloque,
    kind: null,
  },
  pieces: {
    title: TEXT.laBourseDesAventuriers,
    detail: TEXT.n100PiecesPourRecruterLesAlliesDe,
    kind: null,
  },
} as const;
export type RewardId = keyof typeof REWARDS;
/**
 * `round`: in the endless adventure, the kings beaten before the choice; absent in every other
 * game, which has a single round.
 */
export type RewardChoice = {
  milestone: Milestone;
  id: RewardId | 'skip';
  used: boolean;
  round?: number;
};
export type RewardState = {
  seed: number;
  pending: Milestone | null;
  choices: RewardChoice[];
  ward: number;
};
export const freshRewards = (seed: number): RewardState => ({
  seed: seed >>> 0,
  pending: null,
  choices: [],
  ward: 0,
});
/**
 * Independent draw: opening an offer never consumes combat randomness. (The endless
 * adventure draws its gifts apart, in boons.ts.)
 */
export function rewardOffer(seed: number, milestone: Milestone): RewardId[] {
  const random = seededStream((seed ^ Math.imul(milestone, 0x9e3779b9)) >>> 0);
  const shuffle = <T>(values: T[]) => {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  };
  const unit = shuffle<RewardId>(['renfort-bouclier', 'renfort-ninja', 'renfort-raptor'])[0];
  return shuffle([unit, ...shuffle<RewardId>(['miel', 'cristal', 'pieces']).slice(0, 2)]);
}
export function freeRecruit(state: RewardState, kind: Kind) {
  return state.choices.find((c) => c.id !== 'skip' && !c.used && REWARDS[c.id].kind === kind);
}
export const extraHoneySeconds = (state: RewardState) =>
  state.choices.filter((c) => c.id === 'miel').length * HONEY_REWARD_SECONDS;
/** The camps that follow waves 4 and 8, where a reward is offered in every game. */
export const isMilestone = (value: unknown): value is (typeof REWARD_WAVES)[number] =>
  (REWARD_WAVES as readonly unknown[]).includes(value);

type SavedRewards = Record<string, unknown> & { seed: number; choices: unknown[]; ward: number };

/** The fields that stand alone: seed, at most two choices, ward, and a pending offer due now. */
function hasValidHeader(raw: unknown, wave: number): raw is SavedRewards {
  return (
    isRecord(raw) &&
    isUint32(raw.seed) &&
    isArrayOfLength(raw.choices, 0, 2) &&
    isNumberIn(raw.ward, 0, Number.MAX_VALUE) &&
    (raw.pending === null || (isMilestone(raw.pending) && raw.pending === wave))
  );
}

/**
 * One past choice. It was made at a milestone already reached, after the previous one, among
 * the three cards really offered; only a recruit voucher may still be unused.
 */
function readChoice(
  saved: unknown,
  seed: number,
  wave: number,
  previousMilestone: number,
): RewardChoice | null {
  if (
    !isRecord(saved) ||
    !isMilestone(saved.milestone) ||
    saved.milestone > wave ||
    saved.milestone <= previousMilestone ||
    typeof saved.used !== 'boolean' ||
    typeof saved.id !== 'string'
  )
    return null;
  const skipped = saved.id === 'skip';
  if (!skipped && !rewardOffer(seed, saved.milestone).includes(saved.id as RewardId)) return null;
  if ((skipped || !REWARDS[saved.id as RewardId].kind) && !saved.used) return null;
  return { milestone: saved.milestone, id: saved.id as RewardChoice['id'], used: saved.used };
}

/** Reject inconsistent rewards; never reapply a gift while reading a save. */
export function readRewards(raw: unknown, wave: number): RewardState | null {
  if (!hasValidHeader(raw, wave)) return null;
  const state = freshRewards(raw.seed);
  let previousMilestone = 0;
  for (const saved of raw.choices) {
    const choice = readChoice(saved, state.seed, wave, previousMilestone);
    if (!choice) return null;
    previousMilestone = choice.milestone;
    state.choices.push(choice);
  }
  const answered = (milestone: unknown) => state.choices.some((c) => c.milestone === milestone);
  const crystals = state.choices.filter((c) => c.id === 'cristal').length;
  // The ward of a save cannot exceed what the « cristal » rewards chosen have given.
  if (answered(raw.pending) || raw.ward > crystals * CRYSTAL_WARD) return null;
  // At a milestone the offer is either still pending or already answered.
  if (isMilestone(wave) && raw.pending !== wave && !answered(wave)) return null;
  state.pending = raw.pending as Milestone | null;
  state.ward = raw.ward;
  return state;
}

/**
 * The rewards of a saved endless camp: only the cards taken once are kept there (the lasting
 * gifts are saved apart), each in a round already played, at a camp of that round. An offer
 * pending is the one due now. The ward cannot exceed what the « cristal » cards gave.
 */
export function readEndlessRewards(raw: unknown, kings: number, wave: number): RewardState | null {
  if (
    !isRecord(raw) ||
    !isUint32(raw.seed) ||
    !isArrayOfLength(raw.choices, 0, (kings + 1) * (REWARD_WAVES.length + 1)) ||
    !isNumberIn(raw.ward, 0, Number.MAX_VALUE)
  )
    return null;
  const pending = raw.pending;
  const due =
    pending === null ||
    (isMilestone(pending) && pending === wave) ||
    (pending === TOTAL_WAVES && wave === 0 && kings > 0);
  if (!due) return null;
  const state = freshRewards(raw.seed);
  state.pending = pending as Milestone | null;
  for (const saved of raw.choices) {
    if (
      !isRecord(saved) ||
      !(isMilestone(saved.milestone) || saved.milestone === TOTAL_WAVES) ||
      typeof saved.id !== 'string' ||
      saved.id === 'miel' ||
      !Object.hasOwn(REWARDS, saved.id) ||
      typeof saved.used !== 'boolean' ||
      (!REWARDS[saved.id as RewardId].kind && !saved.used) ||
      (Object.hasOwn(saved, 'round') && !isIntegerIn(saved.round, 1, kings))
    )
      return null;
    state.choices.push({
      milestone: saved.milestone as Milestone,
      id: saved.id as RewardId,
      used: saved.used,
      ...(Object.hasOwn(saved, 'round') ? { round: saved.round as number } : {}),
    });
  }
  const crystals = state.choices.filter((c) => c.id === 'cristal').length;
  if (raw.ward > crystals * CRYSTAL_WARD) return null;
  state.ward = raw.ward;
  return state;
}
