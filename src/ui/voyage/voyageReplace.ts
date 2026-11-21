import { setText } from '../../i18n/dom.ts';
import type { VoyageState } from '../../voyageState.ts';
import { make } from '../dom.ts';
import { bindPendingConfirm } from '../pendingConfirm.ts';
import { voyageWindow } from './voyageWindow.ts';
import { replaceSentence } from './voyageWords.ts';
import * as TEXT from '../../texts/fr/voyageScreens.ts';

/** What a window that asks before a journey under way is replaced is made of. */
export type ReplaceWords<State> = {
  /** The window's id; its buttons are `${id}-keep` and `${id}-change`. */
  id: string;
  title: string;
  keep: string;
  change: string;
  /** What would stop, said from the journey under way. */
  sentence: (current: State) => string;
};

/**
 * Asked before a journey under way gives its place to another: what would stop, and two
 * answers. The new one waits in the window; « Garder » and Escape forget it. Returns the
 * function that asks. The voyage's own words unless others are given (the expedition's).
 */
export function replaceWindow<State = VoyageState>(
  accept: (next: State) => void,
  words: ReplaceWords<State> = {
    id: 'voyage',
    title: TEXT.changerDeVoyage,
    keep: TEXT.garderMonVoyage,
    change: TEXT.changerDeVoyage2,
    sentence: replaceSentence as unknown as (current: State) => string,
  },
): (current: State, next: State) => void {
  const { dialog } = voyageWindow(`${words.id}-replace`, words.title);
  const sentence = make('p', { id: `${words.id}-replace-text` });
  const keep = make('button', { id: `${words.id}-keep`, className: 'secondary', text: words.keep });
  const change = make('button', {
    id: `${words.id}-change`,
    className: 'primary',
    text: words.change,
  });
  keep.type = change.type = 'button';
  dialog.append(sentence, make('div', { className: 'dialog-actions' }, keep, change));
  const ask = bindPendingConfirm<State>(dialog, keep, change, accept);
  return (current, next) => {
    setText(sentence, words.sentence(current));
    ask(next);
  };
}
