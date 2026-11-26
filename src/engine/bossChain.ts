import { defenseRole } from '../defenders.ts';
import type { Kind } from '../data.ts';
import { LANES } from '../ai.ts';
import { feastPoint, STICKY_ZONE } from '../tactics.ts';
import type { HiddenBossTuning } from '../hiddenBossTuning.ts';
import type { Entity } from './state.ts';
import { addEffect, createEntity, distance, faceToward, nearestTo } from './state.ts';
import { CRYSTAL_X, DEN_EXIT_X } from './field.ts';
import { followRoute, pickLane } from './movement.ts';
import { damageAlly } from './damage.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/hiddenBoss.ts';
import { fill } from '../texts/fill.ts';

/**
 * Le boss caché, un pas après l'autre (`hiddenBoss.ts` l'appelle) : une tête qui marche sur
 * les routes comme les autres serpents, suivie de ses anneaux. Les anneaux sont des serpents
 * de `game.enemies` (marqués `chainRing`) : les alliés les choisissent et les frappent avec
 * leurs règles de toujours. La tête n'est pas dans `game.enemies` : aucun coup ne la touche.
 */

/** Board units between two points of the trail the head leaves behind it. */
const TRAIL_STEP = 2;

export type TrailPoint = { x: number; y: number; lane: number };
export type BossChain = {
  /** The head: a snake that walks and bites, never in `game.enemies`. */
  head: Entity;
  /** Where the head walked, nearest first, `TRAIL_STEP` apart: the rings lie along it. */
  trail: TrailPoint[];
  /** Seconds the head still stands still, swallowing. */
  gulp: number;
  /** Rings gained by swallowing, allies and honey pots swallowed, rings broken. */
  grown: number;
  allies: number;
  honey: number;
  broken: number;
  /** The most rings the body had at once. */
  most: number;
  /** Only the head is left: it curled up and fell asleep. The battle is won. */
  asleep: boolean;
};

/** The rings of the body, from the head to the tail. */
export const ringsOf = (game: Game): Entity[] => game.enemies.filter((e) => e.chainRing);

const trailLength = (tuning: HiddenBossTuning) =>
  Math.ceil(((tuning.maxRings + 1) * tuning.ringSpacing) / TRAIL_STEP) + 1;
/** Where ring `index` (0 behind the head) lies: `ringSpacing` further back than the one before. */
function slot(chain: BossChain, index: number, tuning: HiddenBossTuning): TrailPoint {
  const at = Math.round(((index + 1) * tuning.ringSpacing) / TRAIL_STEP) - 1;
  return chain.trail[Math.max(0, Math.min(chain.trail.length - 1, at))];
}

/**
 * The boss leaves its den: the head at the den's exit, on the lane `pickLane` draws (one
 * draw), its rings behind it, still in the den.
 */
export function layChain(game: Game, tuning: HiddenBossTuning): BossChain {
  const lane = pickLane(game, true);
  const head = createEntity(game, 'snake', DEN_EXIT_X, LANES[lane], 1);
  head.boss = true;
  head.lane = lane;
  const chain: BossChain = {
    head,
    trail: [],
    gulp: 0,
    grown: 0,
    allies: 0,
    honey: 0,
    broken: 0,
    most: 0,
    asleep: false,
  };
  for (let i = 1; i <= trailLength(tuning); i++)
    chain.trail.push({ x: DEN_EXIT_X - i * TRAIL_STEP, y: LANES[lane], lane });
  for (let i = 0; i < tuning.startRings; i++) addRing(game, chain, tuning);
  return chain;
}
/** One more ring, at the tail; false when the body already has its most rings. */
function addRing(game: Game, chain: BossChain, tuning: HiddenBossTuning): boolean {
  const count = ringsOf(game).length;
  if (count >= tuning.maxRings) return false;
  const at = slot(chain, count, tuning);
  const ring = createEntity(game, 'snake', at.x, at.y, tuning.ringHp);
  ring.chainRing = true;
  ring.lane = at.lane;
  ring.facing = chain.head.facing;
  game.enemies.push(ring);
  chain.most = Math.max(chain.most, count + 1);
  return true;
}

/**
 * Le tour du boss, après celui des alliés : les anneaux cassés tombent, puis la tête avale,
 * mange le miel, mord ou marche, et le corps la suit. Sans anneau, il s'enroule : gagné.
 */
export function chainTurn(game: Game, chain: BossChain, tuning: HiddenBossTuning, dt: number) {
  breakRings(game, chain, tuning);
  if (!ringsOf(game).length) return curlUp(game, chain);
  const head = chain.head;
  head.cool -= dt;
  if (chain.gulp > 0) {
    chain.gulp = Math.max(0, chain.gulp - dt);
    head.state = 'idle';
  } else {
    const prey = biteTarget(game, head, tuning);
    if (prey) bite(game, head, prey, tuning, dt);
    else walk(game, head, tuning, dt);
    eatHoney(game, chain, tuning);
  }
  swallowFallen(game, chain, tuning);
  followHead(chain, ringsOf(game), tuning);
  // The head in the crystal: the camp falls, by the rule of every lost battle.
  if (head.x > CRYSTAL_X) game.base = 0;
}
/** A broken ring pays its coins and leaves the body: the rings behind it close up. */
function breakRings(game: Game, chain: BossChain, tuning: HiddenBossTuning) {
  for (const ring of game.enemies)
    if (ring.chainRing && ring.hp <= 0) {
      game.gold += tuning.ringCoins;
      game.kills++;
      chain.broken++;
      addEffect(game, ring, ring, 'gold');
    }
  game.enemies = game.enemies.filter((e) => e.hp > 0);
}
function curlUp(game: Game, chain: BossChain) {
  chain.asleep = true;
  chain.head.state = 'idle';
  game.status = 'won';
  game.feast = null;
  game.encouragementRemaining = 0;
  game.message = fill(TEXT.victoireNNAPlusQueSaTete, TEXT.classicSnake);
}
function walk(game: Game, head: Entity, tuning: HiddenBossTuning, dt: number) {
  followRoute(game, head, tuning.headSpeed, dt);
}
/** The nearest ally within reach of the head. */
function biteTarget(game: Game, head: Entity, tuning: HiddenBossTuning): Entity | undefined {
  return nearestTo(head, game.units, (u) => u.hp > 0 && distance(u, head) < tuning.biteReach);
}
function bite(game: Game, head: Entity, prey: Entity, tuning: HiddenBossTuning, dt: number) {
  head.state = 'attack';
  faceToward(head, prey);
  if (head.cool <= 0) {
    damageAlly(game, head, prey, tuning.biteDamage, false);
    head.cool = tuning.biteInterval;
  }
  // As with every snake: a healer can be bitten but never stops the head.
  if (defenseRole(prey.kind as Kind) === 'support') {
    walk(game, head, tuning, dt);
    faceToward(head, prey);
    head.state = 'attack';
  }
}
/**
 * A honey pot of the head's lane is eaten when the head reaches it: one more ring, and the
 * head stands still while it eats. Until then the sticky honey slows it, as it slows the king.
 */
function eatHoney(game: Game, chain: BossChain, tuning: HiddenBossTuning) {
  const feast = game.feast;
  const head = chain.head;
  if (!feast || head.lane !== feast.lane || head.turnY !== null) return;
  const pot = feastPoint(feast, game.level);
  if (
    Math.abs(head.x - pot.x) > tuning.honeyReach ||
    Math.abs(head.y - pot.y) > STICKY_ZONE.halfWidth
  )
    return;
  game.feast = null;
  chain.honey++;
  chain.gulp = tuning.honeyGulp;
  addEffect(game, head, pot, 'honey');
  if (!addRing(game, chain, tuning)) return;
  chain.grown++;
  game.message = fill(TEXT.nAMangeLeMielUnAnneauDePlus, TEXT.classicSnake);
}
/**
 * An ally that fell beside the head is swallowed: gone for good, as every fallen ally. The
 * body gains a ring, unless it already has its most; a palisade is wood, never swallowed.
 */
function swallowFallen(game: Game, chain: BossChain, tuning: HiddenBossTuning) {
  for (const ally of game.units) {
    if (ally.hp > 0 || ally.kind === 'wall' || distance(ally, chain.head) > tuning.swallowReach)
      continue;
    chain.allies++;
    chain.gulp = tuning.allyGulp;
    if (!addRing(game, chain, tuning)) continue;
    chain.grown++;
    game.message = fill(TEXT.nAAvaleUnAllieUnAnneauDePlus, TEXT.classicSnake);
  }
}
/** The trail grows at the head, and every ring takes its place along it. */
function followHead(chain: BossChain, rings: Entity[], tuning: HiddenBossTuning) {
  const { head, trail } = chain;
  let last = trail[0];
  let gap = distance(head, last);
  while (gap >= TRAIL_STEP) {
    const share = TRAIL_STEP / gap;
    last = {
      x: last.x + (head.x - last.x) * share,
      y: last.y + (head.y - last.y) * share,
      lane: head.lane,
    };
    trail.unshift(last);
    gap = distance(head, last);
  }
  trail.length = Math.min(trail.length, trailLength(tuning));
  let ahead: { x: number } = head;
  rings.forEach((ring, index) => {
    const at = slot(chain, index, tuning);
    ring.facing = ahead.x >= at.x ? 1 : -1;
    ring.x = at.x;
    ring.y = at.y;
    ring.lane = at.lane;
    ring.state = head.state;
    ahead = ring;
  });
}
