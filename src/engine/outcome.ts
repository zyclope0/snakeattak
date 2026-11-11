import { chapterIndex, chapterStars } from '../campaignRules.ts';
import { cancelBossShot } from '../boss.ts';
import { missionById } from '../missions.ts';
import { addEffect } from './state.ts';
import { normalizeCamp } from './camp.ts';
import type { WaveNumbers } from './enemyTurn.ts';
import type { Game } from '../game.ts';

/** Pièces des serpents vaincus, puis retrait des morts. */
export function collectFallen(game: Game) {
  for (const e of game.enemies)
    if (e.hp <= 0 && e.maxHp > 0) {
      game.gold += e.boss ? 90 : 12;
      game.kills++;
      addEffect(game, e, e, 'gold');
    }
  game.units = game.units.filter((u) => u.hp > 0);
  game.enemies = game.enemies.filter((e) => e.hp > 0);
}
/** Fin de pas : encouragement, défaite, vague repoussée ou victoire. */
export function resolveWave(game: Game, dt: number, stats: WaveNumbers) {
  game.encouragementRemaining = Math.max(0, game.encouragementRemaining - dt);
  if (game.encouragementRemaining <= 1e-9) game.encouragementRemaining = 0;
  if (game.base <= 0) {
    game.status = 'lost';
    for (const e of game.enemies) cancelBossShot(e.bossState);
    game.feast = null;
    game.encouragementRemaining = 0;
    game.message = 'Le camp est tombé… Une autre stratégie ?';
  } else if (
    game.status === 'fighting' &&
    game.remaining === 0 &&
    game.enemies.length === 0 &&
    game.eggs.length === 0
  ) {
    game.feast = null;
    game.encouragementRemaining = 0;
    if (!game.mission && game.wave % 4 === 0) {
      const chapter = chapterIndex(game.wave);
      game.campaign.chapterStars[chapter] = chapterStars(game.campaign.chapterMin[chapter]);
    }
    game.gold += stats.reward;
    game.status = game.wave === game.totalWaves ? 'won' : 'preparing';
    if (!game.mission && game.status === 'preparing' && (game.wave === 4 || game.wave === 8)) {
      normalizeCamp(game);
      if (!game.rewards.choices.some((c) => c.milestone === game.wave))
        game.rewards.pending = game.wave;
    }
    game.message =
      game.status === 'won'
        ? game.mission
          ? `Victoire ! ${missionById(game.mission.missionId)!.name} : ${game.missionStars} étoiles !`
          : 'Victoire ! Le roi à trois têtes est vaincu !'
        : `Vague repoussée ! +${stats.reward} pièces. Prépare la suite.`;
  }
}
