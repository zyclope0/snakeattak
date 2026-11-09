import { setText as setDisplayText, appendText as appendDisplayText } from '../i18n/dom.ts';
import { backupSummary, readFamilyBackup, FAMILY_BYTE_LIMIT } from '../familyBackup.ts';
import type { FamilyBackup } from '../familyBackup.ts';
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
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const dialog = el<HTMLDialogElement>('family-dialog');
  const file = el<HTMLInputElement>('family-file');
  const apply = el<HTMLButtonElement>('family-apply');
  let pending: FamilyBackup | null = null,
    generation = 0;
  const reset = () => {
    generation++;
    pending = null;
    file.value = '';
    apply.disabled = true;
    el('family-preview').hidden = true;
  };
  const close = () => {
    reset();
    dialog.close();
    el('home-family').focus({ preventScroll: true });
  };
  el('home-family').onclick = () => {
    reset();
    setDisplayText(el('family-status'), actions.persistenceStatus());
    dialog.showModal();
  };
  el('family-close').onclick = close;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', reset);
  el('family-export').onclick = () => {
    const raw = actions.exportRaw();
    if (!raw || !readFamilyBackup(raw)) {
      setDisplayText(el('family-status'), 'Impossible de préparer le fichier de cette aventure.');
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
      el('family-status'),
      'Fichier prêt. Conserve-le pour reprendre cette aventure dans un autre navigateur.',
    );
  };
  file.onchange = async () => {
    const turn = ++generation;
    pending = null;
    apply.disabled = true;
    el('family-preview').hidden = true;
    const selected = file.files?.[0];
    if (!selected) return;
    if (selected.size > FAMILY_BYTE_LIMIT) {
      setDisplayText(el('family-status'), 'Fichier trop volumineux : rien n’a été modifié.');
      return;
    }
    setDisplayText(el('family-status'), 'Lecture du fichier…');
    try {
      const raw = await selected.text();
      if (turn !== generation || !dialog.open) return;
      const backup = readFamilyBackup(raw);
      if (!backup) {
        setDisplayText(
          el('family-status'),
          'Fichier familial invalide ou incompatible : rien n’a été modifié.',
        );
        return;
      }
      const summary = backupSummary(backup);
      const stars = summary.bestStars.reduce((a, b) => a + b, 0);
      setDisplayText(
        el('family-preview-summary'),
        summary.wave === null
          ? `Favoris et ${stars} étoiles seulement. Aucun camp de reprise : les anciens alliés seront remplacés.`
          : `Camp avant la vague ${summary.wave + 1} · ${summary.allies} alliés · ${summary.gold} pièces · ${stars} étoiles.`,
      );
      if (backup.version !== 1 && backup.missions) {
        const missionStars = Object.values(backup.missions.bestStars).reduce((a, b) => a + b, 0);
        if (summary.wave === null && (backup.missions.classicCamp || backup.missions.retryCamp))
          setDisplayText(
            el('family-preview-summary'),
            `Progression, favoris et camps conservés dans ce fichier · ${stars} étoiles classiques.`,
          );
        appendDisplayText(
          el('family-preview-summary'),
          ` Expéditions : ${missionStars} / 18 étoiles. Le camp classique est conservé séparément.`,
        );
      }
      pending = backup;
      el('family-preview').hidden = false;
      apply.disabled = false;
      setDisplayText(
        el('family-status'),
        'Vérifie cet aperçu. Ton aventure actuelle reste intacte tant que tu ne confirmes pas.',
      );
    } catch {
      if (turn === generation)
        setDisplayText(
          el('family-status'),
          'Impossible de lire ce fichier : rien n’a été modifié.',
        );
    }
  };
  apply.onclick = () => {
    if (!pending) return;
    const result = actions.applyBackup(pending);
    setDisplayText(el('family-status'), result.message);
    if (!result.ok) return;
    reset();
    dialog.close();
    actions.finished();
  };
}
