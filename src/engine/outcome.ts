import { chapterIndex, chapterStars, freshCampaign } from '../campaignRules.ts';
import { cancelBossShot } from '../boss.ts';
import { missionById } from '../missions.ts';
import { isMilestone } from '../rewards.ts';
import type { Milestone } from '../rewards.ts';
import { CRYSTAL_MAX, TOTAL_WAVES, WAVES_PER_CHAPTER } from '../gameConstants.ts';
import { BOON_STEPS } from '../boons.ts';
import { addEffect } from './state.ts';
import { normalizeCamp } from './camp.ts';
import { climbOut } from './swim.ts';
import type { WaveNumbers } from './enemyTurn.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/battle.ts';
import { fill } from '../texts/fill.ts';

/** Coins earned for a defeated snake, and for the king. */
const SNAKE_BOUNTY = 12;
const KING_BOUNTY = 90;

/** Pièces des serpents vaincus, puis retrait des morts. */
export function collectFallen(game: Game) {
  for (const e of game.enemies)
    // A snake that reached the crystal has maxHp 0: it pays nothing.
    if (e.hp <= 0 && e.maxHp > 0) {
      game.gold += e.boss ? KING_BOUNTY : SNAKE_BOUNTY;
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
  if (game.base <= 0) loseCamp(game);
  else if (waveCleared(game)) closeWave(game, stats.reward);
}
function loseCamp(game: Game) {
  game.status = 'lost';
  for (const e of game.enemies) cancelBossShot(e.bossState);
  game.feast = null;
  game.encouragementRemaining = 0;
  game.message = TEXT.leCampEstTombeUneAutreStrategie;
}
/** Every snake of the wave has entered and fallen, and no egg is left to hatch. */
function waveCleared(game: Game): boolean {
  return (
    game.status === 'fighting' &&
    game.remaining === 0 &&
    game.enemies.length === 0 &&
    game.eggs.length === 0
  );
}
function closeWave(game: Game, reward: number) {
  climbOut(game);
  game.feast = null;
  game.encouragementRemaining = 0;
  if (!game.mission && game.wave % WAVES_PER_CHAPTER === 0) {
    const chapter = chapterIndex(game.wave);
    game.campaign.chapterStars[chapter] = chapterStars(game.campaign.chapterMin[chapter]);
  }
  game.gold += reward + game.boonLevel('rente') * BOON_STEPS.rente;
  // « Le cristal solide » mends the crystal a little after every wave.
  game.base = Math.min(CRYSTAL_MAX, game.base + game.boonLevel('solide') * BOON_STEPS.solide);
  if (game.endless && game.wave === game.totalWaves) return nextRound(game);
  game.status = game.wave === game.totalWaves ? 'won' : 'preparing';
  if (game.status === 'won') {
    game.message = victoryMessage(game);
    return;
  }
  if (!game.mission && isMilestone(game.wave)) openChapter(game, game.wave);
  game.message = fill(TEXT.vagueRepousseeNPiecesPrepareLa, reward);
}
/** After waves 4 and 8 the map changes and a reward card is offered, once per milestone. */
function openChapter(game: Game, milestone: Milestone) {
  normalizeCamp(game);
  if (!game.offerAnswered(milestone)) game.rewards.pending = milestone;
}
/**
 * The king of the endless adventure has fallen: the same camp goes back to the first wave,
 * one king more, and a card is offered. The hero keeps his training; the chapter stars of
 * the round start again.
 */
function nextRound(game: Game) {
  const { training } = game.campaign;
  Object.assign(game.campaign, freshCampaign(), { training });
  game.kings++;
  game.wave = 0;
  game.status = 'preparing';
  openChapter(game, TOTAL_WAVES);
  game.message = TEXT.kingSnakeEstVaincuIlRevientPlusFort;
}
function victoryMessage(game: Game): string {
  return game.mission
    ? fill(TEXT.victoireNNEtoiles, missionById(game.mission.missionId)!.name, game.missionStars)
    : TEXT.victoireKingSnakeEstVaincu;
}
