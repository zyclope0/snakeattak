import { canHitFlying, isFlying } from '../flying.ts';
import { lanePoint, junctionPoint, roadLeg, junctionLeg, routeJunctions } from '../routes.ts';
import { decideTemptation, stickySpeed } from '../tactics.ts';
import { LANES, laneDefense } from '../ai.ts';
import { findPath, blocked, nearestCampPoint, CELL } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import type { Entity } from './state.ts';
import { distance, nextRandom, addEffect, forgetPath } from './state.ts';
import { routeStages } from './field.ts';
import type { Game } from '../game.ts';

/** Seconds a planned path is kept before it is planned again. */
const REPLAN_INTERVAL = 0.45;
/** Caprice: snakes read the defence as cleverly as in this late classic wave. */
const SMART_WAVE = 7;
/** Close enough to a waypoint to aim at the next one. */
const WAYPOINT_REACH = 3;
/** Close enough to a junction or a stage of the road to count as arrived. */
const ARRIVAL_REACH = 2.5;
/** At a stage, a snake may be this far to the side of its trail. */
const LANE_HALF_WIDTH = 14;
/** Seconds of walking for a cavalry or triceratops charge to be full. */
const CHARGE_BUILD_TIME = 1.4;
/** Snakes walk two abreast: odd and even ones on either side of the trail, the king on it. */
const trailOffset = (e: Entity) => (e.boss ? 0 : e.id % 2 ? -11 : 11);

export function pickLane(
  game: Game,
  boss = false,
  at?: Point,
  previousLane?: number,
  airborne = false,
) {
  const decision = decideTemptation(
    laneDefense(airborne ? game.units.filter((u) => canHitFlying(u.kind)) : game.units),
    game.caprice.smart ? SMART_WAVE : game.mission ? game.difficultyWave : game.wave,
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
    const goal = campGoal
      ? nearestCampPoint(target, game.level)
      : (nearestFreeCell(game, target) ?? e);
    e.path = findPath(e, goal, game.level, game.pathRules);
    e.nav = REPLAN_INTERVAL;
  }
  const p = e.path[0];
  if (!p) {
    e.state = 'idle';
    return;
  }
  const d = distance(e, p);
  if (d < WAYPOINT_REACH) {
    e.path.shift();
    return;
  }
  const step = Math.min(d, speed * dt);
  const x = e.x + ((p.x - e.x) / d) * step,
    y = e.y + ((p.y - e.y) / d) * step;
  if (blocked(x, y, game.level)) return;
  e.facing = x > e.x ? 1 : x < e.x ? -1 : e.facing;
  e.x = x;
  e.y = y;
  e.state = 'move';
  if (e.kind === 'cavalry' || e.kind === 'triceratops')
    e.charge = Math.min(1, e.charge + dt / CHARGE_BUILD_TIME);
}
/** Centre of the free grid cell nearest to `target`, searched three cells around it. */
function nearestFreeCell(game: Game, target: Point): Point | undefined {
  const candidates: Point[] = [];
  const cx = Math.floor(target.x / CELL),
    cy = Math.floor(target.y / CELL);
  for (let dx = -3; dx <= 3; dx++)
    for (let dy = -3; dy <= 3; dy++) {
      const p = { x: (cx + dx) * CELL + CELL / 2, y: (cy + dy) * CELL + CELL / 2 };
      if (!blocked(p.x, p.y, game.level)) candidates.push(p);
    }
  return candidates.sort(
    (a, b) => distance(a, target) - distance(b, target) || a.y - b.y || a.x - b.x,
  )[0];
}
export function returnHome(game: Game, u: Entity, speed: number, dt: number) {
  if (u.targetId !== null) {
    u.targetId = null;
    forgetPath(u);
  }
  const home = { x: u.homeX, y: u.homeY };
  if (distance(u, home) > 20) moveUnit(game, u, home, speed, dt);
}
function walkRoad(
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
        ? roadLeg(e, goal.x, e.lane, game.level, trailOffset(e), game.pathRules)
        : junctionLeg(e, goal.y, junctionX, game.level);
    e.nav = REPLAN_INTERVAL;
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
      e.path = findPath(e, goal, game.level, game.pathRules);
      e.nav = REPLAN_INTERVAL;
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
/** A snake's walk: along its lane from stage to stage, or across a junction to a new lane. */
export function followRoute(game: Game, e: Entity, speed: number, dt: number) {
  speed *= stickySpeed(e, game.feast, game.level);
  if (e.turnY !== null) crossJunction(game, e, e.turnY, speed, dt);
  else followLane(game, e, speed, dt);
}
function crossJunction(game: Game, e: Entity, turnY: number, speed: number, dt: number) {
  const junctions = routeJunctions(game.level);
  // `stage` was already advanced when the snake decided to turn: 1 is the first junction.
  const x = e.stage === 1 ? junctions[0] : junctions[1];
  const junction = junctionPoint(x, turnY, game.level);
  if (distance(e, junction) < ARRIVAL_REACH) {
    e.turnY = null;
    forgetPath(e);
  } else walkRoad(game, e, junction, speed, dt, x);
}
function followLane(game: Game, e: Entity, speed: number, dt: number) {
  const stages = routeStages(game.level);
  const last = stages.length - 1;
  const goal = lanePoint(stages[Math.min(e.stage, last)], e.lane, game.level, trailOffset(e));
  const arrived =
    Math.abs(e.x - goal.x) < ARRIVAL_REACH && Math.abs(e.y - goal.y) < LANE_HALF_WIDTH;
  if (!arrived || e.stage >= last) {
    walkRoad(game, e, goal, speed, dt);
    return;
  }
  // Stages 0 and 3 are the two junctions, where a snake may change lane.
  if (e.stage === 0 || e.stage === 3) reconsiderLane(game, e);
  e.stage++;
  forgetPath(e);
}
function reconsiderLane(game: Game, e: Entity) {
  const next = pickLane(game, e.boss, e, e.lane, isFlying(e));
  if (next === e.lane) return;
  e.lane = next;
  e.turnY = LANES[next];
  game.reroutes++;
}
