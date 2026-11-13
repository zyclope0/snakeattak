import { setText as setDisplayText, appendText as appendDisplayText } from '../i18n/dom.ts';
import { backupSummary, readFamilyBackup, FAMILY_BYTE_LIMIT } from '../familyBackup.ts';
import type { FamilyBackup } from '../familyBackup.ts';
import { helpPoint } from './helpBubble.ts';
import { byId } from './dom.ts';
type Actions = {
  exportRaw: () => string | null;
  applyBackup: (backup: FamilyBackup) => {
    ok: boolean;
    message: string;
  };
  finished: () => void;
  persistenceStatus: () => string;
};
/** User-selected local data only. Preview and cancellation never mutate the adventure. */
export function bindFamilyControls(actions: Actions) {
  const dialog = byId<HTMLDialogElement>('family-dialog');
  const file = byId<HTMLInputElement>('family-file');
  const apply = byId<HTMLButtonElement>('family-apply');
  const albumNames = document.createElement('p');
  albumNames.id = 'family-preview-albums';
  byId('family-preview-summary').after(albumNames);
  // Page des parents : un « ? » à côté du bouton dit à quoi sert ce fichier.
  byId('home-family').after(helpPoint('family'));
  let pending: FamilyBackup | null = null,
    generation = 0;
  const reset = () => {
    generation++;
    pending = null;
    file.value = '';
    byId('family-file-name').textContent = '';
    apply.disabled = true;
    byId('family-preview').hidden = true;
  };
  const close = () => {
    reset();
    dialog.close();
    byId('home-family').focus({ preventScroll: true });
  };
  byId('home-family').onclick = () => {
    reset();
    setDisplayText(byId('family-status'), actions.persistenceStatus());
    dialog.showModal();
  };
  byId('family-close').onclick = close;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', reset);
  byId('family-export').onclick = () => {
    const raw = actions.exportRaw();
    if (!raw || !readFamilyBackup(raw)) {
      setDisplayText(byId('family-status'), 'Impossible de préparer le fichier de cette aventure.');
      return;
    }
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'conquete-serpents-famille.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDisplayText(
      byId('family-status'),
      'Fichier prêt. Conserve-le pour reprendre cette aventure dans un autre navigateur.',
    );
  };
  byId('family-choose-file').onclick = () => {
    try {
      if (typeof file.showPicker === 'function') file.showPicker();
      else file.click();
    } catch {
      file.click();
    }
  };
  file.onchange = async () => {
    const turn = ++generation;
    pending = null;
    apply.disabled = true;
    byId('family-preview').hidden = true;
    const selected = file.files?.[0];
    if (!selected) return;
    // The user's filename is local data, never translated.
    byId('family-file-name').textContent = selected.name;
    if (selected.size > FAMILY_BYTE_LIMIT) {
      setDisplayText(byId('family-status'), 'Fichier trop volumineux : rien n’a été modifié.');
      return;
    }
    setDisplayText(byId('family-status'), 'Lecture du fichier…');
    try {
      const raw = await selected.text();
      if (turn !== generation || !dialog.open) return;
      const backup = readFamilyBackup(raw);
      if (!backup) {
        setDisplayText(
          byId('family-status'),
          'Fichier familial invalide ou incompatible : rien n’a été modifié.',
        );
        return;
      }
      const summary = backupSummary(backup);
      const stars = summary.bestStars.reduce((a, b) => a + b, 0);
      setDisplayText(
        byId('family-preview-summary'),
        summary.wave === null
          ? `Favoris et ${stars} étoiles seulement. Aucun camp de reprise : les anciens alliés seront remplacés.`
          : `Camp avant la vague ${summary.wave + 1} · ${summary.allies} alliés · ${summary.gold} pièces · ${stars} étoiles.`,
      );
      if (backup.version !== 1 && backup.missions) {
        const missionStars = Object.values(backup.missions.bestStars).reduce((a, b) => a + b, 0);
        if (summary.wave === null && (backup.missions.classicCamp || backup.missions.retryCamp))
          setDisplayText(
            byId('family-preview-summary'),
            `Progression, favoris et camps conservés dans ce fichier · ${stars} étoiles classiques.`,
          );
        appendDisplayText(
          byId('family-preview-summary'),
          ` Expéditions : ${missionStars} / 18 étoiles. Le camp classique est conservé séparément.`,
        );
      }
      appendDisplayText(
        byId('family-preview-summary'),
        backup.version === 4 || backup.version === 5
          ? ' Les carnets et leurs autocollants sont inclus et remplaceront les carnets actuels.'
          : ' Ce fichier ne contient aucun carnet : les carnets actuels seront remplacés par un carnet vide.',
      );
      albumNames.replaceChildren();
      if (backup.version === 4 || backup.version === 5)
        for (const child of backup.albums.children) {
          const name = document.createElement('span');
          name.dataset.copyRaw = '';
          name.textContent = ' · ' + child.name;
          albumNames.append(name);
        }
      pending = backup;
      byId('family-preview').hidden = false;
      apply.disabled = false;
      setDisplayText(
        byId('family-status'),
        'Vérifie cet aperçu. Ton aventure actuelle reste intacte tant que tu ne confirmes pas.',
      );
    } catch {
      if (turn === generation)
        setDisplayText(
          byId('family-status'),
          'Impossible de lire ce fichier : rien n’a été modifié.',
        );
    }
  };
  apply.onclick = () => {
    if (!pending) return;
    const result = actions.applyBackup(pending);
    setDisplayText(byId('family-status'), result.message);
    if (!result.ok) return;
    reset();
    dialog.close();
    actions.finished();
  };
}
