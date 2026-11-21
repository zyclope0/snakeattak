import { decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';
import { readCareerState, validateCareerState } from './progression.ts';
import type { CareerState } from './progression.ts';
import { validateMissionProgress } from './missionProgress.ts';
import type { MissionProgress } from './missionProgress.ts';
import { validateCapriceAlbums } from './capriceAlbums.ts';
import type { CapriceAlbums } from './capriceAlbums.ts';
import { isOneOf, isRecord, readBoundedJson } from './plainData.ts';
import { EXPEDITION_LOG_LIMIT } from './expeditionLog.ts';

/**
 * Versions of the family file. Each one is the oldest able to hold its content, so that an
 * application of that time still reads what it wrote:
 *   1  camp and career            2  expeditions            3  the tutorial refuge
 *   4  albums of challenges       5  the second balance revision
 *   6  what the player keeps beside the adventure: « La Grande Expédition », the voyage to
 *      finish, the records of the endless adventure (decision of the parent, 21 November 2026)
 */
const FORMAT = 'conquete-serpents-family';
const VERSIONS = [1, 2, 3, 4, 5, 6] as const;
/**
 * What a player keeps under keys of its own, carried by a version 6 file as the very texts
 * the device holds. Here they are only checked to be bounded JSON: their own readers
 * (`familyExtras.ts`) decide whether a file is accepted.
 */
export const FAMILY_EXTRAS = ['expedition', 'voyage', 'endless'] as const;
export type FamilyExtras = Readonly<Partial<Record<(typeof FAMILY_EXTRAS)[number], string>>>;
/** The version of the file that carries them. */
export const FAMILY_EXTRAS_VERSION = 6;
/** No text is longer than the longest of the three, the log of an expedition. */
const EXTRA_CHARACTER_LIMIT = EXPEDITION_LOG_LIMIT;
function readExtras(data: unknown): FamilyExtras | null {
  if (!isRecord(data)) return null;
  const names = Object.keys(data);
  // A version 6 file holds at least one of them, and nothing it does not know.
  if (!names.length || names.some((name) => !isOneOf(name, FAMILY_EXTRAS))) return null;
  const extras: Partial<Record<(typeof FAMILY_EXTRAS)[number], string>> = {};
  for (const name of FAMILY_EXTRAS) {
    if (!Object.hasOwn(data, name)) continue;
    const text = data[name];
    if (typeof text !== 'string') return null;
    if (readBoundedJson(text, EXTRA_CHARACTER_LIMIT, (value) => value ?? null) === null)
      return null;
    extras[name] = text;
  }
  return Object.freeze(extras);
}
type FamilyData = {
  format: typeof FORMAT;
  camp: string | null;
  career: CareerState;
};
export type FamilyBackup = FamilyData &
  (
    | { version: 1; missions?: never; albums?: never }
    | { version: 2 | 3; missions: MissionProgress; albums?: never }
    | { version: 4 | 5; missions: MissionProgress; albums: CapriceAlbums; extras?: never }
    | {
        version: typeof FAMILY_EXTRAS_VERSION;
        missions: MissionProgress;
        albums: CapriceAlbums;
        extras: FamilyExtras;
      }
  );
/** True for the versions that carry the albums of challenges. */
export const hasAlbums = (
  backup: FamilyBackup,
): backup is Extract<FamilyBackup, { albums: CapriceAlbums }> => backup.version >= 4;
export const FAMILY_CHARACTER_LIMIT = 500000;
export const FAMILY_BYTE_LIMIT = 1000000;
const withinLimits = (raw: string) =>
  raw.length <= FAMILY_CHARACTER_LIMIT &&
  new TextEncoder().encode(raw).byteLength <= FAMILY_BYTE_LIMIT;
/** The file as returned to the caller, unless written out again it would be too large. */
const withinSize = (backup: FamilyBackup) => (withinLimits(JSON.stringify(backup)) ? backup : null);

/** A saved camp played with the second balance revision or a later one. */
const campUsesBalance2 = (raw: string | null): boolean =>
  raw !== null && (decodeCheckpoint(raw)?.balanceRevision ?? 1) >= 2;
function missionProgressHasBalance2(missions: MissionProgress): boolean {
  return (
    missions.version === 2 ||
    Object.values(missions.lastRuns).some((run) => run.balance === 2) ||
    [missions.retryCamp, missions.classicCamp].some(campUsesBalance2)
  );
}
/** An expedition of the tutorial refuge, which a version 2 file cannot describe. */
const hasTutorialRun = (missions: MissionProgress): boolean =>
  Object.values(missions.lastRuns).some((run) => run.rules === 2);

type Camp = { raw: string | null; tutorial: boolean; balanced: boolean };

/** The current camp written again in the current format, and what it asks of the version. */
function readCamp(saved: unknown): Camp | null {
  if (saved === null) return { raw: null, tutorial: false, balanced: false };
  if (typeof saved !== 'string') return null;
  const game = decodeCheckpoint(saved);
  const raw = game && encodeCheckpoint(game);
  if (!game || !raw) return null;
  return { raw, tutorial: game.mission?.rules === 2, balanced: game.balanceRevision >= 2 };
}

/** Every field is rebuilt by its own reader; a version too old for its content is refused. */
function readFamilyData(data: unknown): FamilyBackup | null {
  if (!isRecord(data) || data.format !== FORMAT || !isOneOf(data.version, VERSIONS)) return null;
  // A mistaken version must not silently discard a child's collection.
  if (data.version < 4 && Object.hasOwn(data, 'albums')) return null;
  if (data.version !== FAMILY_EXTRAS_VERSION && Object.hasOwn(data, 'extras')) return null;
  const camp = readCamp(data.camp);
  if (!camp) return null;
  const career = readCareerState(JSON.stringify(data.career));
  if (!career) return null;
  const balanced = camp.balanced || career.chapterCamps.some(campUsesBalance2);
  if (data.version === 1) {
    // A version mistake must never silently discard expedition progress.
    if (Object.hasOwn(data, 'missions') || camp.tutorial || balanced) return null;
    return withinSize({ format: FORMAT, version: 1, camp: camp.raw, career });
  }
  const missions = validateMissionProgress(data.missions);
  if (!missions) return null;
  if (data.version < 5 && (balanced || missionProgressHasBalance2(missions))) return null;
  if (data.version === 2 && (camp.tutorial || hasTutorialRun(missions))) return null;
  if (data.version === 2 || data.version === 3)
    return withinSize({ format: FORMAT, version: data.version, camp: camp.raw, career, missions });
  const albums = validateCapriceAlbums(data.albums);
  if (!albums) return null;
  if (data.version === FAMILY_EXTRAS_VERSION) {
    const extras = readExtras(data.extras);
    if (!extras) return null;
    return withinSize({
      format: FORMAT,
      version: FAMILY_EXTRAS_VERSION,
      camp: camp.raw,
      career,
      missions,
      albums,
      extras,
    });
  }
  return withinSize({
    format: FORMAT,
    version: data.version,
    camp: camp.raw,
    career,
    missions,
    albums,
  });
}

/** Parse only local data; every returned field is reconstructed by the business decoders. */
export function readFamilyBackup(text: string): FamilyBackup | null {
  if (typeof text !== 'string' || !withinLimits(text)) return null;
  return readBoundedJson(text, FAMILY_CHARACTER_LIMIT, readFamilyData);
}

type Content = { career: CareerState; missions?: MissionProgress; albums?: CapriceAlbums };

/** The live memory checked part by part; albums only travel with the expeditions. */
function validateContent(
  career: CareerState,
  missions?: MissionProgress,
  albums?: CapriceAlbums,
): Content | null {
  const validCareer = validateCareerState(career);
  if (!validCareer) return null;
  const validMissions = missions === undefined ? undefined : validateMissionProgress(missions);
  if (missions !== undefined && !validMissions) return null;
  const validAlbums = albums === undefined ? undefined : validateCapriceAlbums(albums);
  if (albums !== undefined && (!validAlbums || !validMissions)) return null;
  return {
    career: validCareer,
    missions: validMissions ?? undefined,
    albums: validAlbums ?? undefined,
  };
}

/** Throws on a camp that is not JSON: nothing is written then. */
const campIsTutorial = (raw: string | null): boolean =>
  raw !== null && JSON.parse(raw).mission?.rules === 2;

/** The oldest version able to hold this content; null when the content cannot be written. */
function versionFor(
  campRaw: string | null,
  { career, missions, albums }: Content,
  extras: boolean,
): FamilyBackup['version'] | null {
  // What is kept beside the adventure only travels with the expeditions and the albums.
  if (extras) return missions && albums ? FAMILY_EXTRAS_VERSION : null;
  const balanced =
    campUsesBalance2(campRaw) ||
    (missions && missionProgressHasBalance2(missions)) ||
    career.chapterCamps.some(campUsesBalance2);
  if (balanced && (!missions || !albums)) return null;
  const tutorial = (!!missions && hasTutorialRun(missions)) || campIsTutorial(campRaw);
  if (balanced) return 5;
  if (albums) return 4;
  if (!missions) return 1;
  return tutorial ? 3 : 2;
}

/** Export the live memory supplied by the caller, never an older browser storage record. */
export function writeFamilyBackup(
  campRaw: string | null,
  career: CareerState,
  missions?: MissionProgress,
  albums?: CapriceAlbums,
  extras?: FamilyExtras,
): string | null {
  try {
    const content = validateContent(career, missions, albums);
    const carried = !!extras && Object.keys(extras).length > 0;
    const version = content && versionFor(campRaw, content, carried);
    if (!content || !version) return null;
    // Read back what is about to be written: the file given out is one the reader accepts.
    const backup = readFamilyBackup(
      JSON.stringify({
        format: FORMAT,
        version,
        ...(content.missions ? { missions: content.missions } : {}),
        ...(content.albums ? { albums: content.albums } : {}),
        camp: campRaw,
        career: content.career,
        ...(carried ? { extras } : {}),
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
