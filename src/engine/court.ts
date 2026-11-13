import { enemies as enemyTypes } from '../enemies.ts';
import { BOSS_COURT, tickCourtHeal } from '../bossCourt.ts';
import type { CourtState } from '../bossCourt.ts';
import {
  ensureBossState,
  cancelBossShot,
  bossHeadsHealth,
  healBossHeads,
  tickBossHeads,
  bossShotAttack,
} from '../boss.ts';
import type { BossState } from '../boss.ts';
import { defenseRole } from '../defenders.ts';
import type { Kind } from '../data.ts';
import type { Entity } from './state.ts';
import { distance, closerTo, addEffect, forgetPath } from './state.ts';
import { BRIDGE_END_X, CAMP_RIGHT, CONTACT_RANGE, routeStages } from './field.ts';
import { moveUnit } from './movement.ts';
import { damageAlly } from './damage.ts';
import type { Game } from '../game.ts';

/** A guard only bites allies that came this close to the king. */
const GUARD_LEASH = 150;
/** A guard busy biting leaves its place only when the king is further than this. */
const GUARD_RECALL_DISTANCE = 130;
const GUARD_BITE_INTERVAL = 1.25;
/** The court walks a little faster than the wave, to keep up with the king. */
const COURT_PACE = 1.15;
/** Close enough to its place beside the king: the escort stops walking. */
const FORMATION_TOLERANCE = 18;
/** The court never follows the king off the left edge of the board. */
const COURT_MIN_X = 36;
/** The hybrid head spits weaker than the shooting head: 10 damage where it does 18. */
const HYBRID_SHOT_FACTOR = 10 / 18;

/** Protections et têtes du roi : décomptes de chaque pas. */
export function tickBosses(game: Game, dt: number) {
  for (const e of game.enemies) {
    if (e.hp <= 0) {
      cancelBossShot(e.bossState);
      continue;
    }
    const state = ensureBossState(e, game.tuning);
    if (!state) continue;
    state.breakFlash = Math.max(0, state.breakFlash - dt);
    tickBossHeads(state, dt);
  }
}
/**
 * A member of the king's court: heals, guards and keeps its place beside the king.
 * False for any other snake, and once the king is dead: the caller then moves it as usual.
 */
export function updateCourt(
  game: Game,
  unit: Entity,
  dt: number,
  speed: number,
  damage: number,
): boolean {
  const court = unit.court;
  if (!court) return false;
  if (court.role === 'healer') healCourt(game, unit, court, dt);
  const king = game.enemies.find((e) => e.id === court.bossId && e.hp > 0);
  if (!king) {
    if (!unit.courtReleased) releaseFromCourt(game, unit);
    return false;
  }
  const target = court.role === 'guard' ? guardTarget(game, unit, king) : undefined;
  if (target && unit.cool <= 0) {
    damageAlly(game, unit, target, damage * enemyTypes[unit.variant].damage, false);
    unit.cool = GUARD_BITE_INTERVAL;
    unit.state = 'attack';
  }
  const place = courtPlace(unit, court, king);
  if (
    (!target || distance(unit, king) > GUARD_RECALL_DISTANCE) &&
    distance(unit, place) > FORMATION_TOLERANCE
  )
    moveUnit(game, unit, place, speed * COURT_PACE, dt, false);
  else if (unit.state !== 'heal') unit.state = target ? 'attack' : 'idle';
  unit.lane = king.lane;
  return true;
}
function healCourt(game: Game, healer: Entity, court: CourtState, dt: number) {
  const proposal = tickCourtHeal(court, dt, healer, game.enemies);
  if (!proposal) return;
  const patient = proposal.target;
  if (patient.bossState?.heads) {
    healBossHeads(patient.bossState, proposal.amount);
    patient.hp = bossHeadsHealth(patient.bossState);
  } else patient.hp = Math.min(patient.maxHp, patient.hp + proposal.amount);
  addEffect(game, healer, patient, 'heal');
  healer.state = 'heal';
}
/** Without its king, an escort joins the road at the next stage ahead of it. */
function releaseFromCourt(game: Game, unit: Entity) {
  const stages = routeStages(game.level);
  unit.stage = stages.findIndex((x) => x > unit.x + 2);
  if (unit.stage < 0) unit.stage = stages.length - 1;
  unit.turnY = null;
  forgetPath(unit);
  unit.courtReleased = true;
}
function guardTarget(game: Game, guard: Entity, king: Entity): Entity | undefined {
  return game.units
    .filter(
      (u) => u.hp > 0 && distance(u, guard) <= CONTACT_RANGE && distance(u, king) <= GUARD_LEASH,
    )
    .sort((a, b) => closerTo(guard, a, b))[0];
}
/** The escort's place in the formation: guards on both sides, the healer behind. */
function courtPlace(unit: Entity, court: CourtState, king: Entity) {
  const definition = court.role === 'healer' ? BOSS_COURT[2] : BOSS_COURT[unit.id % 2];
  return {
    x: Math.max(COURT_MIN_X, Math.min(CAMP_RIGHT, king.x + definition.offsetX)),
    y: king.y + definition.offsetY,
  };
}

/** Sort order: allies that shoot from afar before the others. */
export function shootersFirst(a: Entity, b: Entity) {
  return (
    (defenseRole(a.kind as Kind) === 'ranged' ? 0 : 1) -
    (defenseRole(b.kind as Kind) === 'ranged' ? 0 : 1)
  );
}
/** The king's announced spit: aim at an ally, wait for the windup, then hit that spot. */
export function updateBossShot(game: Game, e: Entity, dt: number) {
  const state = e.bossState;
  if (!game.tuning.bossEnabled || !e.boss || !state || e.x < BRIDGE_END_X) return;
  state.shotCooldown = Math.max(0, state.shotCooldown - dt);
  if (state.shotTargetId !== null) landBossShot(game, e, state, dt);
  else aimBossShot(game, e, state);
}
/** The spit lands where it was aimed: allies who walked away are safe. */
function landBossShot(game: Game, king: Entity, state: BossState, dt: number) {
  state.windup = Math.max(0, state.windup - dt);
  if (state.windup > 1e-9) return;
  const point = { x: state.targetX, y: state.targetY };
  const factor = state.shotHead === 'hybrid' ? HYBRID_SHOT_FACTOR : 1;
  for (const target of game.units) {
    if (target.hp <= 0 || distance(target, point) > game.tuning.bossShotRadius) continue;
    damageAlly(game, king, target, game.tuning.bossShotDamage * factor, true);
  }
  state.shotsFired++;
  cancelBossShot(state);
}
function aimBossShot(game: Game, king: Entity, state: BossState) {
  const contact = game.units.some((u) => u.hp > 0 && distance(u, king) <= CONTACT_RANGE);
  const attack = state.heads ? bossShotAttack(state, contact) : undefined;
  if ((state.heads ? !attack : state.shotCooldown > 0) || game.tuning.bossShotDamage === 0) return;
  const target = game.units
    .filter((u) => u.hp > 0 && distance(u, king) <= game.tuning.bossShotRange)
    .sort((a, b) => shootersFirst(a, b) || closerTo(king, a, b))[0];
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
