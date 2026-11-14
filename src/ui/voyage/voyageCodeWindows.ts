import { setText } from '../../i18n/dom.ts';
import { decodeVoyage } from '../../voyageCode.ts';
import type { VoyageVersion } from '../../voyageTuning.ts';
import { bindCopyButton } from '../departures.ts';
import { make } from '../dom.ts';
import { closeButton, voyageWindow } from './voyageWindow.ts';
import { codeRefusal } from './voyageWords.ts';

/**
 * « Donner mon voyage » : the code of the voyage, to copy or to read aloud. A brother or a
 * sister who types it plays the same five stages. Returns the function that shows a code.
 */
export function giftWindow(): (code: string) => void {
  const { dialog } = voyageWindow('voyage-gift', 'Donne ton voyage');
  const field = make('input', { id: 'voyage-gift-code', className: 'departure-value' });
  field.readOnly = true;
  field.setAttribute('aria-labelledby', 'voyage-gift-title');
  const copy = make('button', { id: 'voyage-gift-copy', className: 'secondary', text: 'Copier' });
  copy.type = 'button';
  const message = make('p', { id: 'voyage-gift-message', className: 'departure-message' });
  message.setAttribute('role', 'status');
  dialog.append(
    make('p', {
      text: 'Donne ce code à ton frère ou à ta sœur. Il ou elle fera le même voyage que toi.',
    }),
    make('div', { className: 'departure-entry' }, field, copy),
    message,
    closeButton(dialog, 'primary'),
  );
  bindCopyButton(field.id, copy.id, message.id);
  return (code) => {
    field.value = code;
    setText(message, '');
    dialog.showModal();
  };
}

/** The field where a code is typed, and what is said when the code is not one. */
function codeForm(take: (seed: number, version: VoyageVersion) => void) {
  const input = make('input', { id: 'voyage-code-input', className: 'departure-value' });
  input.type = 'text';
  input.maxLength = 64;
  input.autocomplete = 'off';
  input.autocapitalize = 'characters';
  input.spellcheck = false;
  input.placeholder = 'VOYAGE-1-0000-00';
  const label = make('label', { text: 'Tape le code qu’on t’a donné' });
  label.htmlFor = input.id;
  const message = make('p', { id: 'voyage-code-message', className: 'departure-message' });
  message.setAttribute('role', 'status');
  input.setAttribute('aria-describedby', message.id);
  const submit = make('button', { className: 'secondary', text: 'Faire ce voyage' });
  submit.type = 'submit';
  const form = make(
    'form',
    { id: 'voyage-code-form' },
    label,
    make('div', { className: 'departure-entry' }, input, submit),
    message,
  );
  const forget = () => {
    input.removeAttribute('aria-invalid');
    setText(message, '');
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    const code = decodeVoyage(input.value);
    if (code.ok) return take(code.seed, code.version);
    setText(message, codeRefusal(code.reason));
    input.setAttribute('aria-invalid', 'true');
  };
  input.oninput = forget;
  return {
    form,
    /** An empty field for the next opening. */
    reset() {
      input.value = '';
      forget();
    },
  };
}

/**
 * « Un autre voyage » : draw a new one, or type the code someone gave. Opened from a screen
 * that already has its own « Un nouveau voyage », the window keeps only the code. Returns
 * the function that opens it.
 */
export function otherVoyageWindow(actions: {
  fresh: () => void;
  take: (seed: number, version: VoyageVersion) => void;
}): (codeOnly: boolean) => void {
  const { dialog, heading } = voyageWindow('voyage-other', 'Un autre voyage');
  const fresh = make('button', {
    id: 'voyage-other-new',
    className: 'primary',
    text: 'Un nouveau voyage',
  });
  fresh.type = 'button';
  fresh.onclick = () => {
    dialog.close();
    actions.fresh();
  };
  const code = codeForm((seed, version) => {
    dialog.close();
    actions.take(seed, version);
  });
  dialog.append(fresh, code.form, closeButton(dialog, 'secondary'));
  return (codeOnly) => {
    setText(heading, codeOnly ? 'Tu as un code ?' : 'Un autre voyage');
    fresh.hidden = codeOnly;
    code.reset();
    dialog.showModal();
  };
}
