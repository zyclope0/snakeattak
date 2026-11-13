import { setText } from '../i18n/dom.ts';
import { part, words } from './playerParts.ts';

export type PlayersView = 'who' | 'pick' | 'manage' | 'confirm';

/**
 * The window of the players, built here so the page of the first launch is not made
 * heavier. It shows one view at a time and gives the focus back when it closes.
 *
 * `askAgain` draws « Qui joue ? » again: while an answer is required the window cannot be
 * left. `fallback` gets the focus when what opened the window is no longer on screen.
 */
export function createPlayersDialog(askAgain: () => void, fallback: HTMLElement) {
  let required = false;
  let opener: HTMLElement | null = null;
  let waiting = false;

  const dialog = part('dialog', 'players-dialog');
  dialog.id = 'players-dialog';
  dialog.setAttribute('aria-labelledby', 'players-title');
  const head = part('div', 'players-head');
  const title = part('h2');
  title.id = 'players-title';
  const close = words('button', 'Fermer', 'secondary');
  close.id = 'players-close';
  head.append(title, close);
  // The body alone is redrawn: the "turn your phone" notice may be lodged in the dialog.
  const body = part('div', 'players-body');
  const status = part('p', 'players-status');
  status.setAttribute('role', 'status');
  dialog.append(head, body, status);
  document.body.append(dialog);

  function show(view: PlayersView, heading: string, content: HTMLElement[], focus: HTMLElement) {
    dialog.dataset.view = view;
    setText(title, heading);
    setText(status, '');
    // The two lists close; a choice in progress goes back with its own button. At the
    // opening of the game the only way out is to say who plays.
    close.hidden = required || (view !== 'who' && view !== 'manage');
    body.replaceChildren(...content);
    if (!dialog.open) dialog.showModal();
    waiting = true;
    focus.focus({ preventScroll: true });
  }
  /** Once per closing, at once for a button and at the `close` event for Escape. */
  function settle() {
    if (dialog.open || !waiting) return;
    // A second Escape can close a dialog whose first one was refused: ask again.
    if (required) return askAgain();
    waiting = false;
    const back = [opener, fallback, document.getElementById('home-back')].find(
      (node) => node?.getClientRects().length,
    );
    opener = null;
    back?.focus({ preventScroll: true });
  }
  function shut() {
    dialog.close();
    settle();
  }

  close.onclick = () => shut();
  dialog.addEventListener('cancel', (event) => {
    if (required) event.preventDefault();
  });
  dialog.addEventListener('close', settle);

  return {
    close,
    show,
    shut,
    /** The view on screen, undefined while the window is closed. */
    shown: () => (dialog.open ? (dialog.dataset.view as PlayersView) : undefined),
    /** What opened the window gets the focus back when it closes. */
    openedBy(node: HTMLElement) {
      opener = node;
    },
    /** At the opening of the game with several players: no way out but an answer. */
    require(answer: boolean) {
      required = answer;
    },
    fail: () => setText(status, 'Impossible d’enregistrer ce joueur sur cet appareil.'),
  };
}
