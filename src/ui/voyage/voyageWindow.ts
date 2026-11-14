import { make } from '../dom.ts';

/**
 * A small window of the voyage, built on first use and named by its heading. It opens over
 * the page of the voyage and closes with its own buttons or with Escape; the browser gives
 * the focus back to what opened it.
 */
export function voyageWindow(id: string, title: string) {
  const heading = make('h2', { id: `${id}-title`, text: title });
  const dialog = make('dialog', { id, className: 'voyage-window' }, heading);
  dialog.setAttribute('aria-labelledby', heading.id);
  document.body.append(dialog);
  return { dialog, heading };
}

/** A button that only closes its window. */
export function closeButton(dialog: HTMLDialogElement, className: string) {
  const button = make('button', { className, text: 'Fermer' });
  button.type = 'button';
  button.onclick = () => dialog.close();
  return button;
}
