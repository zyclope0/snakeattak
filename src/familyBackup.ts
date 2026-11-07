import { decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';
import { readCareerState, validateCareerState } from './progression.ts';
import type { CareerState } from './progression.ts';
import { validateMissionProgress } from './missionProgress.ts';
import type { MissionProgress } from './missionProgress.ts';

type FamilyData = {
  format: 'conquete-serpents-family';
  camp: string | null;
  career: CareerState;
};
export type FamilyBackup = FamilyData &
  ({ version: 1; missions?: never } | { version: 2; missions: MissionProgress });
export const FAMILY_CHARACTER_LIMIT = 500000;
export const FAMILY_BYTE_LIMIT = 1000000;
const withinLimits = (raw: string) =>
  raw.length <= FAMILY_CHARACTER_LIMIT &&
  new TextEncoder().encode(raw).byteLength <= FAMILY_BYTE_LIMIT;

/** Parse only local data; every returned field is reconstructed by the business decoders. */
export function readFamilyBackup(text: string): FamilyBackup | null {
  if (typeof text !== 'string' || !withinLimits(text)) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const data = value as Record<string, unknown>;
    if (data.format !== 'conquete-serpents-family' || (data.version !== 1 && data.version !== 2))
      return null;
    let camp: string | null = null;
    if (data.camp !== null) {
      if (typeof data.camp !== 'string') return null;
      const game = decodeCheckpoint(data.camp);
      if (!game) return null;
      camp = encodeCheckpoint(game);
      if (!camp) return null;
    }
    const career = readCareerState(JSON.stringify(data.career));
    if (!career) return null;
    let result: FamilyBackup;
    if (data.version === 2) {
      const missions = validateMissionProgress(data.missions);
      if (!missions) return null;
      result = { format: 'conquete-serpents-family', version: 2, camp, career, missions };
    } else {
      // A version mistake must never silently discard expedition progress.
      if (Object.hasOwn(data, 'missions')) return null;
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
): string | null {
  try {
    const validatedCareer = validateCareerState(career);
    if (!validatedCareer) return null;
    const validatedMissions =
      missions === undefined ? undefined : validateMissionProgress(missions);
    if (missions !== undefined && !validatedMissions) return null;
    const backup = readFamilyBackup(
      JSON.stringify({
        format: 'conquete-serpents-family',
        version: validatedMissions ? 2 : 1,
        ...(validatedMissions ? { missions: validatedMissions } : {}),
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
