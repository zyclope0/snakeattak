import {
  ensureBossState,
  absorbBossHit,
  cancelBossShot,
  receiveBossDamage,
  bossHeadsHealth,
} from '../boss.ts';
import { coveringShield, GUARD_COOLDOWN, GUARD_REDUCTION } from '../combatRules.ts';
import { defenseRole } from '../defenders.ts';
import { incomingDamage } from '../unitRules.ts';
import { enemyArmor, enemySpeed } from '../enemies.ts';
import { deathRetaliation } from '../enemyAbilities.ts';
import type { Kind } from '../data.ts';
import type { Entity } from './state.ts';
import { addEffect, forgetPath } from './state.ts';
import { ninjaTeleport } from '../balanceRevision.ts';
import { blocked } from '../navigation.ts';
import { CRYSTAL_X } from '../boardLandmarks.ts';
import type { Game } from '../game.ts';

/** The king walks slower than its wave. */
const KING_PACE = 0.8;
/** The hero trained in guard takes less from every blow. */
const HERO_GUARD_FACTOR = 0.85;

/** Walking speed of a snake, as a factor of its wave's speed. */
export function enemyPace(game: Game, e: Entity) {
  return (
    (e.boss ? KING_PACE : enemySpeed(e.variant, game.time)) *
    (e.shell ? game.caprice.shellSpeed : 1)
  );
}
/** Tous les coups alliés passent ici : attribution du tueur, zone et seconde tête comprises. */
export function hitEnemy(game: Game, source: Entity, target: Entity, damage: number) {
  if (target.hp <= 0) return;
  // A ninja snake lets its first blow pass; from the fifth revision on, it also comes back
  // behind the ally that struck it.
  if (target.dodges) {
    target.dodges--;
    teleportBehind(game, target, source);
    return;
  }
  const ranged = defenseRole(source.kind as Kind) === 'ranged';
  const state = ensureBossState(target, game.tuning);
  const unabsorbed = state
    ? absorbBossHit(
        state,
        damage,
        ranged ? game.tuning.bossShieldRangedFactor : game.tuning.bossShieldMeleeFactor,
      )
    : damage;
  const actual =
    unabsorbed * (1 - enemyArmor(target)) * (target.shell ? 1 - game.caprice.shellArmor : 1);
  if (state?.heads) {
    receiveBossDamage(state, actual, ranged);
    target.hp = bossHeadsHealth(state);
  } else target.hp -= actual;
  // A survivor may have crossed a health threshold: the king then raises a new shield.
  if (target.hp > 0) ensureBossState(target, game.tuning);
  else if (target.hp <= 0) retaliate(game, source, target);
}
/** Short of the crystal: a snake that came back there would reach it in the same step. */
const TELEPORT_CRYSTAL_GAP = 60;
/**
 * The ninja snake reappears on the back of the ally that struck it: the side that ally
 * does not face. Nearer places are tried when that one is a rock, the river or off the
 * board; when none is free, the snake stays where it is, as it did before.
 */
function teleportBehind(game: Game, snake: Entity, ally: Entity) {
  const rule = ninjaTeleport(game.balanceRevision);
  if (!rule || snake.boss) return;
  const back = -(ally.facing || 1);
  for (const share of [1, 0.75, 0.5])
    for (const lift of [0, -12, 12]) {
      const x = Math.min(ally.x + back * rule.behind * share, CRYSTAL_X - TELEPORT_CRYSTAL_GAP);
      const y = ally.y + lift;
      if (blocked(x, y, game.level)) continue;
      addEffect(game, snake, { x, y }, 'blink');
      snake.x = x;
      snake.y = y;
      forgetPath(snake);
      return;
    }
}
/** A snake that dies may strike back at the ally that killed it, and only at that one. */
function retaliate(game: Game, killer: Entity, fallen: Entity) {
  cancelBossShot(fallen.bossState);
  const reaction = deathRetaliation(fallen);
  if (reaction <= 0) return;
  // Exactly 2/3 PV: this reaction bypasses armour and cannot hit a bystander.
  killer.hp -= reaction;
  addEffect(game, fallen, killer, 'hit');
}
export function damageAlly(
  game: Game,
  source: Entity,
  target: Entity,
  damage: number,
  projectile: boolean,
) {
  const guard = projectile ? coveringShield(game.units, target) : undefined;
  target.hp -=
    incomingDamage(
      target.kind as Kind,
      damage * (source.shell && !source.boss ? (game.caprice.shellBite ?? 1) : 1),
    ) *
    (target.kind === 'hero' && game.campaign.training === 'guard' ? HERO_GUARD_FACTOR : 1) *
    (guard ? 1 - GUARD_REDUCTION : 1);
  if (guard) {
    guard.guardCool = GUARD_COOLDOWN;
    addEffect(game, guard, target, 'block');
  }
  addEffect(game, source, target, projectile ? 'poison' : 'hit');
}
