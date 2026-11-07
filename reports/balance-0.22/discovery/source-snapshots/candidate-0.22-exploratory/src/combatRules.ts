import type { Entity } from './game.ts';

export const GUARD_RADIUS = 72;
export const GUARD_COOLDOWN = 3;
export const GUARD_REDUCTION = 0.6;
/** A leaf stops frontal arrows during approach. Fire, shells and melee pass normally. */
export function umbrellaCover(source: Entity, target: Entity): boolean {
  return (
    source.kind === 'archer' &&
    !target.boss &&
    target.variant === 'umbrella' &&
    target.state === 'move' &&
    (source.x - target.x) * target.facing >= 0
  );
}
/** One living nearby protector per projectile, deterministic tie-break. */
export function coveringShield(units: readonly Entity[], target: Entity): Entity | undefined {
  return units
    .filter(
      (u) =>
        u.kind === 'shield' &&
        u.id !== target.id &&
        u.hp > 0 &&
        u.guardCool <= 0 &&
        Math.hypot(u.x - target.x, u.y - target.y) <= GUARD_RADIUS,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y) ||
        a.id - b.id,
    )[0];
}
