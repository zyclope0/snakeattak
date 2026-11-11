import { canHitFlying, isFlying } from '../flying.ts';
import { lanePoint, junctionPoint, roadLeg, junctionLeg, routeJunctions } from '../routes.ts';
import { decideTemptation, stickySpeed } from '../tactics.ts';
import { LANES, laneDefense } from '../ai.ts';
import { findPath, blocked, nearestCampPoint, CELL } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import type { Entity } from './state.ts';
import { distance, nextRandom, addEffect } from './state.ts';
import type { Game } from '../game.ts';

export function pickLane(
  game: Game,
  boss = false,
  at?: Point,
  previousLane?: number,
  airborne = false,
) {
  const decision = decideTemptation(
    laneDefense(airborne ? game.units.filter((u) => canHitFlying(u.kind)) : game.units),
    game.caprice.smart ? 7 : game.mission ? game.difficultyWave : game.wave,
    nextRandom(game),
    game.feast?.flavor === 'lure' ? game.feast.lane : null,
    boss,
    game.enemyLanes,
  );
  if (decision.tempted && at) {
    addEffect(game, at, { x: at.x, y: LANES[decision.lane] }, 'honey');
    if (previousLane !== decision.lane) game.honeyTurns++;
  }
  return decision.lane;
}
export function moveUnit(
  game: Game,
  e: Entity,
  target: Point,
  speed: number,
  dt: number,
  campGoal = true,
) {
  e.nav -= dt;
  if (e.nav <= 0) {
    // An enemy can stand beside a rock in a cell whose centre is blocked.
    // All allied goals (including emergency relief) need a legal grid endpoint.
    let goal = campGoal ? nearestCampPoint(target, game.level) : target;
    if (!campGoal) {
      const candidates: Point[] = [];
      const cx = Math.floor(target.x / CELL),
        cy = Math.floor(target.y / CELL);
      for (let dx = -3; dx <= 3; dx++)
        for (let dy = -3; dy <= 3; dy++) {
          const p = { x: (cx + dx) * CELL + CELL / 2, y: (cy + dy) * CELL + CELL / 2 };
          if (!blocked(p.x, p.y, game.level)) candidates.push(p);
        }
      goal =
        candidates.sort(
          (a, b) => distance(a, target) - distance(b, target) || a.y - b.y || a.x - b.x,
        )[0] ?? e;
    }
    e.path = findPath(e, goal, game.level);
    e.nav = 0.45;
  }
  const p = e.path[0];
  if (!p) {
    e.state = 'idle';
    return;
  }
  const d = distance(e, p);
  if (d < 3) {
    e.path.shift();
    return;
  }
  const step = Math.min(d, speed * dt);
  const x = e.x + ((p.x - e.x) / d) * step,
    y = e.y + ((p.y - e.y) / d) * step;
  if (!blocked(x, y, game.level)) {
    e.facing = x > e.x ? 1 : x < e.x ? -1 : e.facing;
    e.x = x;
    e.y = y;
    e.state = 'move';
    if (e.kind === 'cavalry' || e.kind === 'triceratops')
      e.charge = Math.min(1, e.charge + dt / 1.4);
  }
}
export function returnHome(game: Game, u: Entity, speed: number, dt: number) {
  if (u.targetId !== null) {
    u.targetId = null;
    u.path = [];
    u.nav = 0;
  }
  const home = { x: u.homeX, y: u.homeY };
  if (distance(u, home) > 20) moveUnit(game, u, home, speed, dt);
}
export function walkRoad(
  game: Game,
  e: Entity,
  goal: Point,
  speed: number,
  dt: number,
  junctionX?: number,
) {
  e.nav -= dt;
  if (e.nav <= 0 || !e.path.length) {
    e.path =
      junctionX === undefined
        ? roadLeg(e, goal.x, e.lane, game.level, e.boss ? 0 : e.id % 2 ? -11 : 11)
        : junctionLeg(e, goal.y, junctionX, game.level);
    e.nav = 0.45;
  }
  let remaining = speed * dt;
  while (remaining > 0 && e.path.length) {
    const p = e.path[0],
      d = distance(e, p);
    if (d < 0.01) {
      e.path.shift();
      continue;
    }
    const step = Math.min(d, remaining, 2);
    const x = e.x + ((p.x - e.x) / d) * step,
      y = e.y + ((p.y - e.y) / d) * step;
    if (blocked(x, y, game.level)) {
      // Recovery from an old/off-trail position still respects real obstacles.
      e.path = findPath(e, goal, game.level);
      e.nav = 0.45;
      return;
    }
    if (Math.abs(x - e.x) > 0.01) e.facing = x > e.x ? 1 : -1;
    e.x = x;
    e.y = y;
    e.state = 'move';
    remaining -= step;
    if (step === d) e.path.shift();
  }
}
export function followRoute(game: Game, e: Entity, speed: number, dt: number) {
  speed *= stickySpeed(e, game.feast, game.level);
  if (e.turnY !== null) {
    const junctions = routeJunctions(game.level);
    const x = e.stage === 1 ? junctions[0] : junctions[1];
    const junction = junctionPoint(x, e.turnY, game.level);
    if (distance(e, junction) < 2.5) {
      e.turnY = null;
      e.nav = 0;
      e.path = [];
    } else walkRoad(game, e, junction, speed, dt, x);
    return;
  }
  const junctions = routeJunctions(game.level);
  const stages = [junctions[0], 444, 612, junctions[1], 828, 972, 1032];
  const goal = lanePoint(
    stages[Math.min(e.stage, stages.length - 1)],
    e.lane,
    game.level,
    e.boss ? 0 : e.id % 2 ? -11 : 11,
  );
  if (Math.abs(e.x - goal.x) < 2.5 && Math.abs(e.y - goal.y) < 14 && e.stage < stages.length - 1) {
    if (e.stage === 0 || e.stage === 3) {
      const next = pickLane(game, e.boss, e, e.lane, isFlying(e));
      if (next !== e.lane) {
        e.lane = next;
        e.turnY = LANES[next];
        game.reroutes++;
      }
    }
    e.stage++;
    e.nav = 0;
    e.path = [];
    return;
  }
  walkRoad(game, e, goal, speed, dt);
}
