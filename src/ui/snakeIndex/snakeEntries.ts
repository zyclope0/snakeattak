import { Game } from '../../game.ts';
import { TOTAL_WAVES } from '../../gameConstants.ts';
import { THREAT_DETAILS, waveThreats } from '../threatPreview.ts';
import type { ThreatKind } from '../threatPreview.ts';

export type SnakeEntry = { kind: ThreatKind; firstWave: number };

/**
 * Every snake of the game, in the order a child meets them in the great adventure. The wave
 * comes from the rules themselves: a wave that changes moves its snakes here too.
 */
export function snakeEntries(): SnakeEntry[] {
  const adventure = new Game();
  const first = new Map<ThreatKind, number>();
  for (let wave = TOTAL_WAVES; wave >= 1; wave--)
    for (const { kind } of waveThreats(adventure, wave).entries) first.set(kind, wave);
  return (Object.keys(THREAT_DETAILS) as ThreatKind[])
    .map((kind) => ({ kind, firstWave: first.get(kind) ?? TOTAL_WAVES }))
    .sort(
      (a, b) =>
        a.firstWave - b.firstWave ||
        THREAT_DETAILS[a.kind].priority - THREAT_DETAILS[b.kind].priority,
    );
}
