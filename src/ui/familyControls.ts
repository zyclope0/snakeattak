import { setText as setDisplayText } from '../i18n/dom.ts';
import { backupSummary, readFamilyBackup, FAMILY_BYTE_LIMIT } from '../familyBackup.ts';
import type { FamilyBackup } from '../familyBackup.ts';
import { helpPoint } from './helpBubble.ts';
import { byId, make } from './dom.ts';
import * as TEXT from '../texts/fr/family.ts';
import { fill } from '../texts/fill.ts';
type Actions = {
  exportRaw: () => string | null;
  applyBackup: (backup: FamilyBackup) => {
    ok: boolean;
    message: string;
  };
  finished: () => void;
  persistenceStatus: () => string;
};

const say = (text: string) => setDisplayText(byId('family-status'), text);
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
/** The sticker books of a file; older files have none. */
const albumsOf = (backup: FamilyBackup) =>
  backup.version === 4 || backup.version === 5 ? backup.albums : null;

/** What a family file would bring back: the camp, the expeditions, the sticker books. */
function previewText(backup: FamilyBackup): string {
  const summary = backupSummary(backup);
  const stars = sum(summary.bestStars);
  let text =
    summary.wave === null
      ? fill(TEXT.favorisEtNEtoilesSeulementAucun, stars)
      : fill(
          TEXT.campAvantLaVagueNNAlliesNPiecesN,
          summary.wave + 1,
          summary.allies,
          summary.gold,
          stars,
        );
  if (backup.version !== 1 && backup.missions) {
    const missionStars = sum(Object.values(backup.missions.bestStars));
    if (summary.wave === null && (backup.missions.classicCamp || backup.missions.retryCamp))
      text = fill(TEXT.progressionFavorisEtCampsConserves, stars);
    text += fill(TEXT.expeditionsN18EtoilesLeCamp, missionStars);
  }
  return (
    text +
    (albumsOf(backup)
      ? TEXT.lesCarnetsEtLeursAutocollantsSont
      : TEXT.ceFichierNeContientAucunCarnetLes)
  );
}
/** The names of the sticker books, exactly as the family wrote them. */
function albumNameNodes(backup: FamilyBackup) {
  return (albumsOf(backup)?.children ?? []).map((child) => {
    const name = make('span');
    name.dataset.copyRaw = '';
    name.textContent = ' · ' + child.name;
    return name;
  });
}
/** Hands the file to the browser as a download. */
function download(raw: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = make('a');
  link.href = url;
  link.download = 'conquete-serpents-famille.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function openPicker(file: HTMLInputElement) {
  try {
    if (typeof file.showPicker === 'function') file.showPicker();
    else file.click();
  } catch {
    file.click();
  }
}

/**
 * Choosing a family file and looking at what it holds. Nothing is applied here: the file
 * that was read waits in `chosen()` until the parent confirms.
 */
function bindFamilyPreview(dialog: HTMLDialogElement) {
  const file = byId<HTMLInputElement>('family-file');
  const apply = byId<HTMLButtonElement>('family-apply');
  const albumNames = make('p', { id: 'family-preview-albums' });
  byId('family-preview-summary').after(albumNames);
  let pending: FamilyBackup | null = null,
    generation = 0;

  /** Nothing waits to be applied, and a file still being read is ignored when it arrives. */
  const forget = () => {
    pending = null;
    apply.disabled = true;
    byId('family-preview').hidden = true;
    return ++generation;
  };
  const reset = () => {
    forget();
    file.value = '';
    byId('family-file-name').textContent = '';
  };
  const show = (backup: FamilyBackup) => {
    setDisplayText(byId('family-preview-summary'), previewText(backup));
    albumNames.replaceChildren(...albumNameNodes(backup));
    pending = backup;
    byId('family-preview').hidden = false;
    apply.disabled = false;
    say(TEXT.verifieCetApercuTonAventure);
  };
  const readSelection = async () => {
    const turn = forget();
    const selected = file.files?.[0];
    if (!selected) return;
    // The user's filename is local data, never translated.
    byId('family-file-name').textContent = selected.name;
    if (selected.size > FAMILY_BYTE_LIMIT) return say(TEXT.fichierTropVolumineuxRienNAEte);
    say(TEXT.lectureDuFichier);
    try {
      const raw = await selected.text();
      if (turn !== generation || !dialog.open) return;
      const backup = readFamilyBackup(raw);
      if (backup) show(backup);
      else say(TEXT.fichierFamilialInvalideOu);
    } catch {
      if (turn === generation) say(TEXT.impossibleDeLireCeFichierRienNAEte);
    }
  };

  byId('family-choose-file').onclick = () => openPicker(file);
  file.onchange = readSelection;
  return { reset, chosen: () => pending };
}

/** User-selected local data only. Preview and cancellation never mutate the adventure. */
export function bindFamilyControls(actions: Actions) {
  const dialog = byId<HTMLDialogElement>('family-dialog');
  const preview = bindFamilyPreview(dialog);
  // Page des parents : un « ? » à côté du bouton dit à quoi sert ce fichier.
  byId('home-family').after(helpPoint('family'));
  const close = () => {
    preview.reset();
    dialog.close();
    byId('home-family').focus({ preventScroll: true });
  };

  byId('home-family').onclick = () => {
    preview.reset();
    say(actions.persistenceStatus());
    dialog.showModal();
  };
  byId('family-close').onclick = close;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', preview.reset);
  byId('family-export').onclick = () => {
    const raw = actions.exportRaw();
    if (!raw || !readFamilyBackup(raw)) return say(TEXT.impossibleDePreparerLeFichierDe);
    download(raw);
    say(TEXT.fichierPretConserveLePourReprendre);
  };
  byId('family-apply').onclick = () => {
    const backup = preview.chosen();
    if (!backup) return;
    const result = actions.applyBackup(backup);
    say(result.message);
    if (!result.ok) return;
    preview.reset();
    dialog.close();
    actions.finished();
  };
}
