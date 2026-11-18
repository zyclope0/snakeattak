// Un voyage entier joué par un joueur automatique, avec une façon de remplir le sac.
import { REWARDS } from '../../src/rewards.ts';
import type { RewardId } from '../../src/rewards.ts';
import { createStageGame, drawVoyage, stageCaprice } from '../../src/voyage.ts';
import { encodeVoyage } from '../../src/voyageCode.ts';
import { CURRENT_VOYAGE_VERSION } from '../../src/voyageTuning.ts';
import type { VoyageTuning, VoyageVersion } from '../../src/voyageTuning.ts';
import { playStage } from './players.ts';
import type { Profile } from './players.ts';
import type { VoyageRow } from './report.ts';
import { REASONABLE_ORDER } from './tables.ts';

const CARDS = Object.keys(REWARDS) as RewardId[];
/**
 * Façons de remplir le sac : `raisonnable` (la première carte offerte d'un ordre de
 * préférence fixe), `hasard` (une des trois au sort), `aucun` (sac vide), et `sac:<carte>`
 * (le sac ne reçoit que cette carte, une de plus par étape, qu'elle soit offerte ou non :
 * c'est l'effet d'une carte seule, pas un voyage qu'un enfant peut faire).
 */
export const POLICIES: readonly string[] = [
  'raisonnable',
  'hasard',
  'aucun',
  ...CARDS.map((card) => `sac:${card}`),
];

/** Des graines étalées sur le million de voyages possibles, les mêmes à chaque mesure. */
export const seedAt = (index: number): number => Math.imul(index + 1, 0x9e3779b1) >>> 12;

/** La carte gardée après une étape, ou null pour un sac qui reste vide. */
function pickCard(
  policy: string,
  offer: readonly RewardId[],
  seed: number,
  index: number,
): RewardId | null {
  if (policy === 'aucun') return null;
  if (policy.startsWith('sac:')) return policy.slice(4) as RewardId;
  if (policy === 'hasard') return offer[(Math.imul(seed + 1, 2654435761 + index) >>> 16) % 3];
  return REASONABLE_ORDER.find((card) => offer.includes(card)) ?? offer[0];
}

/**
 * Joue les cinq étapes d'une graine. Chaque étape est un nouveau camp : seul le sac passe de
 * l'une à l'autre. Les cinq sont donc jouées même après une défaite, pour que la réussite
 * « par étape » se lise sur toutes les graines ; `won` compte les étapes avant la première
 * défaite, là où le vrai voyage s'arrête.
 */
export function playVoyage(
  seed: number,
  profile: Profile,
  policy: string,
  tuning: VoyageTuning,
  version: VoyageVersion = CURRENT_VOYAGE_VERSION,
): VoyageRow {
  const plan = drawVoyage(seed, tuning, version)!;
  const bag: RewardId[] = [];
  const stages = plan.stages.map((stage, index) => {
    const result = playStage(createStageGame(plan, index, bag)!, profile);
    const last = index === plan.stages.length - 1;
    const card = last ? null : pickCard(policy, stage.offer, seed, index);
    if (card) bag.push(card);
    return {
      mission: stage.run.missionId,
      caprice: stageCaprice(stage)?.id ?? null,
      setup: `${stage.run.layout}/${stage.run.assault}/${stage.run.nest}`,
      card,
      ...result,
    };
  });
  const fell = stages.findIndex((stage) => stage.status !== 'won');
  return {
    seed,
    code: encodeVoyage(seed, version)!,
    profile,
    policy,
    stages,
    won: fell < 0 ? stages.length : fell,
  };
}
