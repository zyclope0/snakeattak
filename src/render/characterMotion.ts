import type { Entity, Effect } from '../game.ts';
export type CharacterAction = { age: number; kind: Effect['kind'] };
export type CharacterMotion = { dx: number; dy: number; angle: number; sx: number; sy: number };
/** Bounded poses only: collisions, damage and route decisions never depend on animation. */
export function characterMotion(
  u: Entity,
  clock: number,
  action: CharacterAction | undefined,
  reduced: boolean,
): CharacterMotion {
  const pose = { dx: 0, dy: 0, angle: 0, sx: 1, sy: 1 };
  if (reduced) return pose;
  if (u.state === 'move') {
    const stride = Math.sin(clock * (u.kind === 'ninja' || u.kind === 'raptor' ? 16 : 9) + u.id);
    pose.dy = stride * (u.kind === 'snake' ? 2.4 : 1.1);
    pose.angle = stride * (u.kind === 'snake' ? 0.035 : 0.018);
    if (u.kind === 'dragon') pose.dy += Math.sin(clock * 7 + u.id) * 1.8;
  }
  if (!action) return pose;
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
    pose.dx += u.facing * swing * 4;
    pose.angle -= u.facing * swing * 0.13;
  } else if (u.kind === 'ninja' || u.kind === 'raptor') {
    pose.dx += u.facing * swing * 6;
    pose.angle -= u.facing * swing * 0.08;
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
  }
  return pose;
}
