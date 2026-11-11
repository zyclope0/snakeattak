import { enemies as enemyTypes } from '../enemies.ts';
import { isFlying } from '../flying.ts';
import { chapterIndex } from '../campaignRules.ts';
import { cancelBossShot, bossMeleeAttacks } from '../boss.ts';
import { defenseRole } from '../defenders.ts';
import {
  RATTLE_RADIUS,
  RATTLE_COOLDOWN,
  CONFUSION_DURATION,
  CONFUSION_IMMUNITY,
} from '../enemyAbilities.ts';
import { LANES } from '../ai.ts';
import { waveStats } from '../data.ts';
import type { Kind } from '../data.ts';
import { distance, nextRandom } from './state.ts';
import { followRoute } from './movement.ts';
import { enemyPace, damageAlly } from './damage.ts';
import { updateCourt, updateBossShot } from './court.ts';
import type { Game } from '../game.ts';

export function updateConfusion(game: Game, dt: number) {
  for (const u of game.units) {
    u.confusedFor = Math.max(0, u.confusedFor - dt);
    u.confusionImmunity = Math.max(0, u.confusionImmunity - dt);
  }
  for (const e of game.enemies) {
    e.rattleCool = Math.max(0, e.rattleCool - dt);
    if (e.hp <= 0 || e.boss || e.variant !== 'rattlesnake' || e.rattleCool > 0) continue;
    let affected = false;
    for (const u of game.units)
      if (
        u.hp > 0 &&
        u.kind !== 'wall' &&
        u.confusionImmunity <= 0 &&
        distance(u, e) <= RATTLE_RADIUS
      ) {
        u.confusedFor = CONFUSION_DURATION;
        u.confusionImmunity = CONFUSION_IMMUNITY;
        u.targetId = null;
        u.path = [];
        u.nav = 0;
        affected = true;
      }
    if (affected) e.rattleCool = RATTLE_COOLDOWN;
  }
}
export type WaveNumbers = ReturnType<typeof waveStats>;
/** Tour des serpents : cour du roi, crachat, ponte, morsure, marche et entrée au camp. */
export function updateEnemies(game: Game, dt: number, stats: WaveNumbers) {
  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    e.cool -= dt;
    e.state = 'move';
    const enemyData = enemyTypes[e.variant];
    if (updateCourt(game, e, dt, stats.speed, stats.damage)) continue;
    updateBossShot(game, e, dt);
    if (e.boss && e.x >= 576) {
      e.broodCool -= dt;
      if (e.broodCool <= 0 && game.eggs.length < 6) {
        const lane = Math.floor(nextRandom(game) * 3);
        game.eggs.push({
          id: ++game.nextId,
          x: 300,
          y: LANES[lane],
          lane,
          hatchIn: 4,
          duration: 4,
          count: 2,
        });
        e.broodCool = 12;
        game.message = 'Le roi à trois têtes a pondu un nouvel œuf !';
      }
    }
    const attackRange = e.x >= 612 ? enemyData.range : 44;
    const target = (e.variant === 'courtHealer' ? [] : game.units)
      .filter((u) => u.hp > 0 && distance(u, e) < attackRange)
      .sort(
        (a, b) =>
          (e.variant === 'spitter'
            ? (defenseRole(a.kind as Kind) === 'ranged' ? 0 : 1) -
              (defenseRole(b.kind as Kind) === 'ranged' ? 0 : 1)
            : 0) ||
          distance(a, e) - distance(b, e) ||
          a.id - b.id,
      )[0];
    if (target) {
      e.state = 'attack';
      e.facing = target.x >= e.x ? 1 : -1;
      if (e.bossState?.heads) {
        for (const attack of bossMeleeAttacks(e.bossState)) {
          damageAlly(game, e, target, stats.damage * attack.damageFactor, false);
          e.bossState.heads[attack.head].cool = attack.cooldown;
        }
      } else if (e.cool <= 0) {
        damageAlly(
          game,
          e,
          target,
          stats.damage * (e.boss ? 2 : enemyData.damage),
          e.variant === 'spitter',
        );
        e.cool = e.variant === 'spitter' ? 1.5 : 1.05;
      }
      // Support can be bitten but never becomes an immortal roadblock.
      if (defenseRole(target.kind as Kind) === 'support' || isFlying(e)) {
        followRoute(game, e, stats.speed * enemyPace(game, e), dt);
        e.facing = target.x >= e.x ? 1 : -1;
        e.state = 'attack';
      }
    } else followRoute(game, e, stats.speed * enemyPace(game, e), dt);
    if (e.x > 1000) {
      const absorbed = e.boss ? 0 : Math.min(9, game.rewards.ward);
      game.rewards.ward -= absorbed;
      game.base = Math.max(0, game.base - (e.boss ? 100 : 9 - absorbed));
      if (game.mission) game.missionMinBase = Math.min(game.missionMinBase, game.base);
      else {
        const chapter = chapterIndex(game.wave);
        game.campaign.chapterMin[chapter] = Math.min(game.campaign.chapterMin[chapter], game.base);
      }
      e.hp = 0;
      e.maxHp = 0;
      cancelBossShot(e.bossState);
      game.message =
        absorbed > 0
          ? `La protection du cristal a absorbé ${absorbed} dégâts !`
          : 'Un serpent a atteint le camp !';
    }
  }
}
