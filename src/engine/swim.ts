import { spinosaurusRule } from '../balanceRevision.ts';
import type { SpinosaurusRule } from '../balanceRevision.ts';
import { kinds } from '../data.ts';
import { isFlying } from '../flying.ts';
import { blocked, inRiver, nearestCampPoint } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import { LANES } from '../ai.ts';
import { BRIDGE_END_X, BRIDGE_HALF_WIDTH, CAMP_LEFT, RIVER_LEFT_X } from '../boardLandmarks.ts';
import type { Entity } from './state.ts';
import { addEffect, closerTo, distance, faceToward, forgetPath } from './state.ts';
import type { Game } from '../game.ts';

/** Beside a bridge, the swimmer keeps this far from the middle of its lane: in the water. */
const BESIDE_BRIDGE = BRIDGE_HALF_WIDTH + 12;
/** The water a swimmer keeps to, inside the river banks. */
const RIVER_MARGIN = 12;
/** A swim path is checked every this many board units. */
const SWIM_STEP = 4;
/** Close enough to the bank to climb out. */
const BANK_REACH = 3;

/** Water or open ground: where a swimmer may be. The rocks and the board's edges are not. */
const swimmable = (game: Game, p: Point) => inRiver(p.x, p.y) || !blocked(p.x, p.y, game.level);
/** True when every point of the straight line from `a` to `b` is swimmable. */
function clearLine(game: Game, a: Point, b: Point): boolean {
  const steps = Math.max(1, Math.ceil(distance(a, b) / SWIM_STEP));
  for (let i = 0; i <= steps; i++)
    if (
      !swimmable(game, { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps })
    )
      return false;
  return true;
}
/** A snake walking on one of the three bridges, where a swimmer can reach it. */
const onBridge = (e: Entity) =>
  e.hp > 0 && !isFlying(e) && e.x > RIVER_LEFT_X && e.x < BRIDGE_END_X;
/** The water beside the bridge of `prey`, on the side of `from`. */
function besideBridge(prey: Entity, from: Point): Point {
  const lane = LANES[prey.lane] ?? prey.y;
  const side = from.y < lane ? -1 : 1;
  return {
    x: Math.max(RIVER_LEFT_X + RIVER_MARGIN, Math.min(BRIDGE_END_X - RIVER_MARGIN, prey.x)),
    y: lane + side * BESIDE_BRIDGE,
  };
}
/** The point of the bank in front of the swimmer, inside the camp. */
const bankOf = (game: Game, u: Point): Point =>
  nearestCampPoint({ x: CAMP_LEFT, y: u.y }, game.level);

/** Moves `u` straight towards `goal` at `speed`; true once there. */
function swimTo(u: Entity, goal: Point, speed: number, dt: number): boolean {
  const d = distance(u, goal);
  const step = Math.min(d, speed * dt);
  if (d > 0) {
    u.facing = goal.x > u.x ? 1 : goal.x < u.x ? -1 : u.facing;
    u.x += ((goal.x - u.x) / d) * step;
    u.y += ((goal.y - u.y) / d) * step;
  }
  u.state = 'move';
  return step === d;
}

/** The snake on a bridge the spinosaurus dives for, if one is in reach and the water clear. */
function preyFor(game: Game, u: Entity, rule: SpinosaurusRule): Entity | undefined {
  return game.enemies
    .filter((e) => onBridge(e) && distance(u, e) <= rule.swimReach)
    .sort((a, b) => closerTo(u, a, b))
    .find((e) => clearLine(game, u, besideBridge(e, u)));
}

/**
 * The spinosaurus's turn in the water (seventh revision). False when it does not swim this
 * step and fights on land like any ally; true while it dives, bites from the water or swims
 * back. `bite` is its ordinary blow: the bite and the sweep of its sail.
 */
export function swimTurn(
  game: Game,
  u: Entity,
  dt: number,
  bite: (target: Entity) => void,
): boolean {
  const rule = spinosaurusRule(game.balanceRevision);
  if (!rule || u.kind !== 'spinosaurus') return false;
  const swim = (u.swim ??= { wait: 0, prey: null, back: false });
  swim.wait = Math.max(0, swim.wait - dt);
  if (swim.prey === null && !swim.back) {
    if (swim.wait > 0) return false;
    const prey = preyFor(game, u, rule);
    if (!prey) return false;
    swim.prey = prey.id;
    u.targetId = prey.id;
    forgetPath(u);
    addEffect(game, u, u, 'splash');
  }
  if (!swim.back) {
    const prey = game.enemies.find((e) => e.id === swim.prey);
    if (!prey || !onBridge(prey)) swim.back = true;
    else {
      faceToward(u, prey);
      if (distance(u, prey) > kinds.spinosaurus.range) {
        swimTo(u, besideBridge(prey, u), rule.swimSpeed, dt);
        return true;
      }
      if (u.cool > 0) return true;
      bite(prey);
      swim.back = true;
      return true;
    }
  }
  // Back to the bank, straight across the water; once on it, the next dive waits.
  const bank = bankOf(game, u);
  if (distance(u, bank) > BANK_REACH && !swimTo(u, bank, rule.swimSpeed, dt)) return true;
  if (inRiver(u.x, u.y)) return true;
  addEffect(game, u, u, 'splash');
  u.swim = { wait: rule.swimEvery, prey: null, back: false };
  u.targetId = null;
  forgetPath(u);
  return true;
}

/**
 * A wave is over while a spinosaurus swims: it climbs out on the bank, and its next wave
 * starts with a dive ready, as a camp read back from a save would.
 */
export function climbOut(game: Game) {
  for (const u of game.units) {
    if (!u.swim) continue;
    if (u.x < CAMP_LEFT || inRiver(u.x, u.y)) {
      const bank = bankOf(game, u);
      u.x = bank.x;
      u.y = bank.y;
    }
    delete u.swim;
    u.targetId = null;
    forgetPath(u);
  }
}
