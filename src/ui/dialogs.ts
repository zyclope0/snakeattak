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
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  document.addEventListener('visibilitychange', () => {
    if (observed && document.hidden) wasPaused = true;
  });
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
  };
}
