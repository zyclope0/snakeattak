import type { Session } from '../session.ts';
import type { Level } from '../levels.ts';
import type { Point } from '../navigation.ts';
import { LANES } from '../ai.ts';
import { lanePoint } from '../routes.ts';

/** Hit-test the visible walking paths. Ambiguous merging paths at the fort are excluded. */
export function feastLaneAtPoint(point: Point, level: Level): number | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 108 || point.x > 972)
    return null;
  const targets = LANES.map((_, lane) => ({
    lane,
    distance: Math.abs(point.y - lanePoint(point.x, lane, level).y),
  })).sort((a, b) => a.distance - b.distance);
  // The warm road is 56 world units wide. Do not extend its touch area into
  // grass, or guess a lane where two nearby roads are equally plausible.
  return targets[0].distance <= 28 && targets[1].distance - targets[0].distance >= 8
    ? targets[0].lane
    : null;
}

/** The UI submits an intent; Game retains authority over spending and active lanes. */
export function activateBoard(session: Session, point: Point): boolean {
  if (session.screen !== 'battle') return false;
  if (session.selectedFeast) {
    const lane = feastLaneAtPoint(point, session.game.level);
    if (lane !== null && session.placeFeast(lane)) return true;
    session.actionHint = session.game.paused
      ? 'Reprends la partie.'
      : session.game.status !== 'fighting'
        ? 'Lance la vague.'
        : lane === null
          ? 'Touche un chemin.'
          : !session.game.enemyLanes.includes(lane)
            ? 'Voie paisible.'
            : 'Pot déjà utilisé.';
    return false;
  }
  return session.placeSelected(point.x, point.y);
}
