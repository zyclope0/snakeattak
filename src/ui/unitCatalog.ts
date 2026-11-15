import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import * as TEXT from '../texts/fr/recruiting.ts';

export const UNIT_FAMILIES = {
  all: TEXT.tous,
  humans: TEXT.humains,
  creatures: TEXT.dinosauresEtDragon,
  mutants: TEXT.mutants,
  defenses: TEXT.palissades,
} as const;

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
