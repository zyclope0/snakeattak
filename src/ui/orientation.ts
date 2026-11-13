import type { Session } from '../session.ts';
import { pauseStateFor } from './pauseState.ts';
import { portraitPhone } from './dom.ts';

/** A portrait touch screen hides the board, so its battle must wait as well. */
export function bindOrientation(session: Session, refresh: () => void) {
  const portrait = portraitPhone();
  const pauses = pauseStateFor(session);
  let pausedGame: Session['game'] | null = null;
  let release: (() => void) | undefined;
  const sync = () => {
    if (portrait.matches) {
      if (pausedGame !== session.game) {
        release?.();
        pausedGame = session.game;
        release = pauses.hold();
      }
    } else if (release) {
      release();
      release = undefined;
      pausedGame = null;
    }
    pauses.sync();
  };
  portrait.addEventListener('change', () => refresh());
  return sync;
}
