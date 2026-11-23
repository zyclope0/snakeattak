import './failure/failure.css';
import { make } from './dom.ts';
import { fill } from '../texts/fill.ts';
import * as TEXT from '../texts/fr/gate.ts';
import { gateNumbers, rightAnswer } from './adultGateAnswer.ts';

/**
 * Before Android's share sheet opens, an adult answers a multiplication (the parent's
 * decision 3, 23 November 2026): the sheet shows recent contacts, and « Pour les parents »
 * has no gate of its own. A child of 6 to 10 does not find the answer easily; a wrong one,
 * « Annuler », Escape or the back gesture send nothing. The application only: on the website
 * the file goes to the browser's downloads. Loaded only when a file is asked for.
 */

/** Asks the adult; true only on the right answer. */
export function askAdult(random: () => number = Math.random): Promise<boolean> {
  const [a, b] = gateNumbers(random);
  return new Promise((resolve) => {
    const title = make('h2', {
      id: 'adult-gate-title',
      text: TEXT.pourEnvoyerLeFichierUnAdulteRepond,
    });
    const label = make('label', { text: fill(TEXT.combienFont, a, b) });
    label.htmlFor = 'adult-gate-answer';
    const input = make('input', { id: 'adult-gate-answer' });
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    const send = make('button', {
      id: 'adult-gate-send',
      className: 'primary',
      text: TEXT.envoyerLeFichier,
    });
    send.type = 'submit';
    const cancel = make('button', {
      id: 'adult-gate-cancel',
      className: 'secondary',
      text: TEXT.annulerLEnvoi,
    });
    cancel.type = 'button';
    const form = make(
      'form',
      { className: 'adult-gate-form' },
      label,
      input,
      make('div', { className: 'adult-gate-actions' }, cancel, send),
    );
    const dialog = make('dialog', { id: 'adult-gate', className: 'trouble' }, title, form);
    dialog.setAttribute('aria-labelledby', title.id);
    let answered = false;
    const done = (right: boolean) => {
      if (answered) return;
      answered = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve(right);
    };
    form.onsubmit = (event) => {
      event.preventDefault();
      done(rightAnswer(a, b, input.value));
    };
    cancel.onclick = () => done(false);
    // Escape, or Android's back gesture: nothing is sent.
    dialog.addEventListener('close', () => done(false));
    document.body.append(dialog);
    dialog.showModal();
    input.focus();
  });
}
