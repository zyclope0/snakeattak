import { ensureMedical, consumeBandage, tickMedical } from '../healing.ts';
import { canHitFlying, isFlying } from '../flying.ts';
import { HERO_FORCE_FACTOR } from '../campaignRules.ts';
import { umbrellaCover } from '../combatRules.ts';
import { canEngage, defenseGoal, defenseRole, reliefTeams } from '../defenders.ts';
import { healAmount, attackDamage } from '../unitRules.ts';
import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import { nearestCampPoint } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import type { Entity, Effect } from './state.ts';
import { distance, closerTo, addEffect, faceToward, forgetPath } from './state.ts';
import { CAMP_FRONT_X, CAMP_LEFT, CAMP_RIGHT, CRYSTAL_ALERT_X, standable } from './field.ts';
import { moveUnit, returnHome } from './movement.ts';
import { hitEnemy } from './damage.ts';
import type { Game } from '../game.ts';

/** Helpers sent to each blocked snake this step, by snake id (see `reliefTeams`). */
type Relief = Map<number, Set<number>>;
/** How many allies already chose each snake during this step, by snake id. */
type Assignments = Map<number, number>;

/** Healers refill their bandages beside the crystal, one spot per healer. */
const SUPPLY_Y = 324;
const SUPPLY_SPACING = 36;
const SUPPLY_REACH = 26;
/** A healer looks after the wounded this far around its own placement. */
const CARE_RADIUS = 320;
/** A new target must beat the current one by this much: no flip-flop between equals. */
const TARGET_LOCK_MARGIN = 12;
/** Mobile allies spread out: each ally already on a snake makes it less attractive. */
const CROWDED_TARGET_PENALTY = 120;
/** Ninjas hunt the spitters that have entered the camp. */
const SPITTER_HUNT_RANGE = 280;
const SPITTER_HUNT_BONUS = 180;
const TANK_BLAST_RADIUS = 75;
const DRAGON_FIRE_RADIUS = 65;
/** An umbrella lets a quarter of a blow through. */
const UMBRELLA_DAMAGE_FACTOR = 0.25;
/** The second head of a two-headed knight reaches a little further than the first. */
const SECOND_HEAD_EXTRA_REACH = 20;
/** Encouraged allies wait less between two blows. */
const ENCOURAGED_RATE_FACTOR = 0.85;
/** Allies closer than this push each other apart, at this speed. */
const SEPARATION_DISTANCE = 36;
const SEPARATION_SPEED = 22;

/** Lower is more urgent. */
function threat(u: Entity, e: Entity) {
  // Protect home lane, but intercept nearby intruders and urgent threats to the crystal.
  return (
    distance(u, e) +
    Math.abs(u.homeY - e.y) * 0.35 -
    (e.x >= CRYSTAL_ALERT_X ? 1000 : 0) -
    Math.max(0, e.x - 780) * 0.5
  );
}
function supplyGoal(game: Game, unit: Entity): Point {
  return nearestCampPoint(
    { x: CAMP_RIGHT, y: SUPPLY_Y + ((unit.id % 3) - 1) * SUPPLY_SPACING },
    game.level,
  );
}
/** False while a healer without bandages walks to the crystal or refills there. */
function medicalReady(game: Game, unit: Entity, dt: number): boolean {
  if (!game.tuning.tacticalRulesEnabled) return true;
  const medical = ensureMedical(unit);
  if (!medical) return false;
  if (medical.phase === 'ready') return true;
  const goal = supplyGoal(game, unit);
  const atBase = distance(unit, goal) <= SUPPLY_REACH;
  tickMedical(medical, dt, atBase, unit.kind as Kind);
  if (!atBase) moveUnit(game, unit, goal, kinds[unit.kind as Kind].speed, dt);
  return false;
}
/** Tour des alliés : soins, choix de cible, déplacement et attaque. */
export function updateAllies(game: Game, dt: number) {
  const relief = reliefTeams(game.units, game.enemies);
  const assignments: Assignments = new Map();
  for (const u of game.units) {
    if (u.hp <= 0) continue;
    u.cool -= dt;
    u.guardCool = Math.max(0, u.guardCool - dt);
    u.state = 'idle';
    if (u.confusedFor > 0) continue;
    if (healAmount(u.kind as Kind) > 0) tendWounded(game, u, dt);
    else if (kinds[u.kind as Kind].damage) fight(game, u, dt, relief, assignments);
  }
}

/** A healer's turn: refill, walk to the most wounded ally in its sector, bandage it. */
function tendWounded(game: Game, healer: Entity, dt: number) {
  if (!medicalReady(game, healer, dt)) return;
  const d = kinds[healer.kind as Kind];
  const injured = mostWounded(game, healer);
  if (!injured) {
    returnHome(game, healer, d.speed, dt);
    return;
  }
  if (distance(healer, injured) > d.range) {
    moveUnit(game, healer, injured, d.speed, dt);
    return;
  }
  if (healer.cool > 0) return;
  if (game.tuning.tacticalRulesEnabled && (!healer.medical || !consumeBandage(healer.medical)))
    return;
  injured.hp = Math.min(injured.maxHp, injured.hp + healAmount(healer.kind as Kind));
  healer.cool = d.rate;
  healer.state = 'heal';
  addEffect(game, healer, injured, 'heal');
}
function mostWounded(game: Game, healer: Entity): Entity | undefined {
  // The sector is centred on the placement, not on where the healer walked to.
  const home = { x: healer.homeX, y: healer.homeY };
  return game.units
    .filter(
      (v) => v.kind !== 'wall' && v.hp > 0 && v.hp < v.maxHp && distance(home, v) <= CARE_RADIUS,
    )
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0];
}

/** A fighter's turn: choose a snake, then walk towards it or strike it. */
function fight(game: Game, u: Entity, dt: number, relief: Relief, assignments: Assignments) {
  const d = kinds[u.kind as Kind];
  const target = chooseTarget(game, u, relief, assignments);
  if (!target) {
    returnHome(game, u, d.speed, dt);
    return;
  }
  if (u.targetId !== target.id) {
    u.targetId = target.id;
    forgetPath(u);
  }
  assignments.set(target.id, (assignments.get(target.id) ?? 0) + 1);
  faceToward(u, target);
  if (distance(u, target) > d.range)
    moveUnit(game, u, approachGoal(game, u, target, relief), d.speed, dt);
  else if (u.cool <= 0) strike(game, u, target);
}
function chooseTarget(
  game: Game,
  u: Entity,
  relief: Relief,
  assignments: Assignments,
): Entity | undefined {
  const score = (e: Entity) => targetScore(u, e, assignments);
  let candidates = game.enemies.filter(
    (e) =>
      e.hp > 0 &&
      (!isFlying(e) || canHitFlying(u.kind)) &&
      (canEngage(u, e) || relief.get(e.id)?.has(u.id)),
  );
  if (u.kind === 'ninja') {
    const urgent = candidates.filter((e) => e.x >= CRYSTAL_ALERT_X);
    if (urgent.length) candidates = urgent;
  }
  const best = candidates.sort((a, b) => score(a) - score(b) || a.id - b.id)[0];
  const retained = candidates.find((e) => e.id === u.targetId);
  // Keep a viable opponent for small score changes. Crystal danger's 1000-point
  // priority and the mobile assignment penalty still immediately break the lock.
  return best && retained && score(retained) <= score(best) + TARGET_LOCK_MARGIN ? retained : best;
}
function targetScore(u: Entity, e: Entity, assignments: Assignments) {
  return (
    threat(u, e) +
    (defenseRole(u.kind as Kind) === 'mobile'
      ? CROWDED_TARGET_PENALTY * (assignments.get(e.id) ?? 0)
      : 0) -
    (huntsSpitter(u, e) ? SPITTER_HUNT_BONUS : 0)
  );
}
function huntsSpitter(u: Entity, e: Entity) {
  return (
    u.kind === 'ninja' &&
    e.variant === 'spitter' &&
    e.x >= CAMP_FRONT_X &&
    distance(u, e) <= SPITTER_HUNT_RANGE
  );
}
/** Where to walk: straight to a blocked snake when sent as relief, else the unit's post. */
function approachGoal(game: Game, u: Entity, target: Entity, relief: Relief): Point {
  return relief.get(target.id)?.has(u.id)
    ? { x: Math.max(CAMP_FRONT_X, Math.min(CAMP_RIGHT, target.x)), y: target.y }
    : defenseGoal(u, target, game.level);
}

/** One attack: the blow or blast, then the cooldown and the effect the scene shows. */
function strike(game: Game, u: Entity, target: Entity) {
  const damage =
    attackDamage(u.kind as Kind, u.charge, game.tuning.mutantDamageFactor) *
    (u.kind === 'hero' && game.campaign.training === 'force' ? HERO_FORCE_FACTOR : 1);
  // Where the blow is aimed, kept before it lands: a ninja snake that lets it pass leaves
  // from there, and the blow is drawn where it missed, not where the snake came back.
  const aimed = { id: target.id, x: target.x, y: target.y };
  if (u.kind === 'dragon' || u.kind === 'tank') blast(game, u, target, damage);
  else {
    strikeOne(game, u, target, damage);
    if (u.kind === 'twohead') strikeWithSecondHead(game, u, target, damage);
  }
  u.charge = 0;
  u.cool =
    kinds[u.kind as Kind].rate * (game.encouragementRemaining > 0 ? ENCOURAGED_RATE_FACTOR : 1);
  u.state = 'attack';
  addEffect(game, u, aimed, attackEffect(u.kind));
}
/** Dragon fire and tank shells hit every snake around the target. */
export function blast(game: Game, u: Entity, target: Entity, damage: number) {
  const radius = u.kind === 'tank' ? TANK_BLAST_RADIUS : DRAGON_FIRE_RADIUS;
  // The blast stays where it fell, even when the snake it was aimed at comes back elsewhere.
  const centre = { x: target.x, y: target.y };
  for (const enemy of game.enemies)
    if (enemy.hp > 0 && distance(enemy, centre) < radius)
      hitEnemy(
        game,
        u,
        enemy,
        damage * (enemy === target ? 1 : game.tuning.splashSecondaryFactor),
        enemy === target,
      );
}
function strikeOne(game: Game, u: Entity, target: Entity, damage: number) {
  const covered = umbrellaCover(u, target);
  hitEnemy(game, u, target, damage * (covered ? UMBRELLA_DAMAGE_FACTOR : 1));
  if (covered) addEffect(game, u, target, 'block');
}
/** The two-headed knight also bites the nearest other snake on the ground. */
function strikeWithSecondHead(game: Game, u: Entity, target: Entity, damage: number) {
  const reach = kinds[u.kind as Kind].range + SECOND_HEAD_EXTRA_REACH;
  const second = game.enemies
    .filter((e) => e !== target && e.hp > 0 && !isFlying(e) && distance(e, u) <= reach)
    .sort((a, b) => closerTo(u, a, b))[0];
  if (!second) return;
  hitEnemy(game, u, second, damage);
  addEffect(game, u, second, 'hit');
}
function attackEffect(kind: Entity['kind']): Effect['kind'] {
  if (kind === 'dragon') return 'fire';
  if (kind === 'tank') return 'shell';
  if (kind === 'archer') return 'arrow';
  return 'hit';
}

/** Légère séparation locale ; ne pousse ni les palissades ni à travers un obstacle. */
export function separateAllies(game: Game, dt: number) {
  const units = game.units;
  for (let i = 0; i < units.length; i++)
    for (let j = i + 1; j < units.length; j++) {
      const a = units[i],
        b = units[j],
        d = distance(a, b);
      if (d >= SEPARATION_DISTANCE) continue;
      // Two allies on the same point part along the x axis.
      const dx = d ? (a.x - b.x) / d : 1,
        dy = d ? (a.y - b.y) / d : 0;
      nudge(game, a, dx, dy, dt);
      nudge(game, b, -dx, -dy, dt);
    }
}
/** Moves one ally a step along (dx, dy), unless that leaves the camp or enters an obstacle. */
function nudge(game: Game, u: Entity, dx: number, dy: number, dt: number) {
  if (u.kind === 'wall') return;
  const x = u.x + dx * SEPARATION_SPEED * dt,
    y = u.y + dy * SEPARATION_SPEED * dt;
  if (x >= CAMP_LEFT && x <= CAMP_RIGHT && standable(x, y, game.level)) {
    u.x = x;
    u.y = y;
  }
}
