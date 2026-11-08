import type { Session } from '../session.ts';
import { pauseStateFor } from './pauseState.ts';

/** A return from another app/page always waits for the child's Resume action. */
export function bindLifecycle(session: Session, refresh: () => void) {
  const pauses = pauseStateFor(session);
  const interrupt = () => {
    pauses.interrupt();
    refresh();
  };
  const visibility = () => {
    if (document.hidden) interrupt();
  };
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', interrupt);
  visibility();
  return () => {
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', interrupt);
  };
}
