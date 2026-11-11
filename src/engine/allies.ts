import { ensureMedical, consumeBandage, tickMedical } from '../healing.ts';
import { canHitFlying, isFlying } from '../flying.ts';
import { HERO_FORCE_FACTOR } from '../campaignRules.ts';
import { umbrellaCover } from '../combatRules.ts';
import { canEngage, defenseGoal, defenseRole, reliefTeams } from '../defenders.ts';
import { healAmount, attackDamage } from '../unitRules.ts';
import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import { blocked, nearestCampPoint, CELL } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import type { Entity } from './state.ts';
import { distance, addEffect } from './state.ts';
import { moveUnit, returnHome } from './movement.ts';
import { hitEnemy } from './damage.ts';
import type { Game } from '../game.ts';

export function threat(game: Game, u: Entity, e: Entity) {
  // Protect home lane, but intercept nearby intruders and urgent threats to the crystal.
  return (
    distance(u, e) +
    Math.abs(u.homeY - e.y) * 0.35 -
    (e.x >= 900 ? 1000 : 0) -
    Math.max(0, e.x - 780) * 0.5
  );
}
export function supplyGoal(game: Game, unit: Entity): Point {
  return nearestCampPoint({ x: 984, y: 324 + ((unit.id % 3) - 1) * 36 }, game.level);
}
export function medicalReady(game: Game, unit: Entity, dt: number): boolean {
  if (!game.tuning.tacticalRulesEnabled) return true;
  const medical = ensureMedical(unit);
  if (!medical) return false;
  if (medical.phase === 'ready') return true;
  const goal = supplyGoal(game, unit);
  const atBase = distance(unit, goal) <= 26;
  tickMedical(medical, dt, atBase, unit.kind as Kind);
  if (!atBase) moveUnit(game, unit, goal, kinds[unit.kind as Kind].speed, dt);
  return false;
}
/** Tour des alliés : soins, choix de cible, déplacement et attaque. */
export function updateAllies(game: Game, dt: number) {
  const relief = reliefTeams(game.units, game.enemies);
  const assignments = new Map<number, number>();
  for (const u of game.units) {
    if (u.hp <= 0) continue;
    const d = kinds[u.kind as Kind];
    u.cool -= dt;
    u.guardCool = Math.max(0, u.guardCool - dt);
    u.state = 'idle';
    if (u.confusedFor > 0) continue;
    if (healAmount(u.kind as Kind) > 0) {
      if (!medicalReady(game, u, dt)) continue;
      const injured = game.units
        .filter(
          (v) =>
            v.kind !== 'wall' &&
            v.hp > 0 &&
            v.hp < v.maxHp &&
            distance({ x: u.homeX, y: u.homeY }, v) <= 320,
        )
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0];
      if (injured) {
        if (distance(u, injured) > d.range) moveUnit(game, u, injured, d.speed, dt);
        else if (u.cool <= 0) {
          if (game.tuning.tacticalRulesEnabled && (!u.medical || !consumeBandage(u.medical)))
            continue;
          injured.hp = Math.min(injured.maxHp, injured.hp + healAmount(u.kind as Kind));
          u.cool = d.rate;
          u.state = 'heal';
          addEffect(game, u, injured, 'heal');
        }
      } else returnHome(game, u, d.speed, dt);
      continue;
    }
    if (!d.damage) continue;
    const score = (e: Entity) =>
      threat(game, u, e) +
      (defenseRole(u.kind as Kind) === 'mobile' ? 120 * (assignments.get(e.id) ?? 0) : 0) -
      (u.kind === 'ninja' && e.variant === 'spitter' && e.x >= 612 && distance(u, e) <= 280
        ? 180
        : 0);
    let candidates = game.enemies.filter(
      (e) =>
        e.hp > 0 &&
        (!isFlying(e) || canHitFlying(u.kind)) &&
        (canEngage(u, e) || relief.get(e.id)?.has(u.id)),
    );
    if (u.kind === 'ninja') {
      const urgent = candidates.filter((e) => e.x >= 900);
      if (urgent.length) candidates = urgent;
    }
    let target = candidates.sort((a, b) => score(a) - score(b) || a.id - b.id)[0];
    const retained = candidates.find((e) => e.id === u.targetId);
    // Keep a viable opponent for small score changes. Crystal danger's 1000-point
    // priority and the mobile assignment penalty still immediately break the lock.
    if (target && retained && score(retained) <= score(target) + 12) target = retained;
    if (!target) {
      returnHome(game, u, d.speed, dt);
      continue;
    }
    if (u.targetId !== target.id) {
      u.targetId = target.id;
      u.path = [];
      u.nav = 0;
    }
    assignments.set(target.id, (assignments.get(target.id) ?? 0) + 1);
    u.facing = target.x >= u.x ? 1 : -1;
    if (distance(u, target) > d.range) {
      const goal = relief.get(target.id)?.has(u.id)
        ? { x: Math.max(612, Math.min(984, target.x)), y: target.y }
        : defenseGoal(u, target, game.level);
      moveUnit(game, u, goal, d.speed, dt);
    } else if (u.cool <= 0) {
      const damage =
        attackDamage(u.kind as Kind, u.charge, game.tuning.mutantDamageFactor) *
        (u.kind === 'hero' && game.campaign.training === 'force' ? HERO_FORCE_FACTOR : 1);
      if (u.kind === 'dragon' || u.kind === 'tank') {
        const radius = u.kind === 'tank' ? 75 : 65;
        for (const enemy of game.enemies)
          if (enemy.hp > 0 && distance(enemy, target) < radius)
            hitEnemy(
              game,
              u,
              enemy,
              damage * (enemy === target ? 1 : game.tuning.splashSecondaryFactor),
            );
      } else {
        const covered = umbrellaCover(u, target);
        hitEnemy(game, u, target, damage * (covered ? 0.25 : 1));
        if (covered) addEffect(game, u, target, 'block');
        if (u.kind === 'twohead') {
          const second = game.enemies
            .filter(
              (e) => e !== target && e.hp > 0 && !isFlying(e) && distance(e, u) <= d.range + 20,
            )
            .sort((a, b) => distance(a, u) - distance(b, u) || a.id - b.id)[0];
          if (second) {
            hitEnemy(game, u, second, damage);
            addEffect(game, u, second, 'hit');
          }
        }
      }
      u.charge = 0;
      u.cool = d.rate * (game.encouragementRemaining > 0 ? 0.85 : 1);
      u.state = 'attack';
      addEffect(
        game,
        u,
        target,
        u.kind === 'dragon'
          ? 'fire'
          : u.kind === 'tank'
            ? 'shell'
            : u.kind === 'archer'
              ? 'arrow'
              : 'hit',
      );
    }
  }
}
/** Légère séparation locale ; ne pousse ni les palissades ni à travers un obstacle. */
export function separateAllies(game: Game, dt: number) {
  for (let i = 0; i < game.units.length; i++)
    for (let j = i + 1; j < game.units.length; j++) {
      const a = game.units[i],
        b = game.units[j],
        d = distance(a, b);
      if (d >= 36) continue;
      const dx = d ? (a.x - b.x) / d : 1,
        dy = d ? (a.y - b.y) / d : 0;
      for (const [u, sign] of [
        [a, 1],
        [b, -1],
      ] as const) {
        if (u.kind === 'wall') continue;
        const x = u.x + dx * sign * 22 * dt,
          y = u.y + dy * sign * 22 * dt;
        if (
          x >= 600 &&
          x <= 984 &&
          !blocked(x, y, game.level) &&
          !blocked(
            Math.floor(x / CELL) * CELL + CELL / 2,
            Math.floor(y / CELL) * CELL + CELL / 2,
            game.level,
          )
        ) {
          u.x = x;
          u.y = y;
        }
      }
    }
}
