import type { Session } from '../session.ts';
import { pauseStateFor } from './pauseState.ts';

/** A dialogue owns only the pause it acquired, never a new game or a background pause. */
export function pauseForDialog(dialog: HTMLDialogElement, session: Session, refresh: () => void) {
  const pauses = pauseStateFor(session);
  let release: (() => void) | null = null;
  const settle = () => {
    // A queued close event from an earlier opening must not release a new one.
    if (!release || dialog.open) return;
    if (document.hidden) pauses.interrupt();
    release();
    release = null;
    refresh();
  };
  const close = () => {
    dialog.close();
    settle();
  };
  dialog.addEventListener('close', settle);
  const cancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  dialog.addEventListener('cancel', cancel);
  return {
    open() {
      if (dialog.open) return;
      settle();
      release = pauses.hold();
      try {
        dialog.showModal();
      } catch (error) {
        release();
        release = null;
        throw error;
      }
      refresh();
    },
    close,
    dispose() {
      close();
      dialog.removeEventListener('close', settle);
      dialog.removeEventListener('cancel', cancel);
    },
  };
}
