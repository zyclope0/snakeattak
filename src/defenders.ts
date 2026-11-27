import { kinds } from './data.ts';
import { diving } from './engine/swim.ts';
import { enemies } from './enemies.ts';
import type { Kind } from './data.ts';
import type { Entity } from './game.ts';
import { fartherThan, nearestCampPoint } from './navigation.ts';
import type { Point } from './navigation.ts';
import { levelForWave } from './levels.ts';
import type { Level } from './levels.ts';
import * as TEXT from './texts/fr/battle.ts';
import {
  CAMP_FRONT_X,
  CAMP_LEFT,
  CAMP_RIGHT,
  CONTACT_RANGE,
  CRYSTAL_ALERT_X,
} from './boardLandmarks.ts';
export type DefenseRole = 'guard' | 'ranged' | 'mobile' | 'support' | 'fixed';
export function defenseRole(kind: Kind): DefenseRole {
  if (kind === 'wall') return 'fixed';
  if (kind === 'ninja' || kind === 'cavalry' || kind === 'raptor' || kind === 'triceratops')
    return 'mobile';
  if (kind === 'medic' || kind === 'nurse') return 'support';
  if (kind === 'archer' || kind === 'dragon' || kind === 'tank') return 'ranged';
  return 'guard';
}
export function canEngage(unit: Entity, enemy: Entity): boolean {
  if (enemy.hp <= 0) return false;
  // Immediate self-defence remains possible at the lip of a bridge.
  const dx = unit.x - enemy.x,
    dy = unit.y - enemy.y;
  if (
    (!fartherThan(dx, dy, CONTACT_RANGE) && Math.hypot(dx, dy) <= CONTACT_RANGE) ||
    rangedThreat(unit, enemy)
  )
    return true;
  if (enemy.x < CAMP_LEFT) return false;
  return (
    defenseRole(unit.kind as Kind) === 'mobile' ||
    enemy.x >= CRYSTAL_ALERT_X ||
    Math.abs(enemy.y - unit.homeY) <= 108
  );
}
function rangedThreat(unit: Entity, enemy: Entity): boolean {
  return (
    enemy.x >= CAMP_FRONT_X &&
    enemies[enemy.variant].range > CONTACT_RANGE &&
    Math.hypot(unit.x - enemy.x, unit.y - enemy.y) <= enemies[enemy.variant].range + 24
  );
}
export function defenseGoal(unit: Entity, enemy: Entity, level: Level = levelForWave(1)): Point {
  const role = defenseRole(unit.kind as Kind);
  if (
    role === 'mobile' ||
    rangedThreat(unit, enemy) ||
    (role === 'guard' &&
      Math.hypot(unit.x - enemy.x, unit.y - enemy.y) <= kinds[unit.kind as Kind].range + 72)
  )
    return { x: Math.max(CAMP_FRONT_X, Math.min(CAMP_RIGHT, enemy.x)), y: enemy.y };
  const range = kinds[unit.kind as Kind].range;
  // A held front needs covering fire. A rear battery may approach a stopped
  // opponent far enough to shoot, while keeping its lane and weapon depth.
  const advance = role === 'ranged' && enemy.state === 'attack' ? Math.max(48, range * 0.85) : 48;
  const x =
    role === 'ranged'
      ? Math.max(unit.homeX - advance, Math.min(unit.homeX + 96, enemy.x + range * 0.75))
      : Math.max(unit.homeX - 96, enemy.x);
  return nearestCampPoint(
    {
      x: Math.max(CAMP_LEFT, Math.min(CAMP_RIGHT, x)),
      y: role === 'ranged' && enemy.x < CRYSTAL_ALERT_X ? unit.homeY : enemy.y,
    },
    level,
  );
}
export function roleDescription(kind: Kind): string {
  const role = defenseRole(kind);
  if (kind === 'ninja') return TEXT.chasseurMobileDelogeLesCracheursEt;
  return role === 'mobile'
    ? TEXT.renfortMobileIntervientSurLesTrois
    : role === 'ranged'
      ? TEXT.tireDepuisSonSecteurEtRiposteAu
      : role === 'support'
        ? TEXT.soigneAutourDeSonPlacementRetourne
        : role === 'fixed'
          ? TEXT.defenseFixeResteASonPlacement
          : TEXT.gardeSonSecteurPuisRevientASon;
}
/** Two nearby fighters relieve a real blockade; the rest keep their sectors. */
/** Closest to `target` first; the lower id breaks a tie, so the order never depends on the list. */
const closer = (a: Entity, da: number, b: Entity, db: number) =>
  da < db || (da === db && a.id < b.id);
/**
 * The two fighters closest to `target`, closest first, leaving out `skip`: what sorting them
 * all by that order and keeping the first two gave, found in one pass (26 November 2026).
 */
function nearestTwo(fighters: readonly Entity[], target: Point, skip: (u: Entity) => boolean) {
  let first: Entity | undefined,
    second: Entity | undefined,
    d1 = Infinity,
    d2 = Infinity;
  for (const u of fighters) {
    if (skip(u)) continue;
    const d = Math.hypot(u.x - target.x, u.y - target.y);
    if (!first || closer(u, d, first, d1)) {
      second = first;
      d2 = d1;
      first = u;
      d1 = d;
    } else if (!second || closer(u, d, second, d2)) {
      second = u;
      d2 = d;
    }
  }
  return second ? [first!, second] : first ? [first] : [];
}
export function reliefTeams(units: Entity[], enemies: Entity[]): Map<number, Set<number>> {
  const teams = new Map<number, Set<number>>();
  const bridgeTeams = new Map<number, Set<number>>();
  // A spinosaurus away in the river (seventh revision) is sent nowhere else.
  const fighters = units.filter((u) => u.hp > 0 && kinds[u.kind as Kind]?.damage > 0 && !diving(u));
  for (const e of enemies)
    if (e.hp > 0 && e.state === 'attack') {
      const engaged = new Set(
        fighters.filter(
          (u) =>
            canEngage(u, e) && Math.hypot(u.x - e.x, u.y - e.y) <= kinds[u.kind as Kind].range + 20,
        ),
      );
      const crowded = e.x < CAMP_FRONT_X && crowd(enemies, e) >= 3;
      if (engaged.size && !crowded) continue;
      if (crowded && bridgeTeams.has(e.lane)) {
        teams.set(e.id, bridgeTeams.get(e.lane)!);
        continue;
      }
      const primary = crowded ? nearestTwo([...engaged], e, () => false)[0] : undefined;
      const nearest = nearestTwo(fighters, e, (u) => (crowded ? u === primary : engaged.has(u)));
      teams.set(e.id, new Set(nearest.map((u) => u.id)));
      if (crowded) bridgeTeams.set(e.lane, teams.get(e.id)!);
    }
  return teams;
}
/** Living snakes closer than 84 to `e`, itself included; counting stops at three. */
function crowd(enemies: readonly Entity[], e: Entity): number {
  let count = 0;
  for (const v of enemies)
    if (v.hp > 0 && Math.hypot(v.x - e.x, v.y - e.y) < 84 && ++count >= 3) break;
  return count;
}
