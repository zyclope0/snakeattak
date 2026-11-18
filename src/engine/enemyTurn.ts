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
  biteDamage,
} from '../enemyAbilities.ts';
import { LANES } from '../ai.ts';
import { waveStats } from '../data.ts';
import type { Kind } from '../data.ts';
import type { Entity } from './state.ts';
import { distance, closerTo, nextRandom, faceToward, forgetPath } from './state.ts';
import { BRIDGE_END_X, CAMP_FRONT_X, CONTACT_RANGE, CRYSTAL_X } from './field.ts';
import { followRoute } from './movement.ts';
import { leapOverLine } from './leap.ts';
import { enemyPace, damageAlly } from './damage.ts';
import { updateCourt, updateBossShot, shootersFirst } from './court.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/battle.ts';
import { fill } from '../texts/fill.ts';
import { LANE_COUNT } from '../gameConstants.ts';

/** The king lays a two-snake egg in the snakes' half, while fewer than six eggs wait. */
const ROYAL_EGG_INTERVAL = 12;
const ROYAL_EGG_X = 300;
const ROYAL_EGG_INCUBATION = 4;
const MAX_EGGS = 6;
/** Seconds between two bites, and between two spits. */
const BITE_INTERVAL = 1.05;
const SPIT_INTERVAL = 1.5;
/** A bite of the king, in bites of an ordinary snake of the wave. */
const KING_BITE_FACTOR = 2;
/** What the crystal loses when a snake, or the king, gets in. */
const CRYSTAL_DAMAGE = 9;
const KING_CRYSTAL_DAMAGE = 100;

export function updateConfusion(game: Game, dt: number) {
  for (const u of game.units) {
    u.confusedFor = Math.max(0, u.confusedFor - dt);
    u.confusionImmunity = Math.max(0, u.confusionImmunity - dt);
  }
  for (const e of game.enemies) {
    e.rattleCool = Math.max(0, e.rattleCool - dt);
    if (e.hp <= 0 || e.boss || e.variant !== 'rattlesnake' || e.rattleCool > 0) continue;
    if (rattle(game, e)) e.rattleCool = RATTLE_COOLDOWN;
  }
}
/** Confuses the allies within earshot; true when at least one of them heard the rattle. */
function rattle(game: Game, snake: Entity): boolean {
  let heard = false;
  for (const u of game.units)
    if (
      u.hp > 0 &&
      u.kind !== 'wall' &&
      u.confusionImmunity <= 0 &&
      distance(u, snake) <= RATTLE_RADIUS
    ) {
      u.confusedFor = CONFUSION_DURATION;
      u.confusionImmunity = CONFUSION_IMMUNITY;
      u.targetId = null;
      forgetPath(u);
      heard = true;
    }
  return heard;
}
export type WaveNumbers = ReturnType<typeof waveStats>;
/** Tour des serpents : cour du roi, crachat, ponte, morsure, marche et entrée au camp. */
export function updateEnemies(game: Game, dt: number, stats: WaveNumbers) {
  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    e.cool -= dt;
    e.state = 'move';
    if (updateCourt(game, e, dt, stats.speed, stats.damage)) continue;
    updateBossShot(game, e, dt);
    if (e.boss && e.x >= BRIDGE_END_X) brood(game, e, dt);
    leapOverLine(game, e);
    const target = biteTarget(game, e);
    if (target) bite(game, e, target, dt, stats);
    else march(game, e, dt, stats);
    if (e.x > CRYSTAL_X) enterCrystal(game, e);
  }
}
function march(game: Game, e: Entity, dt: number, stats: WaveNumbers) {
  followRoute(game, e, stats.speed * enemyPace(game, e), dt);
}
/** The king's egg laying: one random draw per egg, for its lane. */
function brood(game: Game, king: Entity, dt: number) {
  king.broodCool -= dt;
  if (king.broodCool > 0 || game.eggs.length >= MAX_EGGS) return;
  const lane = Math.floor(nextRandom(game) * LANE_COUNT);
  game.eggs.push({
    id: ++game.nextId,
    x: ROYAL_EGG_X,
    y: LANES[lane],
    lane,
    hatchIn: ROYAL_EGG_INCUBATION,
    duration: ROYAL_EGG_INCUBATION,
    count: 2,
  });
  king.broodCool = ROYAL_EGG_INTERVAL;
  game.message = TEXT.kingSnakeAPonduUnNouvelOeuf;
}
/** The ally within reach to bite: the nearest, except that spitters aim at shooters first. */
function biteTarget(game: Game, e: Entity): Entity | undefined {
  if (e.variant === 'courtHealer') return undefined;
  // Snakes only use a long reach once inside the camp.
  const reach = e.x >= CAMP_FRONT_X ? enemyTypes[e.variant].range : CONTACT_RANGE;
  // After its leap, a grasshopper snake bites only the allies between it and the crystal:
  // the line it passed stays behind it (the child's rule).
  const onlyAhead = e.leaps === 0;
  return game.units
    .filter((u) => u.hp > 0 && distance(u, e) < reach && (!onlyAhead || u.x >= e.x))
    .sort((a, b) => (e.variant === 'spitter' ? shootersFirst(a, b) : 0) || closerTo(e, a, b))[0];
}
function bite(game: Game, e: Entity, target: Entity, dt: number, stats: WaveNumbers) {
  e.state = 'attack';
  faceToward(e, target);
  if (e.bossState?.heads) {
    for (const attack of bossMeleeAttacks(e.bossState)) {
      damageAlly(game, e, target, stats.damage * attack.damageFactor, false);
      e.bossState.heads[attack.head].cool = attack.cooldown;
    }
  } else if (e.cool <= 0) {
    const spits = e.variant === 'spitter';
    damageAlly(
      game,
      e,
      target,
      e.boss ? stats.damage * KING_BITE_FACTOR : biteDamage(e.variant, stats.damage),
      spits,
    );
    e.cool = spits ? SPIT_INTERVAL : BITE_INTERVAL;
  }
  // Support can be bitten but never becomes an immortal roadblock.
  if (defenseRole(target.kind as Kind) === 'support' || isFlying(e)) {
    march(game, e, dt, stats);
    faceToward(e, target);
    e.state = 'attack';
  }
}
/** A snake inside the crystal hurts it and leaves the fight without a reward. */
function enterCrystal(game: Game, e: Entity) {
  const absorbed = e.boss ? 0 : Math.min(CRYSTAL_DAMAGE, game.rewards.ward);
  game.rewards.ward -= absorbed;
  game.base = Math.max(0, game.base - (e.boss ? KING_CRYSTAL_DAMAGE : CRYSTAL_DAMAGE - absorbed));
  if (game.mission) game.missionMinBase = Math.min(game.missionMinBase, game.base);
  else {
    const chapter = chapterIndex(game.wave);
    game.campaign.chapterMin[chapter] = Math.min(game.campaign.chapterMin[chapter], game.base);
  }
  // maxHp 0 marks a snake that was not defeated: `collectFallen` pays nothing for it.
  e.hp = 0;
  e.maxHp = 0;
  cancelBossShot(e.bossState);
  game.message =
    absorbed > 0
      ? fill(TEXT.laProtectionDuCristalAAbsorbeN, absorbed)
      : TEXT.unSerpentAAtteintLeCamp;
}
