import { BOON_RULES, boonLevel, isLastingBoon } from '../../../boons.ts';
import type { BoonId, LastingBoon } from '../../../boons.ts';
import {
  BATTLES_PER_TABLEAU,
  battlesBefore,
  battlesWon,
  EXPEDITION_BATTLES,
  expeditionPhase,
  expeditionPlanOf,
  giftCoins,
  levelAfterGift,
  pickAt,
  STEPS_PER_TABLEAU,
  tuningOf,
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

export const TABLEAU_NAMES = [
  TEXT.laValleeDesSifflements,
  TEXT.leMaraisGlouglou,
  TEXT.lesPicsAuxMilleCrocs,
] as const;
export const GUARDIAN_NAMES = [TEXT.capitaineZigzag, TEXT.madameGloups, TEXT.kingSnake] as const;
/** Each guardian beaten, in its own words: « vaincu » or « vaincue ». King Snake ends it all. */
const GUARDIAN_BEATEN = [TEXT.capitaineZigzagEstVaincu, TEXT.madameGloupsEstVaincue] as const;
const GUARDIAN_BEATEN_ONWARD = [
  TEXT.capitaineZigzagEstVaincuUnNouveauTableau,
  TEXT.madameGloupsEstVaincueUnNouveauTableau,
] as const;
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
export function haltPromise(state: ExpeditionState, halt: HaltKind): string {
  const tuning = tuningOf(state);
  if (halt === 'feu') return fill(TEXT.tonCristalSeRepareDeNEtTesAllies, tuning.campfire.crystal);
  return halt === 'roulotte' ? TEXT.acheteUnCadeauAvecTesPieces : TEXT.uneSurpriseToujoursGentille;
}

/** The mission of its tableau the child plays now, counted from one. */
export const missionInTableau = (state: ExpeditionState) =>
  battlesBefore(state) - state.tableau * BATTLES_PER_TABLEAU + 1;

/** The name of the screen, and the mission it is about when there is one to play. */
export function expeditionHeading(state: ExpeditionState): { title: string; step: string } {
  const phase = expeditionPhase(state);
  if (phase === 'arrived')
    return { title: fill(TEXT.bravoTuAsFiniN, TEXT.laGrandeExpedition), step: '' };
  if (phase === 'roulotte') return { title: TEXT.laRoulotteDeMamiePistache, step: '' };
  if (phase === 'gift') {
    // A guardian has just fallen when the gift opens a new tableau.
    const title = state.step === 0 ? GUARDIAN_BEATEN[state.tableau - 1] : TEXT.etapeGagnee;
    return { title, step: '' };
  }
  const step =
    phase === 'halt'
      ? TEXT.ouTArretesTu
      : fill(TEXT.etapeNSurN, missionInTableau(state), BATTLES_PER_TABLEAU);
  return { title: TABLEAU_NAMES[state.tableau], step };
}

/** « Ta plus longue expédition » : a personal record, never a ranking. Nothing before a win. */
export const recordLine = (best: number): string =>
  best > 0 ? fill(TEXT.taPlusLongueExpeditionNEtapeN, best, plural(best)) : '';

/** Under the panel: what is kept and what is not, or that this device keeps nothing. */
export const keepingNote = (saved: boolean): string =>
  saved ? TEXT.tonExpeditionEstGardeeSurCetAppareil : TEXT.cetAppareilNeGardePasTonExpedition;

export type StopState = 'done' | 'skipped' | 'next' | 'ahead';
/** One stop of the road: a mission, a mission of a path, a halt, or the guardian. */
export type RoadStop = Readonly<{
  kind: 'battle' | 'guardian' | 'halt';
  path?: Path;
  halt?: HaltKind;
  /** The mission's number in its tableau; none for a halt. */
  mission?: number;
  state: StopState;
  /** Told to someone who cannot see the road: what the stop is, then where it stands. */
  name: string;
  detail: string;
  said: string;
}>;

/**
 * The road of the tableau under way, column by column: one stop, or two where the road
 * splits (a fork's two paths, a halt's two halts). The stops passed are the ones chosen;
 * those not taken stay on the road, faded.
 */
export function roadColumns(state: ExpeditionState): RoadStop[][] {
  const here = state.status === 'arrived' ? STEPS_PER_TABLEAU : state.step;
  let mission = 0;
  return expeditionPlanOf(state).tableaux[state.tableau].map((step, index) => {
    const picked = pickAt(state, index) ?? 0;
    const stateOf = (choice: number): StopState =>
      index < here
        ? choice === picked
          ? 'done'
          : 'skipped'
        : index === here && !state.pending
          ? 'next'
          : 'ahead';
    if (step.kind === 'halt')
      return step.halts.map((halt, choice) => {
        const stop = stateOf(choice);
        return {
          kind: 'halt',
          halt,
          state: stop,
          name: fill(TEXT.halteN, HALT_NAMES[halt]),
          detail: '',
          said: HALT_SAID[stop],
        };
      });
    mission++;
    const number = fill(TEXT.etapeN, mission);
    if (step.kind === 'fork')
      return (['calm', 'brave'] as const).map((path, choice) => {
        const stop = stateOf(choice);
        return {
          kind: 'battle',
          path,
          mission,
          state: stop,
          name: PATH_NAMES[path],
          detail: number,
          said: MISSION_SAID[stop],
        };
      });
    const stop = stateOf(0);
    const king = step.battle.king;
    return [
      {
        kind: king ? 'guardian' : 'battle',
        mission,
        state: stop,
        name: king ? fill(TEXT.leGardienN, GUARDIAN_NAMES[state.tableau]) : number,
        detail: '',
        said: MISSION_SAID[stop],
      },
    ];
  });
}
const MISSION_SAID: Record<StopState, string> = {
  done: TEXT.gagnee,
  skipped: TEXT.pasChoisi,
  next: TEXT.aJouer,
  ahead: TEXT.aVenir,
};
// A halt is passed, never won; at a halt the child chooses.
const HALT_SAID: Record<StopState, string> = {
  done: TEXT.passee,
  skipped: TEXT.pasChoisie,
  next: TEXT.aChoisir,
  ahead: TEXT.aVenir,
};

/** A gift on a card: its name, what it gives once taken, and the words of its button. */
export function giftWords(
  state: ExpeditionState,
  id: BoonId,
  rare: boolean,
): { title: string; detail: string; action: string; plain: boolean } {
  if (isLastingBoon(id)) {
    const owned = boonLevel(state.boons, id);
    const next = levelAfterGift(state, id, rare);
    const action = owned
      ? fill(TEXT.monterAuNiveauN, next)
      : next > 1
        ? fill(TEXT.choisirNiveauN, next)
        : TEXT.choisirCeCadeau;
    // A plain « Choisir » : neither a level to say nor a level to climb.
    const plain = !owned && next <= 1;
    return { title: boonTitle(id), detail: boonDetail(id, next, RULES.steps), action, plain };
  }
  const reward = REWARDS[id as RewardId];
  const detail =
    id === 'pieces'
      ? fill(TEXT.nPiecesPourRecruterTesAllies, giftCoins(rare))
      : `${reward.detail} ${TEXT.pourLaProchaineEtape}`;
  return { title: reward.title, detail, action: TEXT.choisirCeCadeau, plain: true };
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
    fill(TEXT.tonCristalNPourcent, Math.round(camp.base)),
  ];
}

/** What a halt did, said once on the map after it. */
export function haltNotice(before: ExpeditionState, after: ExpeditionState, halt: HaltKind) {
  if (halt === 'feu') return TEXT.tonCristalSEstRepareTesAllies;
  if (halt !== 'oeuf') return '';
  const climbed = after.boons.find((b) => boonLevel(before.boons, b.id) < b.level);
  if (climbed)
    return fill(TEXT.lOeufMystereFaitMonterNAuNiveauN, boonTitle(climbed.id), climbed.level);
  return fill(TEXT.lOeufMystereTOffreNPieces, tuningOf(before).eggCoins);
}

/** Before an expedition under way is replaced: what would stop. */
export const replaceSentence = (state: ExpeditionState): string => {
  const won = battlesWon(state);
  return fill(TEXT.tuAsDejaGagneNEtapeNSiTuChanges, won, plural(won));
};

/** The small mark on the board: the child is on the expedition, at this mission. */
export const battleMark = (state: ExpeditionState): string =>
  fill(TEXT.expeditionEtapeNSurN, missionInTableau(state), BATTLES_PER_TABLEAU);

/**
 * The end of a battle, on the board. `after` is the expedition once the battle is recorded,
 * null when the snakes won: the camp comes back as it was. One way on, whatever happened.
 */
export function battleOutcome(after: ExpeditionState | null | 'unsaved'): {
  note: string;
  button: string;
} {
  // A victory the device refused to keep: said plainly, and the way back is still there.
  if (after === 'unsaved')
    return { note: TEXT.taVictoireNAPasPuEtreGardee, button: TEXT.revenirALExpedition };
  if (!after) return { note: TEXT.rienNEstPerduRejoueCetteEtape, button: TEXT.revenirALExpedition };
  if (after.status === 'arrived')
    return {
      note: fill(TEXT.nEstVaincuTuAsFiniLaGrandeExpedition, GUARDIAN_NAMES.at(-1)!),
      button: TEXT.continuerLExpedition,
    };
  const note =
    after.step === 0
      ? GUARDIAN_BEATEN_ONWARD[after.tableau - 1]
      : TEXT.tonCampTeSuitALEtapeSuivante;
  return { note, button: TEXT.continuerLExpedition };
}
/** What the board's status line says is kept, true to what the device did. */
export const keptLine = (saved: boolean) =>
  saved ? TEXT.lExpeditionEstGardeeEntreDeuxEtapes : TEXT.cetAppareilNeGardePasLExpedition;

export const arrivedLine = () => fill(TEXT.tuAsGagneLesNEtapes, EXPEDITION_BATTLES);
export const coinsLine = (coins: number) => fill(TEXT.tuAsNPieces, coins);
export const capriceLabel = (name: string) => fill(TEXT.leDefiDeLEtapeN, name);
