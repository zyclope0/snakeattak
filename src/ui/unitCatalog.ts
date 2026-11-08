import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';

export const UNIT_FAMILIES = {
  all: 'Tous',
  humans: 'Humains',
  creatures: 'Dinosaures et dragon',
  mutants: 'Mutants',
  defenses: 'Palissades',
} as const;
export type UnitFamily = keyof typeof UNIT_FAMILIES;

export const RECRUITABLE_KINDS = Object.keys(kinds).filter((k) => k !== 'hero') as Kind[];

export function matchesUnitFamily(kind: Kind, family: string): boolean {
  if (family === 'all') return true;
  const actual =
    kind === 'wall'
      ? 'defenses'
      : kind === 'mutantRock' || kind === 'mutantStretch'
        ? 'mutants'
        : ['dino', 'dragon', 'raptor', 'triceratops', 'stegosaurus', 'trex'].includes(kind)
          ? 'creatures'
          : 'humans';
  return family === actual;
}
