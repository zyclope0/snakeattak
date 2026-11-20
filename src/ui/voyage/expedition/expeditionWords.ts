import { BOON_RULES, boonLevel, isLastingBoon } from '../../../boons.ts';
import type { BoonId, LastingBoon } from '../../../boons.ts';
import {
  battlesBefore,
  battlesWon,
  EXPEDITION_BATTLES,
  EXPEDITION_TUNINGS,
  expeditionPhase,
  expeditionPlanOf,
  STEPS_PER_TABLEAU,
} from '../../../expedition.ts';
import type { ExpeditionState, HaltKind, Path } from '../../../expedition.ts';
import { REWARDS } from '../../../rewards.ts';
import type { RewardId } from '../../../rewards.ts';
import { boonDetail, boonTitle } from '../../boonCopy.ts';
import * as TEXT from '../../../texts/fr/expedition.ts';
import { fill } from '../../../texts/fill.ts';

/**
 * What « La Grande Expédition » says, and when. Presentation only, without a page: every
 * sentence is chosen here from the state, so that a test can read them all. Each one is a
 * single literal or a single template, which the translator needs to find whole.
 */

const plural = (count: number) => (count > 1 ? 's' : '');
const RULES = BOON_RULES[1];
/** Five battles a tableau: the guardian is the fifth. */
export const BATTLES_PER_TABLEAU = EXPEDITION_BATTLES / EXPEDITION_TUNINGS[1].tableaux.length;

export const TABLEAU_NAMES = [
  TEXT.laValleeDesSifflements,
  TEXT.leMaraisGlouglou,
  TEXT.lesPicsAuxMilleCrocs,
] as const;
export const GUARDIAN_NAMES = [TEXT.capitaineZigzag, TEXT.madameGloups, TEXT.kingSnake] as const;
export const PATH_NAMES: Record<Path, string> = {
  calm: TEXT.leCheminTranquille,
  brave: TEXT.leCheminDesBraves,
};
export const HALT_NAMES: Record<HaltKind, string> = {
  feu: TEXT.leFeuDeCamp,
  roulotte: TEXT.laRoulotteDeMamiePistache,
  oeuf: TEXT.lOeufMystere,
};
/** What a halt promises, before the child stops there. */
export function haltPromise(halt: HaltKind): string {
  const tuning = EXPEDITION_TUNINGS[1];
  if (halt === 'feu') return fill(TEXT.tonCristalSeRepareDeNEtTesAllies, tuning.campfire.crystal);
  return halt === 'roulotte' ? TEXT.acheteUnCadeauAvecTesPieces : TEXT.uneSurpriseToujoursGentille;
}

/** The mission of its tableau the child plays now, counted from one. */
export const missionInTableau = (state: ExpeditionState) =>
  battlesBefore(state) - state.tableau * BATTLES_PER_TABLEAU + 1;

/** An expedition with something to lose: a battle won, and more to play. */
export const underWay = (state: ExpeditionState | null): state is ExpeditionState =>
  !!state && state.status === 'travelling' && battlesWon(state) > 0;

/** The name of the screen, and the mission it is about when there is one to play. */
export function expeditionHeading(state: ExpeditionState): { title: string; step: string } {
  const phase = expeditionPhase(state);
  if (phase === 'arrived') return { title: TEXT.bravoTuAsFiniLaGrandeExpedition, step: '' };
  if (phase === 'roulotte') return { title: TEXT.laRoulotteDeMamiePistache, step: '' };
  if (phase === 'gift') {
    // A guardian has just fallen when the gift opens a new tableau.
    const title =
      state.step === 0
        ? fill(TEXT.nEstVaincu, GUARDIAN_NAMES[state.tableau - 1])
        : TEXT.missionGagnee;
    return { title, step: '' };
  }
  const step =
    phase === 'halt'
      ? TEXT.ouTArretesTu
      : fill(TEXT.missionNSurN, missionInTableau(state), BATTLES_PER_TABLEAU);
  return { title: TABLEAU_NAMES[state.tableau], step };
}

/** « Ta plus longue expédition » : a personal record, never a ranking. Nothing before a win. */
export const recordLine = (best: number): string =>
  best > 0 ? fill(TEXT.taPlusLongueExpeditionNMissionN, best, plural(best)) : '';

/** Under the panel: what is kept and what is not, or that this device keeps nothing. */
export const keepingNote = (saved: boolean): string =>
  saved ? TEXT.tonExpeditionEstGardeeSurCetAppareil : TEXT.cetAppareilNeGardePasTonExpedition;

export type StepState = 'done' | 'next' | 'ahead';
/** The seven steps of the tableau under way: passed, here, or still ahead. */
export function stepStates(state: ExpeditionState): StepState[] {
  const here = state.status === 'arrived' ? STEPS_PER_TABLEAU : state.step;
  return Array.from({ length: STEPS_PER_TABLEAU }, (_, index) =>
    index < here ? 'done' : index === here && !state.pending ? 'next' : 'ahead',
  );
}
const STEP_STATES: Record<StepState, string> = {
  done: TEXT.gagnee,
  next: TEXT.aJouer,
  ahead: TEXT.aVenir,
};
/** A step told to someone who cannot see the path. */
export function stepWords(
  state: ExpeditionState,
  index: number,
  stepState: StepState,
): { name: string; state: string } {
  const step = expeditionPlanOf(state).tableaux[state.tableau][index];
  const battles = expeditionPlanOf(state)
    .tableaux[state.tableau].slice(0, index + 1)
    .filter((s) => s.kind !== 'halt').length;
  const name =
    step.kind === 'halt'
      ? TEXT.uneHalte
      : step.kind === 'battle' && step.battle.king
        ? fill(TEXT.leGardienN, GUARDIAN_NAMES[state.tableau])
        : fill(TEXT.missionN, battles);
  return { name, state: STEP_STATES[stepState] };
}

/** A gift on a card: its name, what it gives once taken, and the words of its button. */
export function giftWords(
  state: ExpeditionState,
  id: BoonId,
  rare: boolean,
): { title: string; detail: string; action: string } {
  if (isLastingBoon(id)) {
    const owned = boonLevel(state.boons, id);
    const next = Math.min(RULES.maxLevel, owned + (rare ? 2 : 1));
    return {
      title: boonTitle(id),
      detail: boonDetail(id, next, RULES.steps),
      action: owned ? fill(TEXT.monterAuNiveauN, next) : TEXT.choisirCeCadeau,
    };
  }
  const reward = REWARDS[id as RewardId];
  const detail =
    id === 'pieces' ? reward.detail : `${reward.detail} ${TEXT.pourLaProchaineMission}`;
  return { title: reward.title, detail, action: TEXT.choisirCeCadeau };
}

/** A gift the child holds: its name and level for a screen reader, its stars for the eye. */
export const heldWords = (id: LastingBoon, level: number) => ({
  label: fill(TEXT.nNiveauN, boonTitle(id), level),
  detail: boonDetail(id, level, RULES.steps),
});
export const giftsLabel = (held: number) => fill(TEXT.tesCadeauxNSurN, held, RULES.places);

/** What the camp carries now. Nothing to say at the start of a tableau: a new camp waits. */
export function campWords(state: ExpeditionState): string[] {
  const camp = state.camp;
  if (!camp) return [TEXT.unNouveauCampTAttend];
  return [
    fill(TEXT.alliesN, camp.units.length),
    fill(TEXT.piecesN, camp.gold),
    fill(TEXT.cristalN, Math.round(camp.base)),
  ];
}

/** What a halt did, said once on the map after it. */
export function haltNotice(before: ExpeditionState, after: ExpeditionState, halt: HaltKind) {
  if (halt === 'feu') return TEXT.tonCristalEstRepareTesAlliesSeSont;
  if (halt !== 'oeuf') return '';
  const climbed = after.boons.find((b) => boonLevel(before.boons, b.id) < b.level);
  if (climbed)
    return fill(TEXT.lOeufMystereFaitMonterNAuNiveauN, boonTitle(climbed.id), climbed.level);
  return fill(TEXT.lOeufMystereTOffreNPieces, EXPEDITION_TUNINGS[1].eggCoins);
}

/** Before an expedition under way is replaced: what would stop. */
export const replaceSentence = (state: ExpeditionState): string => {
  const won = battlesWon(state);
  return fill(TEXT.tuAsDejaGagneNMissionNSiTuChanges, won, plural(won));
};

/** The small mark on the board: the child is on the expedition, at this mission. */
export const battleMark = (state: ExpeditionState): string =>
  fill(TEXT.expeditionMissionNSurN, missionInTableau(state), BATTLES_PER_TABLEAU);

/**
 * The end of a battle, on the board. `after` is the expedition once the battle is recorded,
 * null when the snakes won: the camp comes back as it was. One way on, whatever happened.
 */
export function battleOutcome(after: ExpeditionState | null): { note: string; button: string } {
  if (!after)
    return { note: TEXT.lesSerpentsOntGagneCetteFoisTonCamp, button: TEXT.revenirALExpedition };
  if (after.status === 'arrived')
    return { note: TEXT.kingSnakeEstVaincuTuAsFiniLaGrande, button: TEXT.continuerLExpedition };
  const note =
    after.step === 0
      ? fill(TEXT.nEstVaincuUnNouveauTableauTAttend, GUARDIAN_NAMES[after.tableau - 1])
      : TEXT.missionGagneeTonCampTeSuit;
  return { note, button: TEXT.continuerLExpedition };
}

export const arrivedLine = () => fill(TEXT.tuAsGagneLesNMissions, EXPEDITION_BATTLES);
export const coinsLine = (coins: number) => fill(TEXT.tuAsNPieces, coins);
export const capriceLabel = (name: string) => fill(TEXT.capriceSurpriseN, name);
