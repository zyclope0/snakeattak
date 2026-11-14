import { REWARDS } from '../../rewards.ts';
import type { RewardId } from '../../rewards.ts';
import type { VoyageCode } from '../../voyageCode.ts';
import { voyagePhase, voyagePlanOf } from '../../voyageState.ts';
import type { VoyageState } from '../../voyageState.ts';

/**
 * What the voyage says, and when. Presentation only, without a page: every sentence is
 * chosen here from the state of the voyage, so that a test can read them all. Each one is a
 * single literal or a single template, which the translator needs to find it whole.
 */

const plural = (count: number) => (count > 1 ? 's' : '');
const stagesOf = (state: VoyageState) => voyagePlanOf(state).stages.length;

/** A voyage with something to lose: a stage won, and more to play. */
export const underWay = (state: VoyageState | null): state is VoyageState =>
  !!state && state.status === 'travelling' && state.won > 0;

/** The name of the screen, and the stage it is about when there is one to play. */
export function voyageHeading(state: VoyageState): { title: string; step: string } {
  switch (voyagePhase(state)) {
    case 'stage':
      return { title: 'Le voyage', step: `Étape ${state.won + 1} sur ${stagesOf(state)}` };
    case 'bonus':
      return { title: `Étape ${state.won} réussie !`, step: '' };
    case 'arrived':
      return { title: 'Bravo, tu as fini le voyage !', step: '' };
    case 'fallen':
      return { title: `Ton voyage s’arrête à l’étape ${state.won + 1}`, step: '' };
  }
}

/** « Ton plus long voyage » : a personal record, never a ranking. Nothing before a stage won. */
export const recordLine = (best: number): string =>
  best > 0 ? `Ton plus long voyage : ${best} étape${plural(best)}` : '';

/** What the map promises, for screens with room to spare. */
export const voyagePromise = (state: VoyageState): string =>
  `${stagesOf(state)} étapes jusqu’au roi à trois têtes`;

export type StopState = 'done' | 'next' | 'ahead' | 'fallen';
/** Where each stop of the path stands: won, to play, still ahead, or where the camp fell. */
export function stopStates(state: VoyageState): StopState[] {
  return voyagePlanOf(state).stages.map((_, index) => {
    if (index < state.won) return 'done';
    if (index > state.won) return 'ahead';
    return state.status === 'fallen' ? 'fallen' : 'next';
  });
}
const STOP_WORDS: Record<StopState, string> = {
  done: 'Étape réussie',
  next: 'Étape à jouer',
  ahead: 'Étape à venir',
  fallen: 'Le camp est tombé ici',
};
/** A stop told to someone who cannot see the path: its number, its mission, where it stands. */
export const stopWords = (index: number, mission: string, stop: StopState) => ({
  name: `Étape ${index + 1} : ${mission}`,
  state: STOP_WORDS[stop],
});
export const terrainLine = (land: string): string => `Terrain : ${land}`;
/** The lairs the first wave comes out of: one snake head for each on the stop. */
export const exitsLine = (lairs: number): string =>
  `Première vague : les serpents sortent de ${lairs} antre${plural(lairs)}`;
export const surpriseLabel = (caprice: string): string => `Caprice surprise : ${caprice}`;
/** Before the king's stage: the purse is smaller there, and the child is told why. */
export const kingPurseLine = (taken: number): string => `Le roi t’a pris ${taken} pièces.`;

/**
 * The button of the stop to play. A stage left halfway is not kept: where the child comes
 * back to it, the button says that it starts again.
 */
export const startLabel = (leftHalfway: boolean): string =>
  leftHalfway ? 'Recommencer l’étape' : 'C’est parti !';

/** Under the map: what is kept and what is not, or that this device keeps nothing. */
export const keepingNote = (saved: boolean): string =>
  saved
    ? 'Ton voyage est gardé sur cet appareil entre deux étapes. Une étape quittée repart de son début.'
    : 'Cet appareil ne garde pas ton voyage : finis-le avant de fermer le jeu.';

export const bagLabel = (cards: number, places: number): string =>
  `Ton sac de voyage : ${cards} bonus sur ${places}`;

/**
 * A bonus card of the voyage: the title of the great adventure's card and, in a child's
 * words, what it gives at every stage that follows. `coins` is what the voyage's table
 * gives for the purse.
 */
const BONUS_DETAILS: Record<RewardId, (coins: number) => string> = {
  'renfort-bouclier': () => 'Un Bouclier offert à chaque étape.',
  'renfort-ninja': () => 'Un Ninja offert à chaque étape.',
  'renfort-raptor': () => 'Un Vélociraptor offert à chaque étape.',
  miel: () => 'Ton miel dure plus longtemps à chaque étape.',
  cristal: () => 'Une protection pour ton cristal à chaque étape.',
  pieces: (coins) => `+${coins} pièces à chaque étape.`,
};
export const bonusWords = (id: RewardId, coins: number) => ({
  title: REWARDS[id].title,
  detail: BONUS_DETAILS[id](coins),
});

/** Where the voyage stopped, said without a reproach, and that it can be set out on again. */
export const fallenSentence = (state: VoyageState): string =>
  state.won > 0
    ? `Tu as réussi ${state.won} étape${plural(state.won)} sur ${stagesOf(state)}. Tu peux repartir !`
    : 'Le camp est tombé à la première étape. Tu peux repartir !';

/** Before a voyage under way is replaced: what would stop. */
export const replaceSentence = (state: VoyageState): string =>
  `Tu as déjà réussi ${state.won} étape${plural(state.won)} de ton voyage. Si tu en commences un autre, il s’arrête là.`;

type Refusal = Extract<VoyageCode, { ok: false }>['reason'];
const REFUSALS: Record<Refusal, string> = {
  format: 'Ce n’est pas un code de voyage. Un code s’écrit comme VOYAGE-1-0YK9-AY.',
  checksum: 'Il y a une erreur dans ce code. Vérifie les lettres et les chiffres.',
  version: 'Ce code vient d’une autre version du jeu. Demande à un parent de mettre le jeu à jour.',
};
/** Why a typed code was not taken, in words a child can act on. */
export const codeRefusal = (reason: Refusal): string => REFUSALS[reason];

/** The small mark on the board: the child is on a voyage, at this stage. */
export const battleMark = (stage: number, stages: number): string =>
  `Le voyage · Étape ${stage} sur ${stages}`;

/**
 * The end of a stage, on the board. `after` is the voyage once the stage is recorded, and
 * `stage` the number of the stage that has just been fought. One way on, whatever happened.
 */
export function stageOutcome(after: VoyageState, stage: number): { note: string; button: string } {
  switch (voyagePhase(after)) {
    case 'fallen':
      return {
        note: `Le camp est tombé à l’étape ${stage}. Tu pourras refaire ce voyage.`,
        button: 'Voir mon voyage',
      };
    case 'arrived':
      return {
        note: 'Le roi à trois têtes est battu. Tu as fini le voyage !',
        button: 'Continuer le voyage',
      };
    default:
      return {
        note: `Étape ${stage} sur ${stagesOf(after)} réussie. Choisis maintenant un bonus pour la suite.`,
        button: 'Continuer le voyage',
      };
  }
}
