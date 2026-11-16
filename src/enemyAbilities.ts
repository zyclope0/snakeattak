import { enemies } from './enemies.ts';
import type { EnemyKind } from './enemies.ts';
import { kinds } from './data.ts';

export const RATTLE_RADIUS = 112;
export const RATTLE_COOLDOWN = 5;
export const CONFUSION_DURATION = 0.8;
export const CONFUSION_IMMUNITY = 4;

/** A fixed death reaction belongs only to the ordinary species, never the king. */
export function deathRetaliation(enemy: { variant: EnemyKind; boss: boolean }): number {
  return enemy.boss ? 0 : enemy.variant === 'royal' ? 2 : enemy.variant === 'mamba' ? 3 : 0;
}

/**
 * The rare snake: its bite takes at least the whole health of a club fighter, so the smaller
 * allies fall at once. The stronger waves bite harder still.
 */
export const RARE_BITE = kinds.club.hp;
/** What one bite of an ordinary snake takes, before the ally's own protections. */
export function biteDamage(variant: EnemyKind, waveDamage: number): number {
  const scaled = waveDamage * enemies[variant].damage;
  return variant === 'rare' ? Math.max(scaled, RARE_BITE) : scaled;
}
/** The ninja snake lets the first blow pass: how many blows a newly arrived snake dodges. */
export const NINJA_DODGES = 1;
export const dodgesOf = (variant: EnemyKind): number => (variant === 'shadow' ? NINJA_DODGES : 0);
