import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import * as TEXT from './texts/fr/allies.ts';

export type Roster = Kind[];
/** A team of favourites always holds this many different allies. */
export const ROSTER_SIZE = 8;
// Favourites only: recruitment still uses Game's prices, placement and wave locks.
export const DEFAULT_ROSTERS: [Roster, Roster, Roster] = [
  ['club', 'shield', 'nurse', 'archer', 'ninja', 'medic', 'dragon', 'knight'],
  ['club', 'nurse', 'raptor', 'triceratops', 'stegosaurus', 'dino', 'trex', 'dragon'],
  ['club', 'nurse', 'ninja', 'raptor', 'archer', 'cavalry', 'bat', 'mutantStretch'],
];
export const ROSTER_NAMES = [TEXT.equilibree, TEXT.dinos, TEXT.vive] as const;
export const freshRosters = (): [Roster, Roster, Roster] => [
  [...DEFAULT_ROSTERS[0]],
  [...DEFAULT_ROSTERS[1]],
  [...DEFAULT_ROSTERS[2]],
];
/** Accept only eight distinct existing recruits; the hero is never recruitable. */
export function isRoster(raw: unknown): raw is Roster {
  return (
    Array.isArray(raw) &&
    raw.length === ROSTER_SIZE &&
    [...raw].every(
      (kind) => typeof kind === 'string' && kind !== 'hero' && Object.hasOwn(kinds, kind),
    ) &&
    new Set(raw).size === ROSTER_SIZE
  );
}
