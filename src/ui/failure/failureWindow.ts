import { make } from '../dom.ts';
import { showTrouble } from './trouble.ts';
import * as TEXT from '../../texts/fr/failure.ts';

/** The mark left in the page's own history when the game is started again after a failure. */
const SEEN = 'failureSeen';
/** True when this page was already started again once after a failure. */
function seenBefore(): boolean {
  try {
    return (history.state as Record<string, unknown> | null)?.[SEEN] === true;
  } catch {
    return false;
  }
}

/**
 * The window shown when the board has stopped on an error. The only way on is to start the
 * game again: the battle under way is played again from its beginning. The second time in a
 * row, the child is sent to a grown-up instead of pressing again and again. The detail is for
 * a parent to show, never a stack.
 */
export function showFailure(detail: string): void {
  // The version shown on the page and the error's own words: neither is a text of the game.
  const note = make('p', { id: 'failure-detail' });
  note.dataset.copyRaw = '';
  const version = document.querySelector('[data-app-version]')?.textContent ?? '';
  note.textContent = [version, detail].filter(Boolean).join(' · ');
  showTrouble({
    id: 'failure',
    title: TEXT.oupsLeJeuSEstEmmele,
    words: seenBefore() ? TEXT.caRecommenceVaChercherUnAdulte : TEXT.relanceLeJeuTuDevrasRefaire,
    button: TEXT.relancerLeJeu,
    act: () => {
      // Kept by the page itself for as long as it stays open: nothing is stored on the device.
      try {
        history.replaceState({ ...(history.state as object | null), [SEEN]: true }, '');
      } catch {
        /* A page that cannot mark itself says the first sentence again. */
      }
      location.reload();
    },
    parents: [make('p', { text: TEXT.uneErreurAArreteLeJeu }), note],
  });
}
