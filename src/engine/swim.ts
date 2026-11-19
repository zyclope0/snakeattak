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
const bankOf = (game: Game, u: Point, others: readonly Point[] = []): Point =>
  nearestCampPoint({ x: CAMP_LEFT, y: u.y }, game.level, others);

/** The point `step` board units from `from` towards `goal`, or `goal` itself if nearer. */
function stepToward(from: Point, goal: Point, step: number): Point {
  const d = distance(from, goal);
  if (d <= step) return goal;
  return { x: from.x + ((goal.x - from.x) / d) * step, y: from.y + ((goal.y - from.y) / d) * step };
}

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

/** From the water beside its bridge, the spinosaurus's bite reaches this snake. */
const biteable = (prey: Entity, from: Point) =>
  distance(besideBridge(prey, from), prey) <= kinds.spinosaurus.range;
/**
 * The snake on a bridge the spinosaurus dives for: in reach, that its bite reaches from the
 * water beside the bridge, and with clear water on the way.
 */
function preyFor(game: Game, u: Entity, rule: SpinosaurusRule): Entity | undefined {
  return game.enemies
    .filter((e) => onBridge(e) && distance(u, e) <= rule.swimReach && biteable(e, u))
    .sort((a, b) => closerTo(u, a, b))
    .find((e) => clearLine(game, u, besideBridge(e, u)));
}
/** True while a spinosaurus is on its way to a bridge or back: it fights nowhere else. */
export const diving = (u: Entity): boolean => !!u.swim && (u.swim.prey !== null || u.swim.back);
/** The dive ends: it fights on land again, and the next one waits `wait` seconds. */
function landAgain(u: Entity, wait: number) {
  u.swim = { wait, prey: null, back: false };
  u.targetId = null;
  forgetPath(u);
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
    if (!prey || !onBridge(prey) || !biteable(prey, u)) {
      // Its snake is gone before it reached the water: it stays on land, where it walks
      // around the rocks like any ally, and may dive again at once.
      if (!inRiver(u.x, u.y) && u.x >= CAMP_LEFT) {
        landAgain(u, 0);
        return false;
      }
      swim.back = true;
    } else {
      faceToward(u, prey);
      if (distance(u, prey) > kinds.spinosaurus.range) {
        const spot = besideBridge(prey, u);
        // Only through water or open ground: a rock on the way calls the dive off.
        if (!swimmable(game, stepToward(u, spot, rule.swimSpeed * dt))) swim.back = true;
        else if (swimTo(u, spot, rule.swimSpeed, dt) && distance(u, prey) > kinds.spinosaurus.range)
          // There, and its snake still out of reach: it gives up and swims back.
          swim.back = true;
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
  if (distance(u, bank) > BANK_REACH) {
    // A rock between it and the bank (never seen on the three maps): it climbs out at once.
    if (!swimmable(game, stepToward(u, bank, rule.swimSpeed * dt))) Object.assign(u, bank);
    else if (!swimTo(u, bank, rule.swimSpeed, dt)) return true;
  }
  if (inRiver(u.x, u.y)) return true;
  addEffect(game, u, u, 'splash');
  landAgain(u, rule.swimEvery);
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
      // Not on another ally's place: a camp read back from a save would not allow it.
      const others = game.units.filter((v) => v !== u && v.hp > 0);
      let bank: Point;
      try {
        bank = bankOf(game, u, others);
      } catch {
        // A camp with no free place left: the bank in front of it all the same.
        bank = bankOf(game, u);
      }
      u.x = bank.x;
      u.y = bank.y;
    }
    delete u.swim;
    u.targetId = null;
    forgetPath(u);
  }
}
