/** Serializable combat state, present only on the enhanced three-headed boss. */
export type BossState = {
  phase: 1 | 2 | 3;
  shield: number;
  shieldMax: number;
  shieldsBroken: number;
  shotsFired: number;
  shotCooldown: number;
  windup: number;
  targetX: number;
  targetY: number;
  shotTargetId: number | null;
  breakFlash: number;
};

import type { BalanceTuning } from './balanceTuning.ts';
type BossBody = {
  boss: boolean;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  bossState?: BossState;
};
/** Lazy creation also supports rule fixtures that promote an existing snake. */
export function ensureBossState(
  body: BossBody,
  tuning: Readonly<BalanceTuning>,
): BossState | undefined {
  if (!body.boss || !tuning.bossEnabled || body.hp <= 0) return;
  const state = (body.bossState ??= {
    phase: 1,
    shield: body.maxHp * tuning.bossShieldFraction,
    shieldMax: body.maxHp * tuning.bossShieldFraction,
    shieldsBroken: 0,
    shotsFired: 0,
    shotCooldown: tuning.bossShotInterval,
    windup: 0,
    targetX: body.x,
    targetY: body.y,
    shotTargetId: null,
    breakFlash: 0,
  });
  const phase = body.hp <= body.maxHp * 0.25 ? 3 : body.hp <= body.maxHp * 0.6 ? 2 : 1;
  if (phase > state.phase) {
    state.phase = phase;
    state.shield = state.shieldMax;
  }
  return state;
}
/** Convert shield overflow back to the original damage units before ordinary armour. */
export function absorbBossHit(state: BossState, damage: number, factor: number): number {
  if (state.shield <= 0) return damage;
  const absorbed = Math.min(state.shield, damage * factor);
  state.shield = Math.max(0, state.shield - absorbed);
  if (state.shield === 0) {
    state.shieldsBroken++;
    state.breakFlash = 0.45;
  }
  return Math.max(0, damage - absorbed / factor);
}
export function cancelBossShot(state: BossState | undefined) {
  if (!state) return;
  state.windup = 0;
  state.shotTargetId = null;
}
