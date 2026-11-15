import type { CapriceDefinition } from '../../caprices.ts';
import type { RewardId } from '../../rewards.ts';
import { encodeVoyage } from '../../voyageCode.ts';
import { bonusOffer, voyagePlanOf } from '../../voyageState.ts';
import type { VoyageState } from '../../voyageState.ts';
import { make } from '../dom.ts';
import { bonusChoice, bonusRule } from './bonusChoice.ts';
import { bagRow } from './voyageBag.ts';
import { voyagePath } from './voyagePath.ts';
import { fallenSentence, recordLine, startLabel, voyagePromise } from './voyageWords.ts';
import * as TEXT from '../../texts/fr/voyageScreens.ts';

/** What the buttons of the views ask for; the voyage itself decides what happens. */
export type ViewActions = {
  start: () => void;
  explain: (caprice: CapriceDefinition) => void;
  choose: (card: RewardId) => void;
  /** Shows the code of the voyage, to give it. */
  give: () => void;
  /** Opens « Un autre voyage »; with `codeOnly`, only the field for a code. */
  other: (codeOnly: boolean) => void;
  fresh: () => void;
  again: () => void;
};

function action(id: string, className: string, text: string, run: () => void) {
  const button = make('button', { id, className, text });
  button.type = 'button';
  button.onclick = run;
  return button;
}

/** One card is kept after each stage but the last: so many places in the bag. */
const bagOf = (state: VoyageState) => bagRow(state.bag, voyagePlanOf(state).stages.length - 1);

/** The code of the voyage as a button: touching it opens the window that gives it. */
function codeButton(state: VoyageState, give: () => void) {
  const code = make('span', { className: 'departure-value' });
  code.dataset.copyRaw = '';
  code.textContent = encodeVoyage(state.seed, state.version);
  const button = make(
    'button',
    { id: 'voyage-code' },
    make('span', { text: TEXT.codeDuVoyage }),
    code,
  );
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  button.onclick = give;
  return button;
}

/** « Ton plus long voyage » and the bag, side by side under a path that is over. */
function summary(state: VoyageState, best: number) {
  const line = recordLine(best);
  const row = make('div', { className: 'voyage-summary' });
  if (line) row.append(make('p', { className: 'voyage-best', text: line }));
  row.append(bagOf(state));
  return row;
}

/**
 * The map: five stops on a path, the one to play in front with its button, then the bag
 * and the code. `leftHalfway` tells that the stage to play was begun and left.
 */
export function mapView(state: VoyageState, leftHalfway: boolean, actions: ViewActions): Node[] {
  return [
    make(
      'div',
      { className: 'voyage-intro' },
      make('h2', { text: voyagePromise(state) }),
      make('p', { text: TEXT.chaqueVoyageEstDifferentEntreDeux }),
    ),
    voyagePath(state, {
      start: { label: startLabel(leftHalfway), go: actions.start },
      explain: actions.explain,
    }),
    make(
      'div',
      { className: 'voyage-foot' },
      bagOf(state),
      action('voyage-other-open', 'secondary', TEXT.autreVoyage, () => actions.other(false)),
      codeButton(state, actions.give),
    ),
  ];
}

/** Between two stages: the three cards offered, and the bag they will join. */
export function bonusView(state: VoyageState, actions: ViewActions): Node[] {
  const coins = voyagePlanOf(state).tuning.bonusCoins;
  return [
    ...bonusChoice(bonusOffer(state), coins, actions.choose),
    make('div', { className: 'voyage-foot' }, bagOf(state), bonusRule()),
  ];
}

/** The voyage is finished: the path travelled, the record, a new voyage or this one to give. */
export function arrivedView(state: VoyageState, best: number, actions: ViewActions): Node[] {
  return [
    voyagePath(state, { explain: actions.explain }),
    summary(state, best),
    make(
      'div',
      { className: 'voyage-actions' },
      action('voyage-new', 'primary', TEXT.unNouveauVoyage, actions.fresh),
      action('voyage-give', 'secondary', TEXT.donnerMonVoyage, actions.give),
      action('voyage-have-code', 'secondary', TEXT.jAiUnCode, () => actions.other(true)),
    ),
  ];
}

/**
 * The camp fell: how far the voyage went, said kindly, and the same voyage to try again
 * before anything else.
 */
export function fallenView(state: VoyageState, best: number, actions: ViewActions): Node[] {
  return [
    make('p', { className: 'voyage-fallen', text: fallenSentence(state) }),
    voyagePath(state, { explain: actions.explain }),
    summary(state, best),
    make(
      'div',
      { className: 'voyage-actions' },
      action('voyage-again', 'primary', TEXT.refaireCeVoyage, actions.again),
      action('voyage-new', 'secondary', TEXT.unNouveauVoyage, actions.fresh),
      action('voyage-have-code', 'secondary', TEXT.jAiUnCode, () => actions.other(true)),
    ),
  ];
}
