import type { Kind } from './data.ts';
import { isRecord } from './plainData.ts';
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
/** Reject inconsistent rewards; never reapply a gift while reading a save. */
export function readRewards(raw: unknown, wave: number): RewardState | null {
  if (
    !isRecord(raw) ||
    !Number.isInteger(raw.seed) ||
    (raw.seed as number) < 0 ||
    (raw.seed as number) > 0xffffffff ||
    !Array.isArray(raw.choices) ||
    raw.choices.length > 2 ||
    typeof raw.ward !== 'number' ||
    !Number.isFinite(raw.ward) ||
    raw.ward < 0 ||
    (raw.pending !== null && ((raw.pending !== 4 && raw.pending !== 8) || raw.pending !== wave))
  )
    return null;
  const state = freshRewards(raw.seed as number);
  let last = 0;
  for (const c of raw.choices) {
    if (
      !isRecord(c) ||
      (c.milestone !== 4 && c.milestone !== 8) ||
      c.milestone > wave ||
      c.milestone <= last ||
      typeof c.used !== 'boolean' ||
      typeof c.id !== 'string' ||
      (c.id !== 'skip' && !rewardOffer(state.seed, c.milestone).includes(c.id as RewardId)) ||
      ((c.id === 'skip' || !REWARDS[c.id as RewardId].kind) && !c.used)
    )
      return null;
    last = c.milestone;
    state.choices.push({ milestone: c.milestone, id: c.id as RewardChoice['id'], used: c.used });
  }
  if (
    state.choices.some((c) => c.milestone === raw.pending) ||
    raw.ward > state.choices.filter((c) => c.id === 'cristal').length * 18
  )
    return null;
  if (
    (wave === 4 || wave === 8) &&
    raw.pending !== wave &&
    !state.choices.some((c) => c.milestone === wave)
  )
    return null;
  state.pending = raw.pending as Milestone | null;
  state.ward = raw.ward;
  return state;
}
