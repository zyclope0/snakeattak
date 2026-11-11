import { enemies as enemyTypes } from '../enemies.ts';
import { BOSS_COURT, tickCourtHeal } from '../bossCourt.ts';
import {
  ensureBossState,
  cancelBossShot,
  bossHeadsHealth,
  healBossHeads,
  tickBossHeads,
  bossShotAttack,
} from '../boss.ts';
import { routeJunctions } from '../routes.ts';
import { defenseRole } from '../defenders.ts';
import type { Kind } from '../data.ts';
import type { Entity } from './state.ts';
import { distance, addEffect } from './state.ts';
import { moveUnit } from './movement.ts';
import { damageAlly } from './damage.ts';
import type { Game } from '../game.ts';

/** Protections et têtes du roi : décomptes de chaque pas. */
export function tickBosses(game: Game, dt: number) {
  for (const e of game.enemies) {
    if (e.hp <= 0) cancelBossShot(e.bossState);
    else {
      const state = ensureBossState(e, game.tuning);
      if (state) {
        state.breakFlash = Math.max(0, state.breakFlash - dt);
        tickBossHeads(state, dt);
      }
    }
  }
}
export function updateCourt(
  game: Game,
  unit: Entity,
  dt: number,
  speed: number,
  damage: number,
): boolean {
  const court = unit.court;
  if (!court) return false;
  if (court.role === 'healer') {
    const proposal = tickCourtHeal(court, dt, unit, game.enemies);
    if (proposal) {
      if (proposal.target.bossState?.heads) {
        healBossHeads(proposal.target.bossState, proposal.amount);
        proposal.target.hp = bossHeadsHealth(proposal.target.bossState);
      } else
        proposal.target.hp = Math.min(proposal.target.maxHp, proposal.target.hp + proposal.amount);
      addEffect(game, unit, proposal.target, 'heal');
      unit.state = 'heal';
    }
  }
  const king = game.enemies.find((e) => e.id === court.bossId && e.hp > 0);
  if (!king) {
    if (!unit.courtReleased) {
      const [first, second] = routeJunctions(game.level);
      unit.stage = [first, 444, 612, second, 828, 972, 1032].findIndex((x) => x > unit.x + 2);
      if (unit.stage < 0) unit.stage = 6;
      unit.turnY = null;
      unit.path = [];
      unit.nav = 0;
      unit.courtReleased = true;
    }
    return false;
  }
  const definition = court.role === 'healer' ? BOSS_COURT[2] : BOSS_COURT[unit.id % 2];
  const target =
    court.role === 'guard'
      ? game.units
          .filter((u) => u.hp > 0 && distance(u, unit) <= 44 && distance(u, king) <= 150)
          .sort((a, b) => distance(a, unit) - distance(b, unit) || a.id - b.id)[0]
      : undefined;
  if (target && unit.cool <= 0) {
    damageAlly(game, unit, target, damage * enemyTypes[unit.variant].damage, false);
    unit.cool = 1.25;
    unit.state = 'attack';
  }
  const goal = {
    x: Math.max(36, Math.min(984, king.x + definition.offsetX)),
    y: king.y + definition.offsetY,
  };
  if ((!target || distance(unit, king) > 130) && distance(unit, goal) > 18)
    moveUnit(game, unit, goal, speed * 1.15, dt, false);
  else if (unit.state !== 'heal') unit.state = target ? 'attack' : 'idle';
  unit.lane = king.lane;
  return true;
}
export function updateBossShot(game: Game, e: Entity, dt: number) {
  const state = e.bossState;
  if (!game.tuning.bossEnabled || !e.boss || !state || e.x < 576) return;
  state.shotCooldown = Math.max(0, state.shotCooldown - dt);
  if (state.shotTargetId !== null) {
    state.windup = Math.max(0, state.windup - dt);
    if (state.windup > 1e-9) return;
    const point = { x: state.targetX, y: state.targetY };
    for (const target of game.units) {
      if (target.hp <= 0 || distance(target, point) > game.tuning.bossShotRadius) continue;
      const factor = state.shotHead === 'hybrid' ? 10 / 18 : 1;
      damageAlly(game, e, target, game.tuning.bossShotDamage * factor, true);
    }
    state.shotsFired++;
    cancelBossShot(state);
    return;
  }
  const contact = game.units.some((u) => u.hp > 0 && distance(u, e) <= 44);
  const attack = state.heads ? bossShotAttack(state, contact) : undefined;
  if ((state.heads ? !attack : state.shotCooldown > 0) || game.tuning.bossShotDamage === 0) return;
  const target = game.units
    .filter((u) => u.hp > 0 && distance(u, e) <= game.tuning.bossShotRange)
    .sort(
      (a, b) =>
        (defenseRole(a.kind as Kind) === 'ranged' ? 0 : 1) -
          (defenseRole(b.kind as Kind) === 'ranged' ? 0 : 1) ||
        distance(a, e) - distance(b, e) ||
        a.id - b.id,
    )[0];
  if (!target) return;
  if (state.heads && attack) {
    state.shotHead = attack.head;
    state.heads[attack.head].cool = game.tuning.bossShotInterval * attack.intervalFactor;
  }
  state.targetX = target.x;
  state.targetY = target.y;
  state.shotTargetId = target.id;
  state.windup = game.tuning.bossShotWindup;
  state.shotCooldown = game.tuning.bossShotInterval;
}
