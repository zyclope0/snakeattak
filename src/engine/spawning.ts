import { enemies as enemyTypes } from '../enemies.ts';
import { flyingVariant } from '../flying.ts';
import { BOSS_COURT, COURT_HEAL } from '../bossCourt.ts';
import { ensureBossState } from '../boss.ts';
import type { EnemyKind } from '../enemies.ts';
import { variantFor, spawnDelay, entryLane } from '../waves.ts';
import { LANES } from '../ai.ts';
import { TOTAL_WAVES, waveStats } from '../data.ts';
import { missionWave } from '../missions.ts';
import { addEffect, createEntity } from './state.ts';
import { pickLane } from './movement.ts';
import type { Game } from '../game.ts';

export function spawnSnake(
  game: Game,
  x: number,
  y: number,
  lane: number,
  hp: number,
  boss: boolean,
  variant: EnemyKind = 'normal',
) {
  const e = createEntity(game, 'snake', x, y, hp * (boss ? 1 : enemyTypes[variant].hp));
  e.variant = variant;
  e.lane = lane;
  e.boss = boss;
  ensureBossState(e, game.tuning);
  game.enemies.push(e);
  return e;
}
/** Fait entrer le prochain serpent de la vague quand son délai est écoulé. */
export function spawnNext(game: Game, dt: number) {
  if (game.status === 'fighting' && game.remaining > 0) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const plan = game.mission
        ? missionWave(game.mission, game.wave, game.tuning.tacticalRulesEnabled)
        : null;
      const stats = plan?.stats ?? waveStats(game.wave);
      const courtEntry =
        game.tuning.tacticalRulesEnabled &&
        !game.mission &&
        game.wave === TOTAL_WAVES &&
        game.remaining <= 4;
      const boss =
        (!game.mission && game.wave === TOTAL_WAVES && (game.remaining === 1 || courtEntry)) ||
        (!!game.mission &&
          game.caprice.king &&
          game.wave === game.totalWaves &&
          game.remaining === 1);
      const index = Math.max(0, stats.count - game.remaining);
      const baseVariant = boss
        ? 'normal'
        : plan
          ? plan.composition[index]
          : variantFor(game.wave, game.remaining);
      const variant =
        game.tuning.tacticalRulesEnabled && !boss && !plan
          ? flyingVariant(baseVariant, game.difficultyWave, game.remaining)
          : baseVariant;
      const pickedLane = pickLane(game, boss, undefined, undefined, variant === 'flying');
      const proposedLane =
        game.feast?.flavor === 'lure'
          ? pickedLane
          : entryLane(game.difficultyWave, index, pickedLane);
      const lane = game.enemyLanes.includes(proposedLane) ? proposedLane : pickedLane;
      const entry = spawnSnake(
        game,
        108,
        LANES[lane],
        lane,
        stats.hp *
          game.caprice.hp *
          (boss
            ? game.tuning.bossHpMultiplier
            : game.difficultyWave % 2 === 0 && game.remaining % 3 === 0
              ? 1.6
              : 1),
        boss,
        variant,
      );
      const shellEvery = game.caprice.shellEvery;
      if (shellEvery && !boss && index % shellEvery === shellEvery - 1) {
        entry.hp *= game.caprice.shellHp;
        entry.maxHp *= game.caprice.shellHp;
        entry.shell = true;
      }
      if (courtEntry) {
        for (const member of BOSS_COURT) {
          const escort = spawnSnake(
            game,
            entry.x + member.offsetX,
            entry.y + member.offsetY,
            lane,
            stats.hp * member.hpFactor,
            false,
            member.variant,
          );
          escort.court = {
            bossId: entry.id,
            role: member.role,
            charges: member.role === 'healer' ? COURT_HEAL.charges : 0,
            cool: 0,
          };
        }
        game.remaining = 0;
        game.message = 'Le roi arrive avec sa garde et un soigneur ! Chaque tête a son rôle.';
      } else game.remaining--;
      game.spawnTimer = plan
        ? plan.cadence[index % plan.cadence.length] * game.caprice.cadence
        : spawnDelay(game.wave, index);
    }
  }
}
/** Éclosion des œufs arrivés à terme. */
export function hatchEggs(game: Game, dt: number) {
  if (game.status === 'fighting') {
    for (const egg of game.eggs) {
      egg.hatchIn -= dt;
      if (egg.hatchIn <= 0) {
        for (let i = 0; i < egg.count; i++)
          spawnSnake(
            game,
            egg.x + i * 12,
            egg.y,
            egg.lane,
            waveStats(game.difficultyWave).hp * 0.75 * game.caprice.hp,
            false,
          );
        game.hatched += egg.count;
        addEffect(game, egg, egg, 'hit');
        game.message = 'Des œufs ont éclos ! De nouveaux serpents arrivent.';
      }
    }
    game.eggs = game.eggs.filter((e) => e.hatchIn > 0);
  }
}
