import { make } from './dom.ts';
import './settingsDialog.css';

let dialog: HTMLDialogElement | undefined;

/** A switch that `sounds.ts` names and keeps in step with the sound it turns on or off. */
function soundSwitch(id: string) {
  const toggle = make('button', { id, className: 'setting-switch' });
  toggle.setAttribute('aria-pressed', 'false');
  return toggle;
}

/**
 * The settings of the device: music, sound effects, language, light effects, and the "how to
 * play" help. The window is built here so that the start page stays light. `sounds.ts` gives
 * the two switches their label and state; the language and the light effects add their own
 * row (`settingsList`).
 */
export function settingsDialog() {
  if (dialog) return dialog;
  const made = make('dialog', { id: 'settings-dialog' });
  made.setAttribute('aria-labelledby', 'settings-title');
  const title = make('h2', { id: 'settings-title', text: 'Réglages' });
  const list = make(
    'div',
    { className: 'settings-list' },
    soundSwitch('setting-music'),
    soundSwitch('setting-effects'),
  );
  const help = make('button', {
    id: 'settings-help',
    className: 'secondary',
    text: 'Comment jouer',
  });
  help.onclick = () => {
    made.close();
    document.getElementById('help')?.click();
  };
  const close = make('button', { id: 'settings-close', className: 'primary', text: 'Fermer' });
  close.onclick = () => made.close();
  made.append(title, list, make('div', { className: 'dialog-actions' }, help, close));
  document.body.append(made);
  dialog = made;
  return made;
}

/** The rows of the window, where a setting that lives elsewhere adds its own. */
export const settingsList = () => settingsDialog().querySelector<HTMLElement>('.settings-list')!;

/** Opens the settings from the home, the parents' page and the pause. */
export function bindSettingsDialog(refresh: () => void) {
  const panel = settingsDialog();
  // The pause hides its panel while a window is open: draw it again once this one closes.
  panel.addEventListener('close', refresh);
  // The `close` event comes a moment after the window closes: with the "Fermer" button the
  // pause panel is back at once, with no frame in between where it is missing.
  panel.querySelector('#settings-close')?.addEventListener('click', refresh);
  document.querySelectorAll<HTMLButtonElement>('[data-settings]').forEach((opener) =>
    opener.addEventListener('click', () => {
      if (!panel.open) panel.showModal();
    }),
  );
}
