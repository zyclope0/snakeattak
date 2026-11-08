import type { Session } from '../session.ts';
import type { Level } from '../levels.ts';
import type { Point } from '../navigation.ts';
import { LANES } from '../ai.ts';
import { lanePoint } from '../routes.ts';

/** Hit-test the visible walking paths. Ambiguous merging paths at the fort are excluded. */
export function feastLaneAtPoint(point: Point, level: Level): number | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 108 || point.x > 972)
    return null;
  let picked: number | null = null,
    distance = 48;
  for (let lane = 0; lane < LANES.length; lane++) {
    const next = Math.abs(point.y - lanePoint(point.x, lane, level).y);
    if (next <= distance) {
      distance = next;
      picked = lane;
    }
  }
  return picked;
}

/** The UI submits an intent; Game retains authority over spending and active lanes. */
export function activateBoard(session: Session, point: Point): boolean {
  if (session.screen !== 'battle') return false;
  if (session.selectedFeast) {
    const lane = feastLaneAtPoint(point, session.game.level);
    return lane !== null && session.placeFeast(lane);
  }
  return session.placeSelected(point.x, point.y);
}
