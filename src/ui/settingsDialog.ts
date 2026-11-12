import { setText as setDisplayText } from '../i18n/dom.ts';
import './settingsDialog.css';

let dialog: HTMLDialogElement | undefined;

/**
 * Réglages de l'appareil : musique, bruitages, langue, effets légers, et l'aide « Comment jouer ». La fenêtre est construite ici pour
 * ne pas alourdir la page de démarrage ; `sounds.ts` donne leur libellé et leur état aux deux
 * interrupteurs, `i18n/controls.ts` y ajoute le choix de la langue.
 */
export function settingsDialog() {
  if (dialog) return dialog;
  const made = document.createElement('dialog');
  made.id = 'settings-dialog';
  made.setAttribute('aria-labelledby', 'settings-title');
  const title = document.createElement('h2');
  title.id = 'settings-title';
  setDisplayText(title, 'Réglages');
  const list = document.createElement('div');
  list.className = 'settings-list';
  for (const id of ['setting-music', 'setting-effects']) {
    const toggle = document.createElement('button');
    toggle.id = id;
    toggle.className = 'setting-switch';
    toggle.setAttribute('aria-pressed', 'false');
    list.append(toggle);
  }
  const actions = document.createElement('div');
  actions.className = 'dialog-actions';
  const help = document.createElement('button');
  help.id = 'settings-help';
  help.className = 'secondary';
  setDisplayText(help, 'Comment jouer');
  help.onclick = () => {
    made.close();
    document.getElementById('help')?.click();
  };
  const close = document.createElement('button');
  close.id = 'settings-close';
  close.className = 'primary';
  setDisplayText(close, 'Fermer');
  close.onclick = () => made.close();
  actions.append(help, close);
  made.append(title, list, actions);
  document.body.append(made);
  dialog = made;
  return made;
}

/** Ouvre les réglages depuis l'accueil, la page des parents et la pause. */
export function bindSettingsDialog(refresh: () => void) {
  const panel = settingsDialog();
  // La pause masque son panneau tant qu'une fenêtre est ouverte : le redessiner à la fermeture.
  panel.addEventListener('close', refresh);
  document.querySelectorAll<HTMLButtonElement>('[data-settings]').forEach((opener) =>
    opener.addEventListener('click', () => {
      if (!panel.open) panel.showModal();
    }),
  );
}
