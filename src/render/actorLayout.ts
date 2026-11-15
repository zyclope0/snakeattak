import type { Kind } from '../data.ts';
import type { EnemyKind } from '../enemies.ts';
/** Source sheets have different profiles; never infer them from the army alone. */
export function spriteFlip(kind: Kind | 'snake', variant: EnemyKind, facing: number): boolean {
  // The ninja snake borrows the picture of the runner for now, and its profile with it.
  const sourceFacing =
    kind === 'snake' &&
    variant !== 'runner' &&
    variant !== 'spitter' &&
    variant !== 'umbrella' &&
    variant !== 'shadow'
      ? 1
      : -1;
  return (facing < 0 ? -1 : 1) !== sourceFacing;
}

/** Larger silhouettes communicate weight; the boss needs room for all three heads. */
export function actorSize(kind: Kind | 'snake', variant: EnemyKind, boss: boolean): number {
  if (boss) return 132;
  if (kind === 'tank' || kind === 'cavalry') return 88;
  if (kind === 'trex') return 92;
  if (kind === 'triceratops' || kind === 'stegosaurus' || kind === 'mutantRock') return 87;
  if (kind === 'dragon' || kind === 'dino' || kind === 'mutantStretch') return 81;
  if (kind === 'wall') return 74;
  if (kind === 'snake')
    return variant === 'umbrella' || variant === 'royal' || variant === 'fang'
      ? 82
      : variant === 'rare'
        ? 58
        : 70;
  return 72;
}
