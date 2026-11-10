import { readFamilyBackup, writeFamilyBackup } from './familyBackup.ts';
import type { FamilyBackup } from './familyBackup.ts';
import { validateCareerState } from './progression.ts';
import type { CareerState } from './progression.ts';
import { validateMissionProgress } from './missionProgress.ts';
import type { MissionProgress } from './missionProgress.ts';
import { validateCapriceAlbums } from './capriceAlbums.ts';
import type { CapriceAlbums } from './capriceAlbums.ts';

export const FAMILY_STORAGE_KEY = 'conquete-serpents:family:v1';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

/** One authoritative browser write is the entire persistent import transaction. */
export function createFamilyPersistence(storage?: StoragePort) {
  let last = '';
  let disabled = false;
  let retainedMissions: MissionProgress | undefined;
  let retainedAlbums: CapriceAlbums | undefined;
  let status = storage
    ? 'Aucune sauvegarde familiale sur cet appareil'
    : 'Sauvegarde familiale indisponible';
  function save(
    raw: string,
    explicitImport: boolean,
    missions?: MissionProgress,
    albums?: CapriceAlbums,
  ): boolean {
    if (!storage || (disabled && !explicitImport)) return false;
    // Confirmation still performs a write, so a blocked storage cannot accept an import.
    if (!explicitImport && raw === last) return true;
    try {
      storage.setItem(FAMILY_STORAGE_KEY, raw);
      last = raw;
      retainedMissions = missions === undefined ? undefined : validateMissionProgress(missions)!;
      retainedAlbums = albums === undefined ? undefined : validateCapriceAlbums(albums)!;
      disabled = false;
      status = 'Aventure familiale enregistrée sur cet appareil';
      return true;
    } catch {
      disabled = true;
      status = 'Sauvegarde familiale indisponible : stockage bloqué ou plein';
      return false;
    }
  }
  return {
    get status() {
      return status;
    },
    load(): FamilyBackup | null {
      if (!storage) return null;
      try {
        const raw = storage.getItem(FAMILY_STORAGE_KEY);
        if (raw === null) {
          status = 'Aucune sauvegarde familiale sur cet appareil';
          return null;
        }
        const backup = readFamilyBackup(raw);
        if (!backup) {
          status = 'Sauvegarde familiale incompatible : reprise historique';
          return null;
        }
        last = JSON.stringify(backup);
        retainedMissions = backup.missions && validateMissionProgress(backup.missions)!;
        retainedAlbums = backup.albums && validateCapriceAlbums(backup.albums)!;
        status = 'Aventure familiale enregistrée sur cet appareil';
        return backup;
      } catch {
        disabled = true;
        status = 'Sauvegarde familiale indisponible';
        return null;
      }
    },
    sync(
      campRaw: string | null,
      career: CareerState,
      missions?: MissionProgress,
      albums?: CapriceAlbums,
    ): boolean {
      // Older callers must not erase loaded expeditions or albums by omitting arguments.
      const nextMissions = missions === undefined ? retainedMissions : missions;
      const nextAlbums = albums === undefined ? retainedAlbums : albums;
      const raw = writeFamilyBackup(campRaw, career, nextMissions, nextAlbums);
      if (!raw) {
        status = 'Sauvegarde familiale invalide : aucune écriture';
        return false;
      }
      return save(raw, false, nextMissions, nextAlbums);
    },
    import(backup: FamilyBackup): boolean {
      let validated: FamilyBackup | null;
      try {
        validated =
          validateCareerState(backup?.career) &&
          (backup.version === 4 || backup.version === 5 || !Object.hasOwn(backup, 'albums')) &&
          (backup.version === 1 || validateMissionProgress(backup.missions)) &&
          ((backup.version !== 4 && backup.version !== 5) || validateCapriceAlbums(backup.albums))
            ? readFamilyBackup(JSON.stringify(backup))
            : null;
      } catch {
        validated = null;
      }
      if (!validated) {
        status = 'Fichier familial invalide : import refusé';
        return false;
      }
      return save(JSON.stringify(validated), true, validated.missions, validated.albums);
    },
  };
}
