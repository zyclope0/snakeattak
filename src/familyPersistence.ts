import type { StoragePort } from './checkpoints.ts';
import { hasAlbums, readFamilyBackup, writeFamilyBackup } from './familyBackup.ts';
import type { FamilyBackup } from './familyBackup.ts';
import { validateCareerState } from './progression.ts';
import type { CareerState } from './progression.ts';
import { validateMissionProgress } from './missionProgress.ts';
import type { MissionProgress } from './missionProgress.ts';
import { validateCapriceAlbums } from './capriceAlbums.ts';
import type { CapriceAlbums } from './capriceAlbums.ts';
import { FAMILY_REFUSED_KEY, FAMILY_STORAGE_KEY } from './storageKeys.ts';
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
};

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
  if (!storage || (session.disabled && !explicitImport)) return false;
  // Confirmation still performs a write, so a blocked storage cannot accept an import.
  if (!explicitImport && raw === session.last) return true;
  try {
    storage.setItem(FAMILY_STORAGE_KEY, raw);
    session.last = raw;
    retain(session, missions, albums);
    session.disabled = false;
    session.status = TEXT.aventureFamilialeEnregistreeSurCet;
    return true;
  } catch {
    session.status = TEXT.sauvegardeFamilialeIndisponible;
    return false;
  }
}

function load(storage: StoragePort | undefined, session: Session): FamilyBackup | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(FAMILY_STORAGE_KEY);
    if (raw === null) {
      session.status = TEXT.aucuneSauvegardeFamilialeSurCet;
      return null;
    }
    const backup = readFamilyBackup(raw);
    if (!backup) {
      // The game starts anew and its first save takes the place of this file: its text is
      // put aside first, so that an adventure this version cannot read is never destroyed.
      try {
        storage.setItem(FAMILY_REFUSED_KEY, raw);
      } catch {
        /* No room for the copy: the game is played all the same. */
      }
      session.status = TEXT.sauvegardeFamilialeIncompatible;
      return null;
    }
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
  };
  return {
    get status() {
      return session.status;
    },
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
      const raw = writeFamilyBackup(campRaw, career, nextMissions, nextAlbums);
      if (!raw) {
        session.status = TEXT.sauvegardeFamilialeInvalideAucune;
        return false;
      }
      return save(storage, session, raw, false, nextMissions, nextAlbums);
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
