import type { Session } from '../session.ts';

/** A portrait touch screen hides the board, so its battle must wait as well. */
export function bindOrientation(session: Session, refresh: () => void) {
  const portrait = matchMedia('(pointer: coarse) and (orientation: portrait)');
  let pausedGame: Session['game'] | null = null;
  let wasPaused = false;
  const sync = () => {
    if (portrait.matches) {
      if (pausedGame !== session.game) {
        pausedGame = session.game;
        wasPaused = pausedGame.paused;
      } else if (!pausedGame.paused) {
        // A dialog may release its own pause while the rotation notice is up.
        wasPaused = false;
      }
      pausedGame.paused = true;
    } else if (pausedGame === session.game) {
      pausedGame.paused = wasPaused || document.hidden || !!document.querySelector('dialog[open]');
      pausedGame = null;
    }
  };
  portrait.addEventListener('change', () => refresh());
  return sync;
}
