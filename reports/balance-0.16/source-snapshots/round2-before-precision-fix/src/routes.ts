import { LANES } from './ai.ts';
import type { Level } from './levels.ts';
import type { Point } from './navigation.ts';
import { blocked, findPath } from './navigation.ts';

/** Shared walking centreline. The bridge openings and decision junctions stay fixed. */
export function lanePoint(x: number, lane: number, level: Level, track = 0): Point {
  const base = LANES[lane];
  let y: number = base;
  if (x >= 108 && x < 372) y += [28, -24, -28][lane] * Math.sin(((x - 108) / 264) * Math.PI);
  if (x > 600 && x < 684 && lane === 2 && level.id === 'clearing')
    y -= 52 * Math.sin(((x - 600) / 84) * Math.PI) ** 2;
  if (x > 684 && x < 972) {
    const groundY = (at: number) =>
      base + [24, -18, -20][lane] * Math.sin(((at - 684) / 288) * Math.PI);
    y = groundY(x);
    for (const rock of level.rocks) {
      if (rock.x <= 684 || Math.abs(rock.y - base) >= rock.r + 26) continue;
      const left = Math.max(684, rock.x - 96),
        right = Math.min(972, rock.x + 96);
      if (x <= left || x >= right) continue;
      const sign = Math.sign(groundY(rock.x) - rock.y) || (lane === 0 ? 1 : -1);
      const target = rock.y + sign * (rock.r + 28);
      const t = x < rock.x ? (x - left) / (rock.x - left) : (right - x) / (right - rock.x);
      y += (target - groundY(rock.x)) * Math.sin((Math.PI * t) / 2) ** 2;
    }
  }
  if (x > 972) {
    const t = Math.max(0, Math.min(1, (x - 972) / 60));
    y = base + (324 - base) * t * t * (3 - 2 * t);
  }
  return { x, y: y + track };
}
export function junctionPoint(x: number, y: number): Point {
  return { x: x + (x === 684 ? -14 : 14) * Math.sin(((y - 180) / 288) * Math.PI * 2), y };
}
export function laneRoad(lane: number, level: Level): Point[] {
  const points: Point[] = [];
  for (let x = 108; x <= 1032; x += 4) points.push(lanePoint(x, lane, level));
  return points;
}
export function junctionRoad(x: number): Point[] {
  const points: Point[] = [];
  for (let y = 180; y <= 468; y += 4) points.push(junctionPoint(x, y));
  return points;
}
/** Join gradually from an egg or an older save, then follow the rendered trail. */
export function roadLeg(
  from: Point,
  toX: number,
  lane: number,
  level: Level,
  track: number,
): Point[] {
  const points: Point[] = [];
  const direction = toX >= from.x ? 1 : -1;
  for (let x = from.x + direction * 4; direction * (toX - x) > 0; x += direction * 4)
    points.push(lanePoint(x, lane, level, track));
  points.push(lanePoint(toX, lane, level, track));
  // An off-trail fighter may be on the far side of a boulder. Joining the
  // next x sample blindly would walk into it before grid recovery can work.
  const join = points.findIndex((p) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y)));
    for (let i = 1; i <= steps; i++)
      if (
        blocked(from.x + ((p.x - from.x) * i) / steps, from.y + ((p.y - from.y) * i) / steps, level)
      )
        return false;
    return true;
  });
  return join >= 0 ? points.slice(join) : findPath(from, points.at(-1)!, level);
}
export function junctionLeg(from: Point, toY: number, x: number): Point[] {
  const points: Point[] = [];
  const direction = toY >= from.y ? 1 : -1;
  for (let y = from.y + direction * 4; direction * (toY - y) > 0; y += direction * 4)
    points.push(junctionPoint(x, y));
  points.push(junctionPoint(x, toY));
  return points;
}
