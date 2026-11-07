import type { Game } from '../game.ts';
import { bossReadout } from './bossReadout.ts';

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
      label: `Éclosion · ${Math.ceil(egg.hatchIn)} s`,
    });
    if (result.eggs.length === 6) break;
  }
  const confused = game.units.filter((u) => u.hp > 0 && u.confusedFor > 0).length;
  if (confused)
    result.confusion = {
      count: confused,
      label: `? ${confused} ${confused === 1 ? 'allié hésite' : 'alliés hésitent'}`,
    };
  if (game.encouragementRemaining > 0)
    result.encouragement = {
      remaining: game.encouragementRemaining,
      ratio: Math.max(0, Math.min(1, game.encouragementRemaining / 8)),
      label: `Courage ! · attaques accélérées · ${Math.ceil(game.encouragementRemaining)} s`,
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
      label: `Crachat ici · ${Math.ceil(remaining)} s`,
    };
    break;
  }
  return result;
}

/** Pack at most six labels per row while keeping each source egg unchanged. */
export function eggLabelPositions(eggs: readonly { x: number; y: number }[]) {
  const labels = eggs.slice(0, 6).map((egg) => ({
    x: Math.max(77, Math.min(1023, egg.x)),
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
    for (let i = 1; i < indices.length; i++)
      labels[indices[i]].x = Math.max(labels[indices[i]].x, labels[indices[i - 1]].x + 154);
    const overflow = Math.max(0, labels[indices[indices.length - 1]].x - 1023);
    for (const index of indices) labels[index].x -= overflow;
  }
  return labels;
}
