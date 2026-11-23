import type { Entity } from '../game.ts';
import type { BalanceTuning } from '../balanceTuning.ts';
import { BOSS_HEAD_IDS } from '../boss.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import { clamp01 } from './clamp.ts';

/** Display data derived from the actual combat clock, never a second timer. */
export function bossReadout(entity: Entity, tuning: Readonly<BalanceTuning>) {
  const state = entity.bossState;
  if (!entity.boss || entity.hp <= 0 || !state || !tuning.bossEnabled) return null;
  const labels = { guard: TEXT.gardienne, ranged: TEXT.cracheuse, hybrid: TEXT.mixte };
  const heads = state.heads
    ? BOSS_HEAD_IDS.map((id) => {
        const h = state.heads![id];
        return {
          id,
          label: labels[id],
          hp: h.hp,
          maxHp: h.maxHp,
          ratio: h.maxHp > 0 ? clamp01(h.hp / h.maxHp) : 0,
          alive: h.hp > 0,
          active: h.hp > 0 && state.shotHead === id && state.windup > 0,
        };
      })
    : undefined;
  const shotAlive = !state.shotHead || !state.heads || state.heads[state.shotHead].hp > 0;
  return {
    heads,
    phase: state.phase,
    shieldRatio: state.shieldMax > 0 ? clamp01(state.shield / state.shieldMax) : 0,
    label: fill(
      TEXT.phaseN3N,
      state.phase,
      state.shield > 0 ? TEXT.protectionActive : TEXT.aDecouvert,
    ),
    shot:
      state.windup > 0 && shotAlive
        ? {
            x: state.targetX,
            y: state.targetY,
            radius: tuning.bossShotRadius,
            progress: clamp01(1 - state.windup / tuning.bossShotWindup),
          }
        : null,
    breakFlash: clamp01(state.breakFlash / 0.45),
  };
}
