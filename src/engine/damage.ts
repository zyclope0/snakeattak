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
import { addEffect } from './state.ts';
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
