import { setText } from '../../i18n/dom.ts';
import type { VoyageState } from '../../voyageState.ts';
import { make } from '../dom.ts';
import { bindPendingConfirm } from '../pendingConfirm.ts';
import { voyageWindow } from './voyageWindow.ts';
import { replaceSentence } from './voyageWords.ts';

/**
 * Asked before a voyage under way gives its place to another: what would stop, and two
 * answers. The new voyage waits in the window; « Garder mon voyage » and Escape forget it.
 * Returns the function that asks.
 */
export function replaceWindow(
  accept: (next: VoyageState) => void,
): (current: VoyageState, next: VoyageState) => void {
  const { dialog } = voyageWindow('voyage-replace', 'Changer de voyage ?');
  const sentence = make('p', { id: 'voyage-replace-text' });
  const keep = make('button', {
    id: 'voyage-keep',
    className: 'secondary',
    text: 'Garder mon voyage',
  });
  const change = make('button', {
    id: 'voyage-change',
    className: 'primary',
    text: 'Changer de voyage',
  });
  keep.type = change.type = 'button';
  dialog.append(sentence, make('div', { className: 'dialog-actions' }, keep, change));
  const ask = bindPendingConfirm<VoyageState>(dialog, keep, change, accept);
  return (current, next) => {
    setText(sentence, replaceSentence(current));
    ask(next);
  };
}
