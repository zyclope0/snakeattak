import { enemies as enemyTypes } from '../enemies.ts';
import { flyingVariant } from '../flying.ts';
import { BOSS_COURT, COURT_HEAL, COURT_SLOTS } from '../bossCourt.ts';
import { ensureBossState } from '../boss.ts';
import type { EnemyKind } from '../enemies.ts';
import { dodgesOf, leapsOf } from '../enemyAbilities.ts';
import {
  variantFor,
  spawnDelay,
  entryLane,
  wavePattern,
  eggIncubation,
  waveEggCount,
  MAX_WAVE_EGGS,
} from '../waves.ts';
import { LANE_COUNT } from '../gameConstants.ts';
import { LANES } from '../ai.ts';
import { TOTAL_WAVES, waveStats } from '../data.ts';
import { missionWave } from '../missions.ts';
import type { MissionWave } from '../missions.ts';
import type { Entity, Egg } from './state.ts';
import { addEffect, createEntity, nextRandom } from './state.ts';
import { DEN_EXIT_X } from './field.ts';
import { pickLane } from './movement.ts';
import type { Game } from '../game.ts';
import type { LateEggRule } from '../balanceRevision.ts';
import * as TEXT from '../texts/fr/battle.ts';

/** On even waves, one snake in three is a sturdier one. */
const STURDY_HP_FACTOR = 1.6;
/** Snakes hatched from an egg are smaller than those of the wave. */
const HATCHLING_HP_FACTOR = 0.75;
const HATCHLING_SPACING = 12;

function spawnSnake(
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
  const dodges = boss ? 0 : dodgesOf(variant);
  if (dodges) e.dodges = dodges;
  const leaps = boss ? 0 : leapsOf(variant);
  if (leaps) e.leaps = leaps;
  e.lane = lane;
  e.boss = boss;
  ensureBossState(e, game.tuning);
  game.enemies.push(e);
  return e;
}
/** Fait entrer le prochain serpent de la vague quand son délai est écoulé. */
export function spawnNext(game: Game, dt: number) {
  if (game.status !== 'fighting' || game.remaining <= 0) return;
  game.spawnTimer -= dt;
  if (game.spawnTimer > 0) return;
  const plan = game.mission
    ? missionWave(game.mission, game.wave, game.tuning.tacticalRulesEnabled)
    : null;
  const stats = game.strengthen(plan?.stats ?? waveStats(game.snakeWave));
  const withCourt = kingBringsCourt(game);
  const boss = isKingSlot(game, withCourt);
  const index = Math.max(0, stats.count - game.remaining);
  const variant = slotVariant(game, plan, index, boss);
  const lane = chooseEntryLane(game, index, boss, variant === 'flying');
  const entry = spawnSnake(
    game,
    DEN_EXIT_X,
    LANES[lane],
    lane,
    stats.hp * game.caprice.hp * slotHpFactor(game, boss),
    boss,
    variant,
  );
  if (!boss) hardenShell(game, entry, index);
  if (withCourt) {
    spawnCourt(game, entry, stats.hp * game.caprice.hp);
    game.remaining = 0;
    game.message = TEXT.leRoiArriveAvecSaGardeEtUnSoigneur;
  } else game.remaining--;
  game.spawnTimer = plan
    ? plan.cadence[index % plan.cadence.length] * game.caprice.cadence
    : spawnDelay(game.snakeWave, index);
}
function kingBringsCourt(game: Game): boolean {
  // The king of a voyage of version 2 comes with his court too, at the end of its last stage.
  if (game.stage?.court) return game.wave === game.totalWaves && game.remaining <= COURT_SLOTS;
  return (
    game.tuning.tacticalRulesEnabled &&
    !game.mission &&
    game.wave === TOTAL_WAVES &&
    game.remaining <= COURT_SLOTS
  );
}
/**
 * The king closes the classic adventure, a mission whose caprice calls for it, and the
 * last stage of a voyage.
 */
function isKingSlot(game: Game, withCourt: boolean): boolean {
  if (game.mission) {
    const invited = game.caprice.king || !!game.stage?.king;
    return invited && game.wave === game.totalWaves && (game.remaining === 1 || withCourt);
  }
  return game.wave === TOTAL_WAVES && (game.remaining === 1 || withCourt);
}
function slotVariant(
  game: Game,
  plan: MissionWave | null,
  index: number,
  boss: boolean,
): EnemyKind {
  if (boss) return 'normal';
  if (plan) return plan.composition[index];
  const base = variantFor(game.snakeWave, game.remaining, game.balanceRevision);
  return game.tuning.tacticalRulesEnabled
    ? flyingVariant(base, game.difficultyWave, game.remaining)
    : base;
}
/** Draws the lane (one random draw), then lets the wave's scripted approach overrule it. */
function chooseEntryLane(game: Game, index: number, boss: boolean, airborne: boolean): number {
  const picked = pickLane(game, boss, undefined, undefined, airborne);
  // A lure pot already tempted the pick: the script must not send the snake elsewhere.
  const proposed =
    game.feast?.flavor === 'lure' ? picked : entryLane(game.difficultyWave, index, picked);
  return game.enemyLanes.includes(proposed) ? proposed : picked;
}
function slotHpFactor(game: Game, boss: boolean): number {
  if (boss) return game.tuning.bossHpMultiplier;
  return game.difficultyWave % 2 === 0 && game.remaining % 3 === 0 ? STURDY_HP_FACTOR : 1;
}
/** Caprice: one snake in N comes in a shell. */
function hardenShell(game: Game, snake: Entity, index: number) {
  const shellEvery = game.caprice.shellEvery;
  if (!shellEvery || index % shellEvery !== shellEvery - 1) return;
  snake.hp *= game.caprice.shellHp;
  snake.maxHp *= game.caprice.shellHp;
  snake.shell = true;
}
/** The guards and the healer enter beside the king and take the wave's last slots. */
function spawnCourt(game: Game, king: Entity, hp: number) {
  for (const member of BOSS_COURT) {
    const escort = spawnSnake(
      game,
      king.x + member.offsetX,
      king.y + member.offsetY,
      king.lane,
      hp * member.hpFactor,
      false,
      member.variant,
    );
    escort.court = {
      bossId: king.id,
      role: member.role,
      charges: member.role === 'healer' ? COURT_HEAL.charges : 0,
      cool: 0,
    };
  }
}

/**
 * Eggs laid at the start of a wave. A mission plans them; the classic adventure draws each
 * lane, then each incubation, from the game's generator: two draws per egg, in that order.
 */
export function layWaveEggs(game: Game, plan: MissionWave | null): Egg[] {
  if (plan)
    return plan.eggs.map((egg) => ({
      ...egg,
      id: ++game.nextId,
      y: LANES[egg.lane],
      duration: egg.hatchIn,
    }));
  const wave = game.snakeWave;
  return Array.from({ length: waveEggCount(wave) }, (_, i) => {
    const pickedLane = Math.floor(nextRandom(game) * LANE_COUNT),
      lane = wavePattern(wave) === 'brood' ? i % LANE_COUNT : pickedLane,
      duration = eggIncubation(wave, i, nextRandom(game));
    return {
      id: ++game.nextId,
      x: 252 + i * 48,
      y: LANES[lane],
      lane,
      hatchIn: duration,
      duration,
      count: 2,
    };
  });
}
/**
 * The egg of a wave that drags on (third balance revision): one draw for its lane. It lies
 * past the eggs of the wave, which take the first three places.
 */
export function layLateEgg(game: Game, rule: LateEggRule, index: number): Egg {
  const lane = Math.floor(nextRandom(game) * LANE_COUNT);
  return {
    id: ++game.nextId,
    x: 252 + (MAX_WAVE_EGGS + index) * 48,
    y: LANES[lane],
    lane,
    hatchIn: rule.hatchIn,
    duration: rule.hatchIn,
    count: rule.count,
  };
}
/** Éclosion des œufs arrivés à terme. */
export function hatchEggs(game: Game, dt: number) {
  if (game.status !== 'fighting') return;
  for (const egg of game.eggs) {
    egg.hatchIn -= dt;
    if (egg.hatchIn <= 0) hatch(game, egg);
  }
  game.eggs = game.eggs.filter((e) => e.hatchIn > 0);
}
function hatch(game: Game, egg: Egg) {
  for (let i = 0; i < egg.count; i++)
    spawnSnake(
      game,
      egg.x + i * HATCHLING_SPACING,
      egg.y,
      egg.lane,
      game.strengthen(waveStats(game.difficultyWave)).hp * HATCHLING_HP_FACTOR * game.caprice.hp,
      false,
    );
  game.hatched += egg.count;
  addEffect(game, egg, egg, 'hit');
  game.message = TEXT.desOeufsOntEclosDeNouveauxSerpents;
}
