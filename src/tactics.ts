import { chooseLane, LANES, LANE_IDS } from './ai.ts';
import { lanePoint } from './routes.ts';
import type { Level } from './levels.ts';

export const FEAST_DURATION = 14;
export type FeastFlavor = 'lure' | 'sticky';
export type Feast = { lane: number; remaining: number; flavor: FeastFlavor };
export const STICKY_ZONE = { left: 660, right: 852, halfWidth: 34 } as const;
export function feastPoint(feast: Feast, level: Level) {
  return feast.flavor === 'sticky'
    ? lanePoint((STICKY_ZONE.left + STICKY_ZONE.right) / 2, feast.lane, level)
    : { x: 420, y: LANES[feast.lane] };
}
export function stickySpeed(
  enemy: { x: number; y: number; boss: boolean },
  feast: Feast | null,
  level: Level,
): number {
  if (
    !feast ||
    feast.flavor !== 'sticky' ||
    enemy.x < STICKY_ZONE.left ||
    enemy.x > STICKY_ZONE.right
  )
    return 1;
  return Math.abs(enemy.y - lanePoint(enemy.x, feast.lane, level).y) <= STICKY_ZONE.halfWidth
    ? enemy.boss
      ? 0.75
      : 0.55
    : 1;
}

/** Reuses the same random draw: no hidden re-rolls, and unchanged AI without honey. */
export type LaneDecision = { lane: number; tempted: boolean };
export function decideTemptation(
  scores: number[],
  wave: number,
  roll: number,
  feastLane: number | null,
  boss: boolean,
  allowed: readonly number[] = LANE_IDS,
): LaneDecision {
  if (feastLane === null || !allowed.includes(feastLane))
    return { lane: chooseLane(scores, wave, roll, allowed), tempted: false };
  const temptation = boss ? 0.25 : 0.75;
  if (roll < temptation) return { lane: feastLane, tempted: true };
  return {
    lane: chooseLane(scores, wave, (roll - temptation) / (1 - temptation), allowed),
    tempted: false,
  };
}
