/**
 * A window that asks before something is done. What was asked waits here: the cancel button
 * and Escape forget it, the confirm button closes the window and only then hands it over.
 * Returns the function that asks.
 */
export function bindPendingConfirm<T>(
  dialog: HTMLDialogElement,
  cancel: HTMLElement,
  confirm: HTMLElement,
  accept: (asked: T) => void,
): (asked: T) => void {
  let pending: T | null = null;
  cancel.onclick = () => {
    pending = null;
    dialog.close();
  };
  dialog.addEventListener('cancel', () => {
    pending = null;
  });
  confirm.onclick = () => {
    if (pending === null) return;
    const asked = pending;
    pending = null;
    dialog.close();
    accept(asked);
  };
  return (asked) => {
    pending = asked;
    dialog.showModal();
  };
}
