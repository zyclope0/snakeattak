import { attackArt, ATTACK_SHEETS } from '../art.ts';
import type { ArtFrame } from '../art.ts';
import type { CharacterAction } from './characterMotion.ts';

/** How long the attack image stays after a blow, in visual seconds (frozen in pause). */
export const ATTACK_POSE_SECONDS = 0.2;

/**
 * The image of a fighter right now: its attack frame for a short instant after the
 * blow that also starts its lunge, its idle frame otherwise. Idle is kept when motion
 * is reduced, when the atlas has no attack sheet and when that sheet is not loaded.
 * Display only; returns shared objects.
 */
export function poseArt(
  idle: ArtFrame,
  action: CharacterAction | undefined,
  reduced: boolean,
  loaded: (texture: string) => boolean,
): ArtFrame {
  if (reduced || !action || action.age >= ATTACK_POSE_SECONDS) return idle;
  const attack = attackArt(idle);
  return attack && loaded(attack.texture) ? attack : idle;
}

/**
 * Attack sheets of the base sheets this mission uses and already holds. They are
 * optional: fetched after their base sheet, never waited for, never reported as a failure.
 * Sheets of `first` (the fighters on the board and the coming wave) head the list: they are
 * the ones the very next blow will show.
 */
export function attackSheetsFor(
  keys: ReadonlySet<string>,
  exists: (key: string) => boolean,
  first?: ReadonlySet<string>,
): typeof ATTACK_SHEETS {
  const wanted = ATTACK_SHEETS.filter(
    (sheet) => keys.has(sheet.base) && exists(sheet.base) && !exists(sheet.key),
  );
  if (!first) return wanted;
  return [
    ...wanted.filter((sheet) => first.has(sheet.base)),
    ...wanted.filter((sheet) => !first.has(sheet.base)),
  ];
}
