import type { EnemyKind } from './enemies.ts';

/** Flight changes targeting, never the three ground-route choices. */
export function canHitFlying(kind: string): boolean {
  return kind === 'archer' || kind === 'dragon' || kind === 'tank';
}

export function isFlying(entity: { kind: string; variant: string; boss?: boolean }): boolean {
  return entity.kind === 'snake' && entity.variant === 'flying' && !entity.boss;
}

/** Same remaining-count slots in classic and expeditions; no random draw or extra spawn. */
export function flyingVariant(base: EnemyKind, rank: number, index: number): EnemyKind {
  if (
    !Number.isFinite(rank) ||
    rank < 6 ||
    !Number.isInteger(index) ||
    index < 1 ||
    base === 'royal' ||
    base === 'mamba' ||
    base === 'rattlesnake' ||
    base === 'courtHealer' ||
    // The grasshopper snake walks and leaps: it never becomes a flying snake.
    base === 'grasshopper'
  )
    return base;
  return index === 4 || (rank >= 9 && index === 9) ? 'flying' : base;
}

/** Shared by actors and procedural wings so reduced motion keeps the same altitude. */
export const flightLift = 22;
