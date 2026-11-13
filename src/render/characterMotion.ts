import type { Entity, Effect } from '../game.ts';
export type CharacterAction = { age: number; kind: Effect['kind'] };
export type CharacterMotion = { dx: number; dy: number; angle: number; sx: number; sy: number };
/** What `Presentation` has seen of a fighter's walk: never read by the rules. */
export type Gait = {
  /** Board units walked since it was first seen. */
  travel: number;
  /** Visual seconds since it last moved. */
  rest: number;
};
/** A body holds each pose for a quarter of a step: stop-motion, not a smooth slide. */
const POSES = 4;
const HEAVY = new Set<Entity['kind']>(['trex', 'triceratops', 'stegosaurus', 'mutantRock', 'dino']);
/** Board units between two little clouds of dust under a heavy body; 0 for everyone else. */
export function dustSpacing(u: Pick<Entity, 'kind' | 'boss'>): number {
  return u.kind === 'tank' ? 36 : u.kind === 'cavalry' ? 60 : HEAVY.has(u.kind) ? 40 : 0;
}
/** Board units covered by one step (one undulation for a snake). */
export function stepLength(u: Pick<Entity, 'kind' | 'boss'>): number {
  if (u.kind === 'snake') return u.boss ? 46 : 28;
  if (u.kind === 'tank') return 7;
  if (u.kind === 'cavalry') return 30;
  if (HEAVY.has(u.kind) || u.kind === 'twohead') return 20;
  if (u.kind === 'ninja' || u.kind === 'raptor') return 17;
  return 13;
}
/**
 * The walk follows the ground covered, not the clock: twice the speed is twice the steps,
 * a pause or a blocked fighter holds its pose, and nobody slides.
 */
function walk(u: Entity, gait: Gait, pose: CharacterMotion): boolean {
  // A fighter stopped mid-step puts its foot down instead of hanging in the air.
  const ease = Math.max(0, 1 - gait.rest / 0.12);
  if (!ease) return false;
  const steps = gait.travel / stepLength(u),
    held = Math.floor((steps % 1) * POSES) / POSES,
    lift = Math.sin(Math.PI * held) * ease,
    side = Math.floor(steps) % 2 ? -1 : 1;
  if (u.kind === 'snake') {
    // One undulation: the body stretches forward, then gathers itself, swaying as it goes.
    const turn = (Math.floor((steps % 1) * POSES * 2) / (POSES * 2)) * Math.PI * 2,
      reach = Math.sin(turn) * ease,
      heavy = u.boss ? 0.55 : 1;
    pose.sx += reach * 0.075 * heavy;
    pose.sy -= reach * 0.05 * heavy;
    pose.dx += u.facing * reach * 2.2;
    pose.angle += Math.cos(turn) * 0.05 * heavy * ease;
    pose.dy += Math.sin(turn * 2) * 0.9 * ease;
  } else if (u.kind === 'tank') {
    // Tracks do not step: the hull rattles.
    const beat = Math.floor(steps) % 4;
    pose.dy -= [0, 0.9, 0, 0.6][beat] * ease;
    pose.angle += (beat < 2 ? 0.007 : -0.007) * ease;
  } else if (u.kind === 'cavalry') {
    // A gallop: the horse rocks from its hind legs to its forelegs.
    pose.dy -= lift * 3.6;
    pose.angle += u.facing * (0.05 - 0.11 * held) * ease;
    pose.sy += (lift - 0.5) * 0.05;
  } else {
    const heavy = HEAVY.has(u.kind) || u.kind === 'twohead',
      quick = u.kind === 'ninja' || u.kind === 'raptor';
    pose.dy -= lift * (heavy ? 3.4 : quick ? 2.2 : 2.8);
    // Waddle from one foot to the other, leaning a little into the walk.
    pose.angle +=
      side * lift * (heavy ? 0.045 : quick ? 0.03 : 0.065) +
      u.facing * (quick ? 0.07 : 0.02) * ease;
    // Each footfall squashes the clay; the body stretches back at the top of the step.
    pose.sy += (lift - 0.55) * (heavy ? 0.075 : 0.06) * ease;
    pose.sx -= (lift - 0.55) * 0.035 * ease;
  }
  return true;
}
/** Bounded poses only: collisions, damage and route decisions never depend on animation. */
export function characterMotion(
  u: Entity,
  clock: number,
  action: CharacterAction | undefined,
  reduced: boolean,
  gait?: Gait,
  flying = false,
): CharacterMotion {
  const pose = { dx: 0, dy: 0, angle: 0, sx: 1, sy: 1 };
  if (reduced) return pose;
  // On foot, the walk follows the ground really covered: the rules' `state` can blink for one
  // step between two strides, the feet do not.
  let walking = false;
  if (gait && !flying && u.kind !== 'dragon') walking = walk(u, gait, pose);
  else if (u.state === 'move') {
    // In the air (and without a gait to read): the flight keeps its own beat.
    const stride = Math.sin(clock * (u.kind === 'ninja' || u.kind === 'raptor' ? 16 : 9) + u.id);
    pose.dy = stride * (u.kind === 'snake' ? 2.4 : 1.1);
    pose.angle = stride * (u.kind === 'snake' ? 0.035 : 0.018);
    if (u.kind === 'dragon') pose.dy += Math.sin(clock * 7 + u.id) * 1.8;
  }
  if (!action) {
    // Standing fighters breathe from the feet up; a blow or a step replaces the breath.
    if (u.state !== 'move' && !walking) {
      const breath = Math.sin(clock * 2.4 + u.id * 1.7);
      pose.sy += breath * 0.03;
      pose.sx -= breath * 0.012;
    }
    return pose;
  }
  const t = Math.min(1, action.age / 0.4),
    swing = Math.sin(Math.PI * t);
  if (
    u.kind === 'club' ||
    u.kind === 'bat' ||
    u.kind === 'hero' ||
    u.kind === 'knight' ||
    u.kind === 'twohead' ||
    u.kind === 'mutantRock'
  ) {
    pose.dx += u.facing * swing * 6;
    pose.angle -= u.facing * swing * 0.13;
    pose.sx += swing * 0.07;
    pose.sy -= swing * 0.05;
  } else if (u.kind === 'ninja' || u.kind === 'raptor') {
    pose.dx += u.facing * swing * 6;
    pose.angle -= u.facing * swing * 0.08;
    pose.sx += swing * 0.08;
    pose.sy -= swing * 0.05;
  } else if (u.kind === 'dragon') {
    pose.sx += swing * 0.09;
    pose.sy -= swing * 0.05;
    pose.dy -= swing * 2;
  } else if (u.kind === 'dino' || u.kind === 'trex') {
    pose.dy -= swing * 5;
    pose.sx += swing * 0.05;
    pose.angle -= u.facing * swing * 0.04;
  } else if (u.kind === 'triceratops') {
    pose.dx += u.facing * swing * 5;
    pose.angle += u.facing * swing * 0.045;
  } else if (u.kind === 'stegosaurus') {
    pose.dx -= u.facing * swing * 3;
    pose.angle += u.facing * swing * 0.07;
  } else if (u.kind === 'mutantStretch') {
    pose.dx += u.facing * swing * 3;
    pose.sx += swing * 0.14;
    pose.sy -= swing * 0.08;
  } else if (u.kind === 'shield' && action.kind === 'block') {
    pose.angle -= u.facing * swing * 0.09;
  } else if (u.kind === 'snake') {
    // A bite: the snake stretches towards its prey.
    pose.dx += u.facing * swing * 5;
    pose.sx += swing * 0.1;
    pose.sy -= swing * 0.06;
  } else {
    // Archers, tanks and the like: a short recoil.
    pose.dx -= u.facing * swing * 2.5;
    pose.sx -= swing * 0.06;
    pose.sy += swing * 0.05;
  }
  return pose;
}
