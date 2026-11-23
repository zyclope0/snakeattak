import { make } from '../dom.ts';
import { showTrouble } from './trouble.ts';
import * as TEXT from '../../texts/fr/failure.ts';

/** The mark left in the page's own history when the game is started again after a failure. */
const RELAUNCHED = 'relaunchedAfterFailure';
/** How long after such a start a new failure counts as « the same thing again ». */
const AGAIN_WITHIN_MS = 5 * 60_000;
/** True when this page was started again after a failure a few minutes ago at most. */
function failedJustBefore(): boolean {
  try {
    const at = (history.state as Record<string, unknown> | null)?.[RELAUNCHED];
    const since = typeof at === 'number' ? Date.now() - at : -1;
    // A clock set back, or a mark from the future, says nothing about « just before ».
    return since >= 0 && since < AGAIN_WITHIN_MS;
  } catch {
    return false;
  }
}

/**
 * The window shown when the board has stopped on an error. The only way on is to start the
 * game again. In the middle of a fight the child is told the battle is to be played again from
 * its beginning, which is true in every mode; anywhere else nothing is to be played again, and
 * nothing is said about it. When it happens again within a few minutes of such a start, the
 * child is sent to a grown-up instead of pressing again and again. The detail is for a parent
 * to show, never a stack.
 */
export function showFailure(detail: string): void {
  // The version shown on the page and the error's own words: neither is a text of the game.
  const note = make('p', { id: 'failure-detail' });
  note.dataset.copyRaw = '';
  const version = document.querySelector('[data-app-version]')?.textContent ?? '';
  note.textContent = [version, detail].filter(Boolean).join(' · ');
  const fighting = document.getElementById('app')?.dataset.status === 'fighting';
  showTrouble({
    id: 'failure',
    title: TEXT.oupsLeJeuSEstEmmele,
    words: failedJustBefore()
      ? TEXT.caRecommenceVaChercherUnAdulte
      : fighting
        ? TEXT.relanceLeJeuTuDevrasRefaire
        : TEXT.relanceLeJeuPourContinuerAJouer,
    button: TEXT.relancerLeJeu,
    act: () => {
      // Kept by the page itself for as long as it stays open: nothing is stored on the device.
      try {
        history.replaceState({ ...(history.state as object | null), [RELAUNCHED]: Date.now() }, '');
      } catch {
        /* A page that cannot mark itself says the first sentence again. */
      }
      location.reload();
    },
    parents: [make('p', { text: TEXT.uneErreurAArreteLeJeu }), note],
  });
}
