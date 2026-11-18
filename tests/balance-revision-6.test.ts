import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import {
  BALANCE_REVISIONS,
  CURRENT_BALANCE_REVISION,
  balanceRecruitPrice,
  grasshopperLeap,
  lateEggRule,
  ninjaTeleport,
} from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { decodeDeparture, departureForGame, encodeDeparture } from '../src/departures.ts';
import { enemies } from '../src/enemies.ts';
import type { EnemyKind } from '../src/enemies.ts';
import { GRASSHOPPER_LEAPS, leapsOf } from '../src/enemyAbilities.ts';
import { leapOverLine } from '../src/engine/leap.ts';
import { routeStages, standable } from '../src/engine/field.ts';
import { CRYSTAL_X } from '../src/boardLandmarks.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { NEWCOMERS, variantFor } from '../src/waves.ts';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp'))
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)};`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

// Sixth balance revision, 18 November 2026: the child's grasshopper snake « saute derrière
// les lignes ; ensuite, si le cristal est le plus proche, elle va sur le cristal, sinon elle
// attaque les personnages qui sont entre le cristal et elle », then « marche normalement ».
// Every number below is retyped on purpose.
const classic = (revision: 5 | 6, seed = 7) => new Game(seed, undefined, undefined, revision);

/** Plays a wave until a snake of this kind is on the board. */
function meet(revision: 5 | 6, kind: EnemyKind, wave: number) {
  const game = classic(revision, 31);
  game.wave = wave - 1;
  game.gold = 20000;
  game.normalizeCamp();
  assert.ok(game.startWave());
  for (let step = 0; step < 30 * 60; step++) {
    game.step(1 / 30);
    const snake = game.enemies.find((e) => e.variant === kind && e.hp > 0);
    if (snake) return { game, snake };
  }
  throw new Error(`aucun ${kind} dans la vague ${wave}`);
}
/** A grasshopper snake at (x, y) on its road, with its leap, and only the given allies. */
function stage(allies: readonly { x: number; y: number }[], x = 400, y = 324) {
  const { game, snake } = meet(6, 'grasshopper', 7);
  const model = game.units[0];
  game.units = allies.map((place, index) => ({ ...model, id: 90000 + index, ...place, hp: 50 }));
  Object.assign(snake, { x, y, leaps: 1, path: [], nav: 0, turnY: null });
  game.effects = [];
  return { game, snake };
}

test('la révision 6 existe sans être courante, et ne change que la sauterelle', () => {
  assert.deepEqual([...BALANCE_REVISIONS], [1, 2, 3, 4, 5, 6]);
  assert.equal(CURRENT_BALANCE_REVISION, 5);
  for (const kind of Object.keys(kinds) as Kind[])
    assert.equal(balanceRecruitPrice(kind, 6), balanceRecruitPrice(kind, 5), kind);
  assert.deepEqual(lateEggRule(6), lateEggRule(5));
  assert.deepEqual(ninjaTeleport(6), ninjaTeleport(5));
  assert.deepEqual(grasshopperLeap(6), { reach: 110, band: 60, behind: 40 });
  for (const revision of [1, 2, 3, 4, 5] as const) assert.equal(grasshopperLeap(revision), null);
  assert.deepEqual(NEWCOMERS.grasshopper, { place: 9, fromWave: 7, revision: 6 });
  let changed = 0;
  for (let wave = 1; wave <= 12; wave++)
    for (let index = 0; index < 40; index++) {
      const before = variantFor(wave, index, 5);
      const after = variantFor(wave, index, 6);
      if (before === after) continue;
      changed++;
      assert.equal(after, 'grasshopper', `${wave}/${index}`);
      assert.ok(wave >= 7 && index === 9, `${wave}/${index}`);
    }
  assert.equal(changed, 6, 'une sauterelle par vague, des vagues 7 à 12');
  const { hp, speed, damage } = enemies.grasshopper;
  assert.deepEqual([hp, speed, damage], [1.9, 1, 1]);
  assert.equal(GRASSHOPPER_LEAPS, 1);
  assert.equal(leapsOf('grasshopper'), 1);
  assert.equal(leapsOf('shadow'), 0);
  assert.throws(() => new Game(7, undefined, createMissionRun('refuge', 7, undefined, 2), 6));
});

test('elle saute une fois, derrière l’allié de sa route le plus près du cristal', () => {
  const { game, snake } = stage([
    { x: 480, y: 324 },
    { x: 620, y: 330 },
    { x: 700, y: 140 }, // another road: not part of its line
  ]);
  const from = snake.x;
  assert.equal(leapOverLine(game, snake), true);
  assert.equal(snake.x, 620 + 40);
  assert.equal(snake.y, 324);
  assert.equal(snake.leaps, 0);
  const leap = game.effects.find((e) => e.kind === 'leap');
  assert.ok(leap);
  assert.deepEqual([leap.x, leap.tx, leap.sourceId], [from, 660, snake.id]);
  // Once only: the line ahead does not make it leap again.
  game.units.push({ ...game.units[0], id: 90010, x: 700, y: 324 });
  assert.equal(leapOverLine(game, snake), false);
  assert.equal(snake.x, 660);
  // After its leap, it does not walk back toward the den.
  const stages = routeStages(game.level);
  assert.ok(stages[snake.stage] > snake.x || snake.stage === stages.length - 1);
  assert.equal(snake.turnY, null);
});

test('sans allié devant elle sur sa route, elle marche comme les autres', () => {
  for (const allies of [
    [],
    [{ x: 380, y: 324 }], // behind it
    [{ x: 600, y: 324 }], // ahead, but too far yet
    [{ x: 470, y: 180 }], // near, but on another road
  ]) {
    const { game, snake } = stage(allies);
    assert.equal(leapOverLine(game, snake), false, JSON.stringify(allies));
    assert.equal(snake.x, 400);
    assert.equal(snake.leaps, 1);
  }
});

test('elle ne se pose jamais sur le cristal, un rocher ni la rivière', () => {
  // A line by the crystal: it lands short of it, not on it.
  const near = stage([{ x: 980, y: 324 }], 900, 324);
  assert.equal(leapOverLine(near.game, near.snake), true);
  assert.ok(near.snake.x <= CRYSTAL_X - 60, `${near.snake.x}`);
  // Already past that point: nothing to leap over, it walks on to the crystal.
  const past = stage([{ x: 990, y: 324 }], 960, 324);
  assert.equal(leapOverLine(past.game, past.snake), false);
  // Wherever its line stands, the place it lands on is one a snake can stand on.
  const level = near.game.level;
  for (const y of [140, 200, 250, 324, 420, 500])
    for (const lineX of [520, 600, 700, 820]) {
      const { game, snake } = stage([{ x: lineX, y }], lineX - 80, y);
      if (!leapOverLine(game, snake)) continue;
      assert.ok(standable(snake.x, snake.y, level), `${lineX},${y} → ${snake.x},${snake.y}`);
      assert.ok(snake.x > lineX - 80 && snake.x <= CRYSTAL_X - 60);
    }
  for (const rock of level.rocks) {
    const { game, snake } = stage([{ x: rock.x - 40, y: rock.y }], rock.x - 120, rock.y);
    leapOverLine(game, snake);
    assert.ok(Math.hypot(snake.x - rock.x, snake.y - rock.y) >= rock.r, `rocher ${rock.x}`);
  }
});

test('King Snake et les autres serpents ne sautent jamais', () => {
  const { game, snake } = stage([{ x: 480, y: 324 }]);
  for (const other of [
    { ...snake, leaps: undefined },
    { ...snake, variant: 'shadow' as const, leaps: undefined },
    { ...snake, boss: true },
  ]) {
    assert.equal(leapOverLine(game, other), false);
    assert.equal(other.x, 400);
  }
  // In the fifth revision, no snake has a leap to use.
  const before = stage([{ x: 480, y: 324 }]);
  Object.defineProperty(before.game, 'balanceRevision', { value: 5 });
  assert.equal(leapOverLine(before.game, before.snake), false);
});

test('dans une partie, la sauterelle arrive dès la vague 7 avec son saut', () => {
  const { game, snake } = meet(6, 'grasshopper', 7);
  assert.equal(snake.leaps, 1);
  assert.equal(game.balanceRevision, 6);
  assert.throws(() => meet(5, 'grasshopper', 7), /aucun grasshopper/);
});

test('code de départ AVENTURE-8 et sauvegarde de version 13 pour la révision 6', () => {
  const code = encodeDeparture({ kind: 'classic', seed: 2026, balance: 6 });
  assert.match(code, /^AVENTURE-8-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
  const decoded = decodeDeparture(code);
  assert.ok(decoded.ok);
  assert.deepEqual({ ...decoded.departure }, { kind: 'classic', seed: 2026, balance: 6 });
  const game = classic(6, 2026);
  game.initialSeed = 2026;
  assert.equal(encodeDeparture(departureForGame(game)!), code);
  const raw = encodeCheckpoint(game)!;
  assert.equal(JSON.parse(raw).version, 13);
  assert.equal(decodeCheckpoint(raw)!.balanceRevision, 6);
  // A save of the fifth revision keeps its version and its revision.
  const old = encodeCheckpoint(classic(5, 2026))!;
  assert.equal(JSON.parse(old).version, 12);
  assert.equal(decodeCheckpoint(old)!.balanceRevision, 5);
});
