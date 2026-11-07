import type { Game } from '../../src/game.ts';

export type EncouragementPolicy = {
  encouragement?: boolean;
  encouragementAtSeconds?: number;
  encouragementTiming?: 'fixed' | 'contact';
};

/** Bots observe a real attack, just as a player can. No combat or RNG mutation. */
export function shouldEncourage(
  game: Readonly<Game>,
  elapsed: number,
  policy: EncouragementPolicy,
): boolean {
  if (!policy.encouragement || game.encouragementUsed || game.status !== 'fighting' || game.paused)
    return false;
  return policy.encouragementTiming === 'contact'
    ? game.units.some((u) => u.hp > 0 && u.state === 'attack')
    : elapsed >= (policy.encouragementAtSeconds ?? 8);
}
