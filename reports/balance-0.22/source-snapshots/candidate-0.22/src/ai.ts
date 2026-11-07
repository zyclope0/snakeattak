import { kinds } from './data.ts';
import type { Kind } from './data.ts';
/** Three bridge approaches and two vertical junctions; coordinates also used by the renderer. */
export const LANES = [180, 324, 468] as const;
export const LANE_NAMES = ['Haut', 'Centre', 'Bas'] as const;
type Defender = { kind: Kind | 'snake'; x: number; y: number; hp: number; maxHp: number };
export function laneDefense(units: Defender[]): number[] {
  return LANES.map((y) =>
    units.reduce((score, u) => {
      if (u.hp <= 0 || u.kind === 'snake') return score;
      const d = kinds[u.kind],
        power =
          u.kind === 'wall'
            ? 3
            : u.kind === 'medic' || u.kind === 'nurse'
              ? 2
              : d.damage / d.rate / 10;
      // Every approach crosses the camp. Wide weapons cover neighboring lanes too;
      // an exhausted or absent defender must not look like a full-strength battery.
      const reach = Math.max(90, d.range * 0.7);
      const coverage = Math.exp(-Math.pow((u.y - y) / reach, 2));
      return score + power * (0.25 + (0.75 * u.hp) / u.maxHp) * coverage;
    }, 0),
  );
}
/** Weighted choice: retains exploration, but harder waves increasingly exploit weak lanes. */
export function chooseLane(scores: number[], wave: number, random: number): number {
  const intelligence = Math.min(0.86, 0.12 + Math.max(0, wave - 1) * 0.148);
  const min = Math.min(...scores),
    weak = scores.map((s) => Math.exp(-(s - min) * 0.9)),
    sum = weak.reduce((a, b) => a + b, 0);
  const weights = weak.map((w) => (1 - intelligence) / 3 + (intelligence * w) / sum);
  let threshold = Math.max(0, Math.min(0.999999, random));
  for (let i = 0; i < weights.length; i++) {
    threshold -= weights[i];
    if (threshold < 0) return i;
  }
  return 2;
}
