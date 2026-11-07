import type { Session } from '../session.ts';

/** A dialogue owns only the pause it acquired, never a new game or a background pause. */
export function pauseForDialog(dialog: HTMLDialogElement, session: Session, refresh: () => void) {
  let observed: Session['game'] | null = null;
  let wasPaused = false;
  const settle = () => {
    if (!observed) return;
    if (session.game === observed) observed.paused = wasPaused || document.hidden;
    observed = null;
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
  const visibility = () => {
    if (observed && document.hidden) wasPaused = true;
  };
  document.addEventListener('visibilitychange', visibility);
  return {
    open() {
      if (dialog.open) return;
      observed = session.game;
      wasPaused = observed.paused;
      observed.paused = true;
      dialog.showModal();
      refresh();
    },
    close,
    dispose() {
      close();
      dialog.removeEventListener('close', settle);
      dialog.removeEventListener('cancel', cancel);
      document.removeEventListener('visibilitychange', visibility);
    },
  };
}
