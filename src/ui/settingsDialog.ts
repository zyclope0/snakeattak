import { setText as setDisplayText } from '../i18n/dom.ts';
import './settingsDialog.css';

/**
 * Réglages de l'appareil, ouverts depuis l'accueil, la page des parents et la pause.
 * La fenêtre est construite ici pour ne pas alourdir la page de démarrage ; `sounds.ts`
 * donne leur libellé et leur état aux deux interrupteurs.
 */
export function bindSettingsDialog(refresh: () => void) {
  const dialog = document.createElement('dialog');
  dialog.id = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-title');
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
  const close = document.createElement('button');
  close.id = 'settings-close';
  close.className = 'primary';
  setDisplayText(close, 'Fermer');
  close.onclick = () => dialog.close();
  actions.append(close);
  dialog.append(title, list, actions);
  document.body.append(dialog);
  // La pause masque son panneau tant qu'une fenêtre est ouverte : le redessiner à la fermeture.
  dialog.addEventListener('close', refresh);
  document.querySelectorAll<HTMLButtonElement>('[data-settings]').forEach((opener) =>
    opener.addEventListener('click', () => {
      if (!dialog.open) dialog.showModal();
    }),
  );
}
