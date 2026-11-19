import type { Entity, Effect } from '../game.ts';
export type CharacterAction = {
  age: number;
  kind: Effect['kind'];
  /** Side the blow went to, seen when it was struck: 1 right, -1 left. */
  facing?: 1 | -1;
};
/** Visual seconds a swing lasts: the body finishes its blow before it turns. */
export const SWING_SECONDS = 0.4;
/**
 * The side a fighter shows right now. The rules may turn it at once towards its next
 * target; on screen it keeps the side of the blow until the swing is over.
 */
export function blowFacing(facing: number, action: CharacterAction | undefined): number {
  return action?.facing && action.age < SWING_SECONDS ? action.facing : facing;
}
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
const HEAVY = new Set<Entity['kind']>([
  'trex',
  'spinosaurus',
  'triceratops',
  'stegosaurus',
  'mutantRock',
  'dino',
]);
/** Bodies that walk with a heavy step: the dust raisers, and the knight with two heads. */
const treadsHeavily = (kind: Entity['kind']) => HEAVY.has(kind) || kind === 'twohead';
const isQuick = (kind: Entity['kind']) => kind === 'ninja' || kind === 'raptor';
/** How high the hull of a tank sits on each of the four beats of its tracks. */
const TRACK_BUMPS = [0, 0.9, 0, 0.6];
/** Board units between two little clouds of dust under a heavy body; 0 for everyone else. */
export function dustSpacing(u: Pick<Entity, 'kind' | 'boss'>): number {
  return u.kind === 'tank' ? 36 : u.kind === 'cavalry' ? 60 : HEAVY.has(u.kind) ? 40 : 0;
}
/** Board units covered by one step (one undulation for a snake). */
export function stepLength(u: Pick<Entity, 'kind' | 'boss'>): number {
  if (u.kind === 'snake') return u.boss ? 46 : 28;
  if (u.kind === 'tank') return 7;
  if (u.kind === 'cavalry') return 30;
  if (treadsHeavily(u.kind)) return 20;
  if (isQuick(u.kind)) return 17;
  return 13;
}
/** The pose held during the current step: 0, ¼, ½ or ¾ of the way through it. */
const heldPose = (steps: number) => Math.floor((steps % 1) * POSES) / POSES;
/** One undulation: the body stretches forward, then gathers itself, swaying as it goes. */
function undulate(u: Entity, steps: number, ease: number, pose: CharacterMotion) {
  const turn = (Math.floor((steps % 1) * POSES * 2) / (POSES * 2)) * Math.PI * 2,
    reach = Math.sin(turn) * ease,
    heavy = u.boss ? 0.55 : 1;
  pose.sx += reach * 0.075 * heavy;
  pose.sy -= reach * 0.05 * heavy;
  pose.dx += u.facing * reach * 2.2;
  pose.angle += Math.cos(turn) * 0.05 * heavy * ease;
  pose.dy += Math.sin(turn * 2) * 0.9 * ease;
}
/** Tracks do not step: the hull rattles. */
function rattle(steps: number, ease: number, pose: CharacterMotion) {
  const beat = Math.floor(steps) % 4;
  pose.dy -= TRACK_BUMPS[beat] * ease;
  pose.angle += (beat < 2 ? 0.007 : -0.007) * ease;
}
/** A gallop: the horse rocks from its hind legs to its forelegs. */
function gallop(u: Entity, steps: number, ease: number, pose: CharacterMotion) {
  const held = heldPose(steps),
    lift = Math.sin(Math.PI * held) * ease;
  pose.dy -= lift * 3.6;
  pose.angle += u.facing * (0.05 - 0.11 * held) * ease;
  pose.sy += (lift - 0.5) * 0.05;
}
/** A walk on two or four legs, from one foot to the other. */
function stride(u: Entity, steps: number, ease: number, pose: CharacterMotion) {
  const lift = Math.sin(Math.PI * heldPose(steps)) * ease,
    side = Math.floor(steps) % 2 ? -1 : 1,
    heavy = treadsHeavily(u.kind),
    quick = isQuick(u.kind);
  pose.dy -= lift * (heavy ? 3.4 : quick ? 2.2 : 2.8);
  // Waddle from one foot to the other, leaning a little into the walk.
  pose.angle +=
    side * lift * (heavy ? 0.045 : quick ? 0.03 : 0.065) + u.facing * (quick ? 0.07 : 0.02) * ease;
  // Each footfall squashes the clay; the body stretches back at the top of the step.
  pose.sy += (lift - 0.55) * (heavy ? 0.075 : 0.06) * ease;
  pose.sx -= (lift - 0.55) * 0.035 * ease;
}
/**
 * The walk follows the ground covered, not the clock: twice the speed is twice the steps,
 * a pause or a blocked fighter holds its pose, and nobody slides.
 */
function walk(u: Entity, gait: Gait, pose: CharacterMotion): boolean {
  // A fighter stopped mid-step puts its foot down instead of hanging in the air.
  const ease = Math.max(0, 1 - gait.rest / 0.12);
  if (!ease) return false;
  const steps = gait.travel / stepLength(u);
  if (u.kind === 'snake') undulate(u, steps, ease, pose);
  else if (u.kind === 'tank') rattle(steps, ease, pose);
  else if (u.kind === 'cavalry') gallop(u, steps, ease, pose);
  else stride(u, steps, ease, pose);
  return true;
}
/** In the air (and without a gait to read): the flight keeps its own beat. */
function fly(u: Entity, clock: number, pose: CharacterMotion) {
  const stride = Math.sin(clock * (isQuick(u.kind) ? 16 : 9) + u.id);
  pose.dy = stride * (u.kind === 'snake' ? 2.4 : 1.1);
  pose.angle = stride * (u.kind === 'snake' ? 0.035 : 0.018);
  if (u.kind === 'dragon') pose.dy += Math.sin(clock * 7 + u.id) * 1.8;
}
/** Standing fighters breathe from the feet up. */
function breathe(u: Entity, clock: number, pose: CharacterMotion) {
  const breath = Math.sin(clock * 2.4 + u.id * 1.7);
  pose.sy += breath * 0.03;
  pose.sx -= breath * 0.012;
}
/**
 * A body at the height of its blow. `reach` (board units) and `lean` (radians) point towards
 * the target, `rise` lifts the body, `sx` and `sy` stretch it.
 */
type Blow = { reach: number; lean: number; rise: number; sx: number; sy: number };
const CLUB_SWING: Blow = { reach: 6, lean: -0.13, rise: 0, sx: 0.07, sy: -0.05 },
  QUICK_SLASH: Blow = { reach: 6, lean: -0.08, rise: 0, sx: 0.08, sy: -0.05 },
  STOMP: Blow = { reach: 0, lean: -0.04, rise: 5, sx: 0.05, sy: 0 },
  SHIELD_BLOCK: Blow = { reach: 0, lean: -0.09, rise: 0, sx: 0, sy: 0 },
  // Archers, tanks and the like: a short recoil.
  RECOIL: Blow = { reach: -2.5, lean: 0, rise: 0, sx: -0.06, sy: 0.05 };
const BLOWS: Partial<Record<Entity['kind'], Blow>> = {
  club: CLUB_SWING,
  bat: CLUB_SWING,
  hero: CLUB_SWING,
  knight: CLUB_SWING,
  twohead: CLUB_SWING,
  mutantRock: CLUB_SWING,
  ninja: QUICK_SLASH,
  raptor: QUICK_SLASH,
  dragon: { reach: 0, lean: 0, rise: 2, sx: 0.09, sy: -0.05 },
  dino: STOMP,
  trex: STOMP,
  spinosaurus: STOMP,
  triceratops: { reach: 5, lean: 0.045, rise: 0, sx: 0, sy: 0 },
  stegosaurus: { reach: -3, lean: 0.07, rise: 0, sx: 0, sy: 0 },
  mutantStretch: { reach: 3, lean: 0, rise: 0, sx: 0.14, sy: -0.08 },
  // A bite: the snake stretches towards its prey.
  snake: { reach: 5, lean: 0, rise: 0, sx: 0.1, sy: -0.06 },
};
/** A shield bearer only leans when it blocks; its own blow is a plain recoil. */
function blowOf(u: Entity, action: CharacterAction): Blow {
  if (u.kind === 'shield') return action.kind === 'block' ? SHIELD_BLOCK : RECOIL;
  return BLOWS[u.kind] ?? RECOIL;
}
/** The swing rises and falls once over `SWING_SECONDS`, towards the side of the blow. */
function strike(u: Entity, action: CharacterAction, pose: CharacterMotion) {
  const t = Math.min(1, action.age / SWING_SECONDS),
    swing = Math.sin(Math.PI * t),
    facing = blowFacing(u.facing, action),
    blow = blowOf(u, action);
  pose.dx += facing * swing * blow.reach;
  pose.angle += facing * swing * blow.lean;
  pose.dy -= swing * blow.rise;
  pose.sx += swing * blow.sx;
  pose.sy += swing * blow.sy;
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
  else if (u.state === 'move') fly(u, clock, pose);
  if (action) strike(u, action, pose);
  // A blow or a step replaces the breath.
  else if (u.state !== 'move' && !walking) breathe(u, clock, pose);
  return pose;
}
