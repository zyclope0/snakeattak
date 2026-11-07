import type { EnemyKind } from './enemies.ts';

export const RATTLE_RADIUS = 112;
export const RATTLE_COOLDOWN = 5;
export const CONFUSION_DURATION = 0.8;
export const CONFUSION_IMMUNITY = 4;

/** A fixed death reaction belongs only to the ordinary species, never the king. */
export function deathRetaliation(enemy: { variant: EnemyKind; boss: boolean }): number {
  return enemy.boss ? 0 : enemy.variant === 'royal' ? 2 : enemy.variant === 'mamba' ? 3 : 0;
}
