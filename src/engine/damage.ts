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

export function enemyPace(game: Game, e: Entity) {
  return (
    (e.boss ? 0.8 : enemySpeed(e.variant, game.time)) * (e.shell ? game.caprice.shellSpeed : 1)
  );
}
/** Tous les coups alliés passent ici : attribution du tueur, zone et seconde tête comprises. */
export function hitEnemy(game: Game, source: Entity, target: Entity, damage: number) {
  if (target.hp <= 0) return;
  const state = ensureBossState(target, game.tuning);
  const unabsorbed = state
    ? absorbBossHit(
        state,
        damage,
        defenseRole(source.kind as Kind) === 'ranged'
          ? game.tuning.bossShieldRangedFactor
          : game.tuning.bossShieldMeleeFactor,
      )
    : damage;
  const actual =
    unabsorbed * (1 - enemyArmor(target)) * (target.shell ? 1 - game.caprice.shellArmor : 1);
  if (state?.heads) {
    receiveBossDamage(state, actual, defenseRole(source.kind as Kind) === 'ranged');
    target.hp = bossHeadsHealth(state);
  } else target.hp -= actual;
  if (target.hp > 0) ensureBossState(target, game.tuning);
  if (target.hp <= 0) {
    cancelBossShot(target.bossState);
    const reaction = deathRetaliation(target);
    if (reaction > 0) {
      // Exactly 2/3 PV: this reaction bypasses armour and cannot hit a bystander.
      source.hp -= reaction;
      addEffect(game, target, source, 'hit');
    }
  }
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
    (target.kind === 'hero' && game.campaign.training === 'guard' ? 0.85 : 1) *
    (guard ? 1 - GUARD_REDUCTION : 1);
  if (guard) {
    guard.guardCool = GUARD_COOLDOWN;
    addEffect(game, guard, target, 'block');
  }
  addEffect(game, source, target, projectile ? 'poison' : 'hit');
}
