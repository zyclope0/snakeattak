import { setText as setDisplayText } from '../i18n/dom.ts';
import {
  backupSummary,
  FAMILY_BYTE_LIMIT,
  FAMILY_EXTRAS,
  FAMILY_EXTRAS_VERSION,
  hasAlbums,
  readFamilyBackup,
  salvageFamilyBackup,
  sameAdventure,
} from '../familyBackup.ts';
import type { FamilyBackup } from '../familyBackup.ts';
import { helpPoint } from './helpBubble.ts';
import { byId, make } from './dom.ts';
import { canHandOver, familyFileName, handOver, buildIsApp, type Handover } from './download.ts';
import * as TEXT from '../texts/fr/family.ts';
import { fill } from '../texts/fill.ts';
type Actions = {
  exportRaw: () => string | null;
  /** The save from an earlier launch, as a file the import reads; null when there is none. */
  previousRaw: () => string | null;
  /** The adventure the last import replaced, as a file the import reads; null when none. */
  beforeImportRaw: () => string | null;
  /** The text of a file this version could not read, put aside as it was; null when none. */
  refusedRaw: () => string | null;
  /** False for a file one of whose parts does not read back: it is refused whole. */
  accepts: (backup: FamilyBackup) => boolean;
  /** `whole`: the file is a copy kept before an import, the whole state to come back to. */
  applyBackup: (
    backup: FamilyBackup,
    whole?: boolean,
  ) => {
    ok: boolean;
    message: string;
  };
  finished: () => void;
  persistenceStatus: () => string;
};

const say = (text: string) => setDisplayText(byId('family-status'), text);
/**
 * What to say once a file was asked for: « ready » only when one was handed over. In the
 * application Android says only that the family chose an app, never that the file arrived;
 * and it may call « closed » a share that went out without leaving the game (tried in the
 * plugin's code, not on a phone): neither sentence says more than that.
 */
const told = (
  result: Handover,
  ready: string,
  closed = TEXT.lePartageSEstFermeSiLeFichierNEstArriveNullePart,
) =>
  result === 'saved'
    ? ready
    : result === 'canceled'
      ? closed
      : TEXT.impossibleDePreparerLeFichierDe;
/** In the application the file goes to the app the family chose, not to a browser. */
const READY = buildIsApp()
  ? TEXT.leFichierEstPartiVerifieQuIlEstBienArrive
  : TEXT.fichierPretConserveLePourReprendre;
const SET_ASIDE_READY = buildIsApp()
  ? TEXT.leFichierEstPartiCetteVersionNeSaitPasLeRelire
  : TEXT.fichierRemisCetteVersionNeSaitPasLeRelire;
/** Hands a file over and says the truth about it. */
const exportFile = async (raw: string, name: string) => say(told(await handOver(raw, name), READY));
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
/** The sticker books of a file; older files have none. */
const albumsOf = (backup: FamilyBackup) => (hasAlbums(backup) ? backup.albums : null);

const EXTRA_WORDS = {
  expedition: TEXT.lExpeditionDeCeFichierRemplacera,
  voyage: TEXT.leVoyageDeCeFichierRemplacera,
  endless: TEXT.lesRecordsDeCeFichierRemplaceront,
};
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
      : TEXT.ceFichierNeContientAucunCarnetLes) +
    // What the file holds beside the adventure, named one by one: only that is replaced.
    (backup.version === FAMILY_EXTRAS_VERSION
      ? FAMILY_EXTRAS.filter((name) => Object.hasOwn(backup.extras, name))
          .map((name) => EXTRA_WORDS[name])
          .join('')
      : '')
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
/**
 * The copies the game keeps beside the save, folded at the bottom of the window. Each one a
 * parent can read has one button, « Regarder cette copie », which puts it in the same preview
 * as a chosen file: same summary, same confirmation, and no file to take out of the device.
 * A text this version cannot read is only told about, and handed over where a file can be.
 */
function bindKeptCopies(
  actions: Pick<Actions, 'previousRaw' | 'beforeImportRaw' | 'refusedRaw' | 'accepts'>,
  look: (backup: FamilyBackup, name: string, whole: boolean) => void,
) {
  const rows = make('div');
  const node = make(
    'details',
    { id: 'family-copies' },
    make('summary', { text: TEXT.copiesDeSecours }),
    make('p', { text: TEXT.leJeuGardeToutSeulDAnciennesCopies }),
    rows,
  );
  const kept = [
    {
      id: 'family-copy-before-import',
      name: TEXT.avantLeDernierRemplacement,
      words: TEXT.lAventureQuiEtaitLaJusteAvant,
      read: actions.beforeImportRaw,
    },
    {
      id: 'family-copy-previous',
      name: TEXT.dUnLancementDAvant,
      words: TEXT.tonAventureCommeElleEtaitAUnLancement,
      read: actions.previousRaw,
    },
    {
      id: 'family-copy-refused',
      name: TEXT.fichierMisDeCote,
      words: TEXT.unFichierQueLeJeuNAvaitPasSuLire,
      read: actions.refusedRaw,
    },
  ];
  /** One copy this version reads: what it is, what it holds, and the way to look at it. */
  const row = (copy: (typeof kept)[number], backup: FamilyBackup) => {
    const button = make('button', {
      id: copy.id,
      className: 'secondary',
      text: TEXT.regarderCetteCopie,
    });
    button.type = 'button';
    // Only the copy kept before an import is the whole state of that moment, extras included.
    button.onclick = () => look(backup, copy.name, copy.read === actions.beforeImportRaw);
    return make(
      'div',
      { className: 'family-copy' },
      make('p', {}, make('strong', { text: copy.name })),
      make('p', { text: copy.words }),
      make('p', { text: previewText(backup) }),
      button,
    );
  };
  /** A text kept that this version cannot read: said, and handed over where possible. */
  const unread = (raw: string, id: string) => {
    const block = make(
      'div',
      { className: 'family-copy' },
      make('p', { text: TEXT.unFichierQueCetteVersionNeSaitPasLire }),
    );
    if (!canHandOver()) return block;
    const button = make('button', {
      id,
      className: 'secondary',
      text: TEXT.exporterCeFichier,
    });
    button.type = 'button';
    button.onclick = async () =>
      say(told(await handOver(raw, familyFileName('mis-de-cote')), SET_ASIDE_READY));
    block.append(button);
    return block;
  };
  return {
    node,
    refresh() {
      const shown: FamilyBackup[] = [];
      const blocks: HTMLElement[] = [];
      for (const copy of kept) {
        const raw = copy.read();
        if (raw === null) continue;
        // A copy one of whose camps no longer decodes is offered as the game would read it.
        const backup = readFamilyBackup(raw) ?? salvageFamilyBackup(raw);
        if (!backup || !actions.accepts(backup)) {
          // A text of which nothing reads is told about: it stays on the device.
          if (copy.read !== actions.beforeImportRaw) blocks.push(unread(raw, `${copy.id}-export`));
          continue;
        }
        // The same adventure kept twice is offered once: the first, which carries the most.
        if (shown.some((other) => sameAdventure(other, backup))) continue;
        shown.push(backup);
        blocks.push(row(copy, backup));
      }
      rows.replaceChildren(...blocks);
      node.hidden = blocks.length === 0;
      node.open = false;
    },
  };
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
function bindFamilyPreview(dialog: HTMLDialogElement, accepts: Actions['accepts']) {
  const file = byId<HTMLInputElement>('family-file');
  const apply = byId<HTMLButtonElement>('family-apply');
  const albumNames = make('p', { id: 'family-preview-albums' });
  byId('family-preview-summary').after(albumNames);
  let pending: FamilyBackup | null = null,
    pendingWhole = false,
    generation = 0;

  /** Nothing waits to be applied, and a file still being read is ignored when it arrives. */
  const forget = () => {
    pending = null;
    pendingWhole = false;
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
      if (backup && accepts(backup)) show(backup);
      else say(TEXT.fichierFamilialInvalideOu);
    } catch {
      if (turn === generation) say(TEXT.impossibleDeLireCeFichierRienNAEte);
    }
  };

  byId('family-choose-file').onclick = () => openPicker(file);
  file.onchange = readSelection;
  /** A copy kept on the device, shown like a chosen file: its name stands for the file's. */
  const look = (backup: FamilyBackup, name: string, whole: boolean) => {
    reset();
    setDisplayText(byId('family-file-name'), name);
    show(backup);
    pendingWhole = whole;
    byId('family-preview').scrollIntoView({ block: 'center' });
  };
  return { reset, chosen: () => pending, whole: () => pendingWhole, look };
}

/** User-selected local data only. Preview and cancellation never mutate the adventure. */
export function bindFamilyControls(actions: Actions) {
  const dialog = byId<HTMLDialogElement>('family-dialog');
  const preview = bindFamilyPreview(dialog, actions.accepts);
  // Page des parents : un « ? » à côté du bouton dit à quoi sert ce fichier.
  // The help beside the window says to keep the file: not where no file can be handed over.
  if (canHandOver()) byId('home-family').after(helpPoint('family'));
  const close = () => {
    preview.reset();
    dialog.close();
    byId('home-family').focus({ preventScroll: true });
  };

  // After the import and the state of the save, before the way out: never between the export
  // and the import.
  const copies = bindKeptCopies(actions, preview.look);
  byId('family-status').after(copies.node);
  byId('home-family').onclick = () => {
    preview.reset();
    copies.refresh();
    say(actions.persistenceStatus());
    dialog.showModal();
    // The window opens on its title and its first button, whatever it showed last.
    dialog.scrollTop = 0;
  };
  byId('family-close').onclick = close;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', preview.reset);
  const exportButton = byId('family-export');
  if (canHandOver())
    exportButton.onclick = () => {
      const raw = actions.exportRaw();
      if (!raw || !readFamilyBackup(raw)) return say(TEXT.impossibleDePreparerLeFichierDe);
      exportFile(raw, familyFileName());
    };
  // The application cannot hand a file over: a sentence says so where the button was, rather
  // than a button that does nothing.
  else
    exportButton.replaceWith(
      make('p', { id: 'family-export-none', text: TEXT.dansLApplicationLAventureNePeutPas }),
    );
  byId('family-apply').onclick = () => {
    const backup = preview.chosen();
    if (!backup) return;
    const result = actions.applyBackup(backup, preview.whole());
    say(result.message);
    if (!result.ok) return;
    preview.reset();
    dialog.close();
    actions.finished();
  };
}
