/** Serializable combat state, present only on the enhanced three-headed boss. */
export type BossHeadId = 'guard' | 'ranged' | 'hybrid';
export type BossHead = { hp: number; maxHp: number; cool: number };
export type BossState = {
  heads?: Record<BossHeadId, BossHead>;
  shotHead?: BossHeadId | null;
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
  if (tuning.tacticalRulesEnabled && !state.heads) {
    const head = (fraction: number, cool: number): BossHead => ({
      hp: Math.min(body.hp, body.maxHp) * fraction,
      maxHp: body.maxHp * fraction,
      cool,
    });
    state.heads = {
      guard: head(0.5, 0),
      ranged: head(0.2, tuning.bossShotInterval),
      hybrid: head(0.3, 0),
    };
  }
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
  const fullyAbsorbed = damage * factor <= state.shield;
  const absorbed = Math.min(state.shield, damage * factor);
  state.shield = Math.max(0, state.shield - absorbed);
  if (state.shield === 0) {
    state.shieldsBroken++;
    state.breakFlash = 0.45;
  }
  if (fullyAbsorbed) return 0;
  return Math.max(0, damage - absorbed / factor);
}
export function cancelBossShot(state: BossState | undefined) {
  if (!state) return;
  state.windup = 0;
  state.shotTargetId = null;
  state.shotHead = null;
}

export const BOSS_HEAD_IDS: readonly BossHeadId[] = ['guard', 'ranged', 'hybrid'];

/** Body HP is derived from these reserves; never subtract the same impact twice. */
export function bossHeadsHealth(state: BossState): number {
  return state.heads ? BOSS_HEAD_IDS.reduce((sum, id) => sum + state.heads![id].hp, 0) : 0;
}

/** Damage has already crossed the shield and armour before reaching a head. */
export function receiveBossDamage(state: BossState, damage: number, sourceRanged: boolean): number {
  if (!state.heads || !Number.isFinite(damage) || damage <= 0) return 0;
  const order: BossHeadId[] = sourceRanged
    ? ['ranged', 'hybrid', 'guard']
    : ['guard', 'hybrid', 'ranged'];
  let remaining = damage;
  for (const id of order) {
    const head = state.heads[id];
    const hit = Math.min(head.hp, remaining);
    head.hp -= hit;
    remaining -= hit;
    if (head.hp <= 0 && state.shotHead === id) cancelBossShot(state);
    if (remaining <= 0) break;
  }
  return damage - remaining;
}

/** A fallen head stays fallen, even if the healer has bandages left. */
export function healBossHeads(state: BossState, amount: number): number {
  if (!state.heads || !Number.isFinite(amount) || amount <= 0) return 0;
  const living = BOSS_HEAD_IDS.map((id) => state.heads![id]).filter((head) => head.hp > 0);
  const missing = living.reduce((sum, head) => sum + head.maxHp - head.hp, 0);
  if (missing <= 0) return 0;
  const healed = Math.min(amount, missing);
  for (const head of living) head.hp += healed * ((head.maxHp - head.hp) / missing);
  return healed;
}

/** Called exactly once by the simulation step; presentation owns no combat timers. */
export function tickBossHeads(state: BossState, dt: number): void {
  if (!state.heads || !Number.isFinite(dt) || dt <= 0) return;
  for (const id of BOSS_HEAD_IDS) state.heads[id].cool = Math.max(0, state.heads[id].cool - dt);
}

export function bossMeleeAttacks(state: BossState) {
  const roles = [
    { head: 'guard' as const, damageFactor: 1.2, cooldown: 1.3 },
    { head: 'hybrid' as const, damageFactor: 0.8, cooldown: 1.7 },
  ];
  return roles.filter(({ head }) => {
    const h = state.heads?.[head];
    return h && h.hp > 0 && h.cool <= 0;
  });
}

export function bossShotAttack(state: BossState, inContact: boolean) {
  const roles = [
    { head: 'ranged' as const, damageFactor: 1, intervalFactor: 1 },
    { head: 'hybrid' as const, damageFactor: 10 / 18, intervalFactor: 10 / 7 },
  ];
  return roles.find(({ head }) => {
    const h = state.heads?.[head];
    return h && h.hp > 0 && h.cool <= 0 && (head !== 'hybrid' || !inContact);
  });
}
