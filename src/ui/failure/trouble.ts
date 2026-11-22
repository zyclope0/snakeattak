import './failure.css';
import { make } from '../dom.ts';
import * as TEXT from '../../texts/fr/failure.ts';

type Trouble = {
  /** The start of the ids of the window: `failure`, `start`. */
  id: string;
  title: string;
  /** One sentence for the child: what to do now. */
  words: string;
  button: string;
  act: () => void;
  /** What a parent needs, folded under « Pour les parents »; nothing when empty. */
  parents: Node[];
};

/**
 * The one window for a game that cannot go on: a title, one sentence for the child, one
 * button, and what a parent needs folded underneath. It cannot be closed: behind it nothing
 * works, and the button is the only way on.
 */
export function showTrouble({ id, title, words, button, act, parents }: Trouble): void {
  if (document.getElementById(`${id}-dialog`)) return;
  const heading = make('h2', { id: `${id}-title`, text: title });
  const action = make('button', { id: `${id}-button`, className: 'primary', text: button });
  action.type = 'button';
  action.onclick = act;
  const dialog = make(
    'dialog',
    { id: `${id}-dialog`, className: 'trouble' },
    heading,
    make('p', { text: words }),
    action,
  );
  if (parents.length)
    dialog.append(
      make(
        'details',
        { id: `${id}-parents` },
        make('summary', { text: TEXT.pourLesParents }),
        ...parents,
      ),
    );
  dialog.setAttribute('aria-labelledby', heading.id);
  // A browser lets Escape through at the third press, whatever « cancel » answers; so the
  // window says it takes no closing request, and comes back if it is closed all the same.
  dialog.setAttribute('closedby', 'none');
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  dialog.addEventListener('close', () => dialog.showModal());
  document.body.append(dialog);
  dialog.showModal();
  // Nothing is done by a key pressed for something else: Space pauses the game, Enter
  // confirms elsewhere. The child reads, then touches the button.
  heading.tabIndex = -1;
  heading.focus();
}
