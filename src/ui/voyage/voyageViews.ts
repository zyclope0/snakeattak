import type { CapriceDefinition } from '../../caprices.ts';
import type { RewardId } from '../../rewards.ts';
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
  /** « La Grande Expédition », which took the voyage's place: once a voyage is over. */
  expedition: () => void;
};

function action(id: string, className: string, text: string, run: () => void) {
  const button = make('button', { id, className, text });
  button.type = 'button';
  button.onclick = run;
  return button;
}

/** One card is kept after each stage but the last: so many places in the bag. */
const bagOf = (state: VoyageState) => bagRow(state.bag, voyagePlanOf(state).stages.length - 1);

/** « Ton plus long voyage » and the bag, side by side under a path that is over. */
function summary(state: VoyageState, best: number) {
  const line = recordLine(best);
  const row = make('div', { className: 'voyage-summary' });
  if (line) row.append(make('p', { className: 'voyage-best', text: line }));
  row.append(bagOf(state));
  return row;
}

/**
 * The map: five stops on a path, the one to play in front with its button, then the bag.
 * `leftHalfway` tells that the stage to play was begun and left.
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
    make('div', { className: 'voyage-foot' }, bagOf(state)),
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

/** The one way on once a voyage is over: « La Grande Expédition » took its place. */
const onward = (actions: ViewActions) =>
  make(
    'div',
    { className: 'voyage-actions' },
    action('voyage-expedition', 'primary', TEXT.laGrandeExpedition, actions.expedition),
  );

/** The voyage is finished: the path travelled, the record, then the expedition. */
export function arrivedView(state: VoyageState, best: number, actions: ViewActions): Node[] {
  return [voyagePath(state, { explain: actions.explain }), summary(state, best), onward(actions)];
}

/** The camp fell: how far the voyage went, said kindly, and the expedition to set out on. */
export function fallenView(state: VoyageState, best: number, actions: ViewActions): Node[] {
  return [
    make('p', { className: 'voyage-fallen', text: fallenSentence(state) }),
    voyagePath(state, { explain: actions.explain }),
    summary(state, best),
    onward(actions),
  ];
}
