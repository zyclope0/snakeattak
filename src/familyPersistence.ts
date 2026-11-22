import type { StoragePort } from './checkpoints.ts';
import {
  FAMILY_EXTRAS_VERSION,
  familyStars,
  hasAlbums,
  readFamilyBackup,
  salvageFamilyBackup,
  writeFamilyBackup,
} from './familyBackup.ts';
import type { FamilyBackup } from './familyBackup.ts';
import { validateCareerState } from './progression.ts';
import type { CareerState } from './progression.ts';
import { validateMissionProgress } from './missionProgress.ts';
import type { MissionProgress } from './missionProgress.ts';
import { validateCapriceAlbums } from './capriceAlbums.ts';
import type { CapriceAlbums } from './capriceAlbums.ts';
import { FAMILY_PREVIOUS_KEY, FAMILY_REFUSED_KEY, FAMILY_STORAGE_KEY } from './storageKeys.ts';
import * as TEXT from './texts/fr/family.ts';

/** What one session remembers about the family file between two calls. */
type Session = {
  /** The text last read or written: an identical sync writes nothing. */
  last: string;
  /**
   * True once the storage could not be READ: what it holds is unknown, so nothing is written
   * over it; only an explicit import tries. A refused WRITE never sets it: the next change
   * is tried again, so that a storage that was full for a moment keeps the games that follow.
   */
  disabled: boolean;
  status: string;
  /** Expeditions and albums of the last file, handed back to callers that omit them. */
  missions: MissionProgress | undefined;
  albums: CapriceAlbums | undefined;
  /**
   * What the last sync was given, once it left nothing to do: asked the same again, it would
   * build the file already stored. Any other read or write forgets it.
   */
  settled: string | null;
  /**
   * The file found when the game started, until the session's first write: it is then kept as
   * the second generation, just before it is replaced. Reading alone adds nothing to the
   * device. `started` is true once the session has read or written: a later read is not a
   * start.
   */
  found: { raw: string; backup: FamilyBackup } | null;
  started: boolean;
  /** True when the file read at start-up was kept without its camp, which did not read. */
  salvaged: boolean;
};

/**
 * One text for all a sync is given. What JSON would blur (a NaN, an infinity, a hole, an
 * `undefined`) is written apart, so that two askings made of plain data never share a text.
 * The game only hands over such data: copies of states its controllers have validated.
 */
function asking(
  campRaw: string | null,
  career: CareerState,
  missions?: MissionProgress,
  albums?: CapriceAlbums,
): string | null {
  try {
    return JSON.stringify([campRaw, career, missions, albums], (_key, value) =>
      value === undefined || (typeof value === 'number' && !Number.isFinite(value))
        ? `\u0000${value}`
        : value,
    );
  } catch {
    return null;
  }
}

/** Private copies: the caller's objects may change after the write. */
function retain(session: Session, missions?: MissionProgress, albums?: CapriceAlbums): void {
  session.missions = missions === undefined ? undefined : validateMissionProgress(missions)!;
  session.albums = albums === undefined ? undefined : validateCapriceAlbums(albums)!;
}

function save(
  storage: StoragePort | undefined,
  session: Session,
  raw: string,
  explicitImport: boolean,
  missions?: MissionProgress,
  albums?: CapriceAlbums,
): boolean {
  session.settled = null;
  if (!storage || (session.disabled && !explicitImport)) return false;
  // Confirmation still performs a write, so a blocked storage cannot accept an import.
  if (!explicitImport && raw === session.last) return true;
  keepPrevious(storage, session);
  session.started = true;
  try {
    storage.setItem(FAMILY_STORAGE_KEY, raw);
    session.last = raw;
    retain(session, missions, albums);
    session.disabled = false;
    // After a file kept without its camp, the session goes on saying so: the first save
    // comes at once, and the sentence would otherwise never be read.
    session.status = session.salvaged
      ? TEXT.tesEtoilesTesMissionsEtTesCarnetsSontBienLa
      : TEXT.aventureFamilialeEnregistreeSurCet;
    return true;
  } catch {
    session.status = TEXT.sauvegardeFamilialeIndisponible;
    return false;
  }
}

/**
 * The second generation. The file found when the game started is kept beside the one the
 * session writes, at the moment it is about to be replaced: a save that is valid but wrong
 * does not replace the only copy. A copy with more stars is never given up for a file with
 * fewer: after stars were lost or an older file imported, it is the copy from before that
 * stays.
 */
function keepPrevious(storage: StoragePort, session: Session): void {
  if (!session.found) return;
  const { raw, backup } = session.found;
  session.found = null;
  try {
    const held = storage.getItem(FAMILY_PREVIOUS_KEY);
    if (held === raw) return;
    const before = held === null ? null : readFamilyBackup(held);
    if (before && familyStars(before) > familyStars(backup)) return;
    storage.setItem(FAMILY_PREVIOUS_KEY, raw);
  } catch {
    /* No room for the copy, or no way to read it: the game is played all the same. */
  }
}

/** A text kept beside the family file, or null: nothing kept, or a storage that says no. */
function kept(storage: StoragePort | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** True when the text put aside is another one, of which this version reads nothing at all. */
function holdsWholeRefusal(storage: StoragePort, raw: string): boolean {
  const held = storage.getItem(FAMILY_REFUSED_KEY);
  return held !== null && held !== raw && !readFamilyBackup(held) && !salvageFamilyBackup(held);
}

function load(storage: StoragePort | undefined, session: Session): FamilyBackup | null {
  session.settled = null;
  if (!storage) return null;
  const first = !session.started;
  session.started = true;
  session.salvaged = false;
  try {
    const raw = storage.getItem(FAMILY_STORAGE_KEY);
    if (raw === null) {
      session.status = TEXT.aucuneSauvegardeFamilialeSurCet;
      return null;
    }
    const backup = readFamilyBackup(raw);
    if (!backup) {
      // A camp that does not read no longer takes the rest with it: the stars, the missions
      // and the sticker books of the same file are kept, and so is any camp of it that still
      // reads. A file that carries extras is never one the game stored.
      const rest = salvageFamilyBackup(raw);
      const salvaged = !!rest && rest.version !== FAMILY_EXTRAS_VERSION;
      // The first save takes the place of this file: its text is put aside first, so that
      // an adventure this version cannot read is never destroyed. One place only: a file
      // refused whole takes it; a file kept but for a camp does not push out a text of
      // which nothing could be read, which may be a whole adventure.
      if (!salvaged || !holdsWholeRefusal(storage, raw)) {
        try {
          storage.setItem(FAMILY_REFUSED_KEY, raw);
        } catch {
          /* No room for the copy: the game is played all the same. */
        }
      }
      if (salvaged) {
        session.salvaged = true;
        retain(session, rest.missions, rest.albums);
        session.status = TEXT.tesEtoilesTesMissionsEtTesCarnetsSontBienLa;
        return rest;
      }
      session.status = TEXT.sauvegardeFamilialeIncompatible;
      return null;
    }
    // A version 6 file never comes here by the game; if one did, its extras would be lost at
    // the next save: its text is put aside first.
    if (backup.version === FAMILY_EXTRAS_VERSION) {
      try {
        storage.setItem(FAMILY_REFUSED_KEY, raw);
      } catch {
        /* No room for the copy: the adventure is read all the same. */
      }
    }
    if (first) session.found = { raw, backup };
    session.last = JSON.stringify(backup);
    retain(session, backup.missions, backup.albums);
    session.status = TEXT.aventureFamilialeEnregistreeSurCet;
    return backup;
  } catch {
    session.disabled = true;
    session.status = TEXT.sauvegardeFamilialeIndisponible2;
    return null;
  }
}

/**
 * An imported object is checked part by part before it is written as text: JSON would turn
 * a hole or a NaN into null and let it through.
 */
function validateImport(backup: FamilyBackup): FamilyBackup | null {
  try {
    // What a version 6 file holds beside the adventure goes under its own keys: the file
    // stored here is the adventure alone.
    if (backup?.version === FAMILY_EXTRAS_VERSION) return null;
    if (!validateCareerState(backup?.career)) return null;
    const withAlbums = hasAlbums(backup);
    if (!withAlbums && Object.hasOwn(backup, 'albums')) return null;
    if (backup.version !== 1 && !validateMissionProgress(backup.missions)) return null;
    if (withAlbums && !validateCapriceAlbums(backup.albums)) return null;
    return readFamilyBackup(JSON.stringify(backup));
  } catch {
    return null;
  }
}

/** One authoritative browser write is the entire persistent import transaction. */
export function createFamilyPersistence(storage?: StoragePort) {
  const session: Session = {
    last: '',
    disabled: false,
    status: storage ? TEXT.aucuneSauvegardeFamilialeSurCet : TEXT.sauvegardeFamilialeIndisponible2,
    missions: undefined,
    albums: undefined,
    settled: null,
    found: null,
    started: false,
    salvaged: false,
  };
  return {
    get status() {
      return session.status;
    },
    /** True when the last file loaded was kept without its camp: the camp has its own key. */
    get salvaged() {
      return session.salvaged;
    },
    /**
     * The save from before, when it is a file the family import reads; null otherwise. It is
     * only handed over: bringing it back goes through the import, like any other file.
     */
    previous(): string | null {
      const raw = kept(storage, FAMILY_PREVIOUS_KEY);
      return raw !== null && readFamilyBackup(raw) ? raw : null;
    },
    /** The text put aside because this version could not read it, exactly as it was found. */
    refused: (): string | null => kept(storage, FAMILY_REFUSED_KEY),
    load: (): FamilyBackup | null => load(storage, session),
    sync(
      campRaw: string | null,
      career: CareerState,
      missions?: MissionProgress,
      albums?: CapriceAlbums,
    ): boolean {
      // Older callers must not erase loaded expeditions or albums by omitting arguments.
      const nextMissions = missions === undefined ? session.missions : missions;
      const nextAlbums = albums === undefined ? session.albums : albums;
      // The board asks again several times a second, also during a fight, where nothing can
      // change: the file is built and read back only when something is asked that was not.
      const asked = asking(campRaw, career, nextMissions, nextAlbums);
      if (asked !== null && asked === session.settled) return true;
      session.settled = null;
      const raw = writeFamilyBackup(campRaw, career, nextMissions, nextAlbums);
      if (!raw) {
        session.status = TEXT.sauvegardeFamilialeInvalideAucune;
        return false;
      }
      const saved = save(storage, session, raw, false, nextMissions, nextAlbums);
      if (saved) session.settled = asked;
      return saved;
    },
    import(backup: FamilyBackup): boolean {
      const validated = validateImport(backup);
      if (!validated) {
        session.status = TEXT.fichierFamilialInvalideImport;
        return false;
      }
      return save(
        storage,
        session,
        JSON.stringify(validated),
        true,
        validated.missions,
        validated.albums,
      );
    },
  };
}
