import { decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';
import { readCareerState, validateCareerState } from './progression.ts';
import type { CareerState } from './progression.ts';
import { validateMissionProgress } from './missionProgress.ts';
import type { MissionProgress } from './missionProgress.ts';
import { validateCapriceAlbums } from './capriceAlbums.ts';
import type { CapriceAlbums } from './capriceAlbums.ts';

type FamilyData = {
  format: 'conquete-serpents-family';
  camp: string | null;
  career: CareerState;
};
export type FamilyBackup = FamilyData &
  (
    | { version: 1; missions?: never; albums?: never }
    | { version: 2 | 3; missions: MissionProgress; albums?: never }
    | { version: 4 | 5; missions: MissionProgress; albums: CapriceAlbums }
  );
export const FAMILY_CHARACTER_LIMIT = 500000;
export const FAMILY_BYTE_LIMIT = 1000000;
const withinLimits = (raw: string) =>
  raw.length <= FAMILY_CHARACTER_LIMIT &&
  new TextEncoder().encode(raw).byteLength <= FAMILY_BYTE_LIMIT;

function missionProgressHasBalance2(missions: MissionProgress): boolean {
  return (
    missions.version === 2 ||
    Object.values(missions.lastRuns).some((run) => run.balance === 2) ||
    [missions.retryCamp, missions.classicCamp].some(
      (raw) => raw !== null && decodeCheckpoint(raw)?.balanceRevision === 2,
    )
  );
}

/** Parse only local data; every returned field is reconstructed by the business decoders. */
export function readFamilyBackup(text: string): FamilyBackup | null {
  if (typeof text !== 'string' || !withinLimits(text)) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const data = value as Record<string, unknown>;
    if (
      data.format !== 'conquete-serpents-family' ||
      (data.version !== 1 &&
        data.version !== 2 &&
        data.version !== 3 &&
        data.version !== 4 &&
        data.version !== 5)
    )
      return null;
    // A mistaken version must not silently discard a child's collection.
    if (data.version !== 4 && data.version !== 5 && Object.hasOwn(data, 'albums')) return null;
    let camp: string | null = null;
    let tutorialCamp = false;
    let balanced = false;
    if (data.camp !== null) {
      if (typeof data.camp !== 'string') return null;
      const game = decodeCheckpoint(data.camp);
      if (!game) return null;
      tutorialCamp = game.mission?.rules === 2;
      balanced = game.balanceRevision === 2;
      camp = encodeCheckpoint(game);
      if (!camp) return null;
    }
    const career = readCareerState(JSON.stringify(data.career));
    if (!career) return null;
    balanced ||= career.chapterCamps.some(
      (raw) => raw !== null && decodeCheckpoint(raw)?.balanceRevision === 2,
    );
    let result: FamilyBackup;
    if (data.version === 2 || data.version === 3 || data.version === 4 || data.version === 5) {
      const missions = validateMissionProgress(data.missions);
      if (!missions) return null;
      balanced ||= missionProgressHasBalance2(missions);
      if (balanced && data.version !== 5) return null;
      if (
        data.version === 2 &&
        (tutorialCamp || Object.values(missions.lastRuns).some((run) => run.rules === 2))
      )
        return null;
      if (data.version === 4 || data.version === 5) {
        const albums = validateCapriceAlbums(data.albums);
        if (!albums) return null;
        result = {
          format: 'conquete-serpents-family',
          version: data.version,
          camp,
          career,
          missions,
          albums,
        };
      } else {
        result = {
          format: 'conquete-serpents-family',
          version: data.version,
          camp,
          career,
          missions,
        };
      }
    } else {
      // A version mistake must never silently discard expedition progress.
      if (Object.hasOwn(data, 'missions') || tutorialCamp || balanced) return null;
      result = { format: 'conquete-serpents-family', version: 1, camp, career };
    }
    return withinLimits(JSON.stringify(result)) ? result : null;
  } catch {
    return null;
  }
}

/** Export the live memory supplied by the caller, never an older browser storage record. */
export function writeFamilyBackup(
  campRaw: string | null,
  career: CareerState,
  missions?: MissionProgress,
  albums?: CapriceAlbums,
): string | null {
  try {
    const validatedCareer = validateCareerState(career);
    if (!validatedCareer) return null;
    const validatedMissions =
      missions === undefined ? undefined : validateMissionProgress(missions);
    if (missions !== undefined && !validatedMissions) return null;
    const validatedAlbums = albums === undefined ? undefined : validateCapriceAlbums(albums);
    if (albums !== undefined && (!validatedAlbums || !validatedMissions)) return null;
    const balanced =
      (campRaw !== null && decodeCheckpoint(campRaw)?.balanceRevision === 2) ||
      (validatedMissions && missionProgressHasBalance2(validatedMissions)) ||
      validatedCareer.chapterCamps.some(
        (raw) => raw !== null && decodeCheckpoint(raw)?.balanceRevision === 2,
      );
    if (balanced && (!validatedMissions || !validatedAlbums)) return null;
    const tutorial =
      Object.values(validatedMissions?.lastRuns ?? {}).some((run) => run.rules === 2) ||
      (campRaw !== null && JSON.parse(campRaw).mission?.rules === 2);
    const backup = readFamilyBackup(
      JSON.stringify({
        format: 'conquete-serpents-family',
        version: balanced ? 5 : validatedAlbums ? 4 : validatedMissions ? (tutorial ? 3 : 2) : 1,
        ...(validatedMissions ? { missions: validatedMissions } : {}),
        ...(validatedAlbums ? { albums: validatedAlbums } : {}),
        camp: campRaw,
        career: validatedCareer,
      }),
    );
    return backup ? JSON.stringify(backup) : null;
  } catch {
    return null;
  }
}

export function backupSummary(backup: FamilyBackup): {
  wave: number | null;
  allies: number;
  gold: number | null;
  bestStars: [number, number, number];
} {
  const game = backup.camp === null ? null : decodeCheckpoint(backup.camp);
  return {
    wave: game?.wave ?? null,
    allies: game?.units.length ?? 0,
    gold: game?.gold ?? null,
    bestStars: [...backup.career.bestStars],
  };
}
