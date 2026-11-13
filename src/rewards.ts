import type { Kind } from './data.ts';
import { isArrayOfLength, isNumberIn, isRecord, isUint32 } from './plainData.ts';
export type Milestone = 4 | 8;
export const REWARDS = {
  'renfort-bouclier': {
    title: 'Un gardien arrive',
    detail: 'Un Bouclier offert, à placer dans ton camp.',
    kind: 'shield',
  },
  'renfort-ninja': {
    title: 'Un éclair en renfort',
    detail: 'Un Ninja offert, à placer dans ton camp.',
    kind: 'ninja',
  },
  'renfort-raptor': {
    title: 'Un ami à griffes',
    detail: 'Un Vélociraptor offert, à placer dans ton camp.',
    kind: 'raptor',
  },
  miel: {
    title: 'La grande réserve de miel',
    detail: '+4 secondes pour chaque pot, jusqu’à la fin de la partie.',
    kind: null,
  },
  cristal: {
    title: 'La garde du cristal',
    detail: 'Absorbe 18 dégâts au cristal. Ne bloque pas le roi.',
    kind: null,
  },
  pieces: {
    title: 'La bourse des aventuriers',
    detail: '+100 pièces pour recruter les alliés de ton choix.',
    kind: null,
  },
} as const;
export type RewardId = keyof typeof REWARDS;
export type RewardChoice = { milestone: Milestone; id: RewardId | 'skip'; used: boolean };
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
/** Independent draw: opening an offer never consumes combat randomness. */
export function rewardOffer(seed: number, milestone: Milestone): RewardId[] {
  let state = (seed ^ Math.imul(milestone, 0x9e3779b9)) >>> 0;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
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
  state.choices.filter((c) => c.id === 'miel').length * 4;
/** The camps that follow waves 4 and 8, where a reward is offered. */
export const isMilestone = (value: unknown): value is Milestone => value === 4 || value === 8;

// Damage absorbed by one « cristal » reward: the ward of a save cannot exceed what was chosen.
const CRYSTAL_WARD = 18;

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
  if (answered(raw.pending) || raw.ward > crystals * CRYSTAL_WARD) return null;
  // At a milestone the offer is either still pending or already answered.
  if (isMilestone(wave) && raw.pending !== wave && !answered(wave)) return null;
  state.pending = raw.pending as Milestone | null;
  state.ward = raw.ward;
  return state;
}
