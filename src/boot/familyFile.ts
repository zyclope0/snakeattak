import {
  checkExtras,
  collectExtras,
  importWritesRecords,
  replacesNothing,
  writeExtras,
} from '../familyExtras.ts';
import { bindFamilyControls } from '../ui/familyControls.ts';
import { createCapriceAlbums } from '../capriceAlbums.ts';
import { decodeCheckpoint } from '../checkpoints.ts';
import {
  FAMILY_EXTRAS_VERSION,
  hasAlbums,
  readFamilyBackup,
  writeFamilyBackup,
} from '../familyBackup.ts';
import type { FamilyBackup } from '../familyBackup.ts';
import { createMissionProgress } from '../missionProgress.ts';
import type { Adventure } from './adventure.ts';
import type { createGames } from './games.ts';
import * as TEXT from '../texts/fr/home.ts';

/**
 * The window of the family file, wired to the adventure: the export of the adventure as it is
 * now, the import that replaces it, the copies kept on the device. A file of its own, asked for
 * by `familyDoor.ts`; gives back what opens the window.
 */
export function bindFamilyFile(
  adventure: Adventure,
  games: ReturnType<typeof createGames>,
  /** Brings the camp memory, the career, the missions and the stickers up to date. */
  recordGame: (writeCamp: boolean) => void,
  /** `home`: back to the home, once the window is done with. */
  { home, refresh }: { home: () => void; refresh: () => void },
) {
  const { session, storage, family, records, career, missions, albums } = adventure;
  const { missionDone, campMemory, stickers } = adventure;
  /** True once a family file brought back an expedition, a voyage or records. */
  let reloadAfterImport = false;

  /**
   * The family file of the adventure as it is now, with what the player keeps beside it: the
   * expedition, the voyage to finish, the records.
   */
  function exportFamily() {
    recordGame(false);
    return writeFamilyBackup(
      campMemory.raw(),
      career.state,
      missions.state,
      albums.state,
      collectExtras(storage),
    );
  }
  /** True when every part of a family file reads back by its own rules. */
  function acceptsFamily(backup: FamilyBackup) {
    return backup.version !== FAMILY_EXTRAS_VERSION || checkExtras(backup.extras) !== null;
  }
  /**
   * Replaces the adventure by a family file. The file is written first: when the browser
   * refuses it, nothing of the session has changed. `whole`: the file is the whole state to
   * come back to — a copy kept before an import — so what it does not carry beside the
   * adventure is taken away too.
   */
  function applyFamily(backup: FamilyBackup, whole = false) {
    const file = readFamilyBackup(JSON.stringify(backup));
    const invalid = { ok: false, message: TEXT.fichierInvalideRienNAEteModifie };
    const refused = { ok: false, message: TEXT.impossibleDeConserverCeFichierSur };
    /** The device refused a write and then the way back: it holds a part of the file. */
    const partial = { ok: false, message: TEXT.unePartieSeulementDuFichierAEteGardee };
    if (!file) return invalid;
    // An import destroys an adventure on purpose: the one about to be replaced is kept first,
    // as the export would give it. If the device refuses that copy, nothing is imported; if
    // the import then fails, the copy is put back as it was. A file that brings back the very
    // adventure in place, and nothing else, destroys nothing: the copy is left alone.
    const replaced = exportFamily();
    const now = replaced ? readFamilyBackup(replaced) : null;
    const carried = file.version === FAMILY_EXTRAS_VERSION ? file.extras : {};
    const putBack = replacesNothing(now, file, whole)
      ? () => {}
      : family.keepBeforeImport(replaced);
    if (!putBack) return refused;
    const failed = (answer: typeof refused) => {
      putBack();
      return answer;
    };
    // What the player keeps beside the adventure goes back under its own keys, first: the
    // adventure is then stored as the file that holds it alone, as it always was.
    let extras: { undo: () => boolean } | null = null;
    let canonical: FamilyBackup | null = file;
    if (file.version === FAMILY_EXTRAS_VERSION || whole) {
      // A whole state may carry nothing beside the adventure: that is something to restore too.
      const checked = Object.keys(carried).length ? checkExtras(carried) : whole ? {} : null;
      const alone = writeFamilyBackup(file.camp, file.career, file.missions, file.albums);
      canonical = alone ? readFamilyBackup(alone) : null;
      if (!checked || !canonical) return failed(invalid);
      extras = writeExtras(storage, checked, whole);
      if (!extras) return failed(writeExtras.partial ? partial : refused);
    }
    const game = canonical.camp === null ? null : decodeCheckpoint(canonical.camp);
    if (!family.import(canonical)) return failed(extras && !extras.undo() ? partial : refused);
    // The records the file brings (or a whole state without them) take the place of those of
    // the adventure replaced: a record of that one still waiting to be written is forgotten.
    if (extras && importWritesRecords(file, whole)) records.forget();
    // The door of the expedition and its screens hold what they read at start: the page is
    // read again, as when the player changes.
    reloadAfterImport = extras !== null;
    albums.replaceState(hasAlbums(canonical) ? canonical.albums : createCapriceAlbums());
    stickers.openForCaprice(
      game,
      'missions' in canonical ? canonical.missions?.retryCamp : undefined,
    );
    career.replaceState(canonical.career);
    missions.replaceState('missions' in canonical ? canonical.missions! : createMissionProgress());
    // The file brings its own camps: the mark of a mission won here says nothing about them.
    missionDone.clear();
    games.useImported(game, canonical.camp);
    session.screen = 'home';
    return { ok: true, message: TEXT.aventureFamilialeRetrouvee };
  }

  return bindFamilyControls({
    persistenceStatus: () => family.status,
    exportRaw: exportFamily,
    previousRaw: family.previous,
    beforeImportRaw: family.beforeImport,
    refusedRaw: family.refused,
    accepts: acceptsFamily,
    applyBackup: applyFamily,
    finished: () => {
      home();
      refresh();
      if (reloadAfterImport) window.location.reload();
    },
  });
}
