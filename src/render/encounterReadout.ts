import type { Game } from '../game.ts';
import { bossReadout } from './bossReadout.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import { BOARD_WIDTH } from './boardResolution.ts';

type TimedLabel = { remaining: number; label: string };
export type EncounterReadout = {
  eggs: (TimedLabel & { id: number; x: number; y: number })[];
  confusion: { count: number; label: string } | null;
  encouragement: (TimedLabel & { ratio: number }) | null;
  shot: (TimedLabel & { x: number; y: number; radius: number }) | null;
};

/** Current combat facts only: no RNG, event queue or presentation countdown. */
export function encounterReadout(game: Readonly<Game>): EncounterReadout {
  const result: EncounterReadout = { eggs: [], confusion: null, encouragement: null, shot: null };
  if (game.status !== 'fighting') return result;
  for (const egg of game.eggs) {
    if (!(egg.hatchIn > 0 && egg.hatchIn <= 3)) continue;
    result.eggs.push({
      id: egg.id,
      x: egg.x,
      y: egg.y,
      remaining: egg.hatchIn,
      label: fill(TEXT.eclosionNS, Math.ceil(egg.hatchIn)),
    });
    if (result.eggs.length === 6) break;
  }
  const confused = game.units.filter((u) => u.hp > 0 && u.confusedFor > 0).length;
  if (confused)
    result.confusion = {
      count: confused,
      label: `? ${confused} ${confused === 1 ? TEXT.allieHesite : TEXT.alliesHesitent}`,
    };
  if (game.encouragementRemaining > 0)
    result.encouragement = {
      remaining: game.encouragementRemaining,
      ratio: Math.max(0, Math.min(1, game.encouragementRemaining / 8)),
      label: fill(TEXT.courageAttaquesAccelereesNS, Math.ceil(game.encouragementRemaining)),
    };
  for (const boss of game.enemies) {
    // BossSignals owns the circle, cross and arc; share its exact target readout.
    const shot = bossReadout(boss, game.tuning)?.shot;
    if (!shot) continue;
    const remaining = boss.bossState!.windup;
    result.shot = {
      x: shot.x,
      y: shot.y,
      radius: shot.radius,
      remaining,
      label: fill(TEXT.crachatIciNS, Math.ceil(remaining)),
    };
    break;
  }
  return result;
}

/** Pack at most six labels per row while keeping each source egg unchanged. */
/**
 * Where the plaque of each egg goes. `scale` is how much larger than drawn the plaques are
 * on a small screen (1 on a screen where the board keeps its size).
 */
export function eggLabelPositions(eggs: readonly { x: number; y: number }[], scale = 1) {
  const half = 77 * scale,
    right = BOARD_WIDTH - half;
  const labels = eggs.slice(0, 6).map((egg) => ({
    x: Math.max(half, Math.min(right, egg.x)),
    y: Math.max(145, Math.min(597, egg.y - 53)),
  }));
  const rows = new Map<number, number[]>();
  for (const [i, label] of labels.entries()) {
    const row = rows.get(label.y) ?? [];
    row.push(i);
    rows.set(label.y, row);
  }
  for (const indices of rows.values()) {
    indices.sort((a, b) => labels[a].x - labels[b].x);
    // Side by side; a row too crowded for its larger plaques shares the width of the board
    // rather than leaving it.
    const step = Math.min(154 * scale, (right - half) / Math.max(1, indices.length - 1));
    for (let i = 1; i < indices.length; i++)
      labels[indices[i]].x = Math.max(labels[indices[i]].x, labels[indices[i - 1]].x + step);
    // Pushed past the right edge, the row comes back from that edge, plaque by plaque: one
    // on the left is moved only as far as its neighbours need.
    for (let i = indices.length - 1; i >= 0; i--) {
      const limit = i === indices.length - 1 ? right : labels[indices[i + 1]].x - step;
      labels[indices[i]].x = Math.min(labels[indices[i]].x, limit);
    }
  }
  return labels;
}
