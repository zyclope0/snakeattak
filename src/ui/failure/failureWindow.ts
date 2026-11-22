import './failure.css';
import { make } from '../dom.ts';
import * as TEXT from '../../texts/fr/failure.ts';

/**
 * The window shown when the board has stopped on an error. It cannot be closed: the board
 * behind it no longer moves, and the only way on is to start the game again, which brings
 * back the camp as it was last saved. The detail is for a parent to copy, never a stack.
 */
export function showFailure(detail: string): void {
  if (document.getElementById('failure-dialog')) return;
  const title = make('h2', { id: 'failure-title', text: TEXT.oupsLeJeuSEstEmmele });
  const again = make('button', {
    id: 'failure-reload',
    className: 'primary',
    text: TEXT.relancerLeJeu,
  });
  again.type = 'button';
  again.onclick = () => location.reload();
  // The version shown on the page and the error's own words: neither is a text of the game.
  const note = make('p', { id: 'failure-detail' });
  note.dataset.copyRaw = '';
  const version = document.querySelector('[data-app-version]')?.textContent ?? '';
  note.textContent = [version, detail].filter(Boolean).join(' · ');
  const parents = make(
    'details',
    { id: 'failure-parents' },
    make('summary', { text: TEXT.pourLesParents }),
    make('p', { text: TEXT.leJeuSEstArreteSurUneErreur }),
    note,
  );
  const dialog = make(
    'dialog',
    { id: 'failure-dialog' },
    title,
    make('p', { text: TEXT.relanceLeJeuTuRetrouverasTonCamp }),
    again,
    parents,
  );
  dialog.setAttribute('aria-labelledby', title.id);
  // The board behind no longer moves: the window must stay. A browser lets Escape through at
  // the third press, whatever « cancel » answers; so the window says it takes no closing
  // request, and comes back if it is closed all the same.
  dialog.setAttribute('closedby', 'none');
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  dialog.addEventListener('close', () => dialog.showModal());
  document.body.append(dialog);
  dialog.showModal();
  // Nothing is reloaded by a key pressed for something else: Space pauses the game, Enter
  // confirms elsewhere. The child reads, then touches the button.
  title.tabIndex = -1;
  title.focus();
}
