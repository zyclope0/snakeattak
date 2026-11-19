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
import { landAt } from '../src/engine/landing.ts';
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

test('la révision 6 ne change que la sauterelle', () => {
  assert.deepEqual([...BALANCE_REVISIONS], [1, 2, 3, 4, 5, 6, 7]);
  // Current from 18 November 2026 (600 simulated games) until the seventh, the next day.
  assert.equal(CURRENT_BALANCE_REVISION, 7);
  for (const kind of Object.keys(kinds) as Kind[])
    assert.equal(balanceRecruitPrice(kind, 6), balanceRecruitPrice(kind, 5), kind);
  assert.deepEqual(lateEggRule(6), lateEggRule(5));
  assert.deepEqual(ninjaTeleport(6), ninjaTeleport(5));
  assert.deepEqual(grasshopperLeap(6), { reach: 110, band: 60, depth: 260, behind: 40 });
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
  assert.deepEqual([hp, speed, damage], [0.9, 1, 1]);
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

test('elle se pose toujours derrière la ligne, jamais sur le cristal, un rocher ni la rivière', () => {
  // A line by the crystal leaves no place behind it: no leap, the leap is kept, and it walks
  // into that line. It never lands in front of the ally it should pass.
  for (const [allyX, from] of [
    [980, 900],
    [945, 850],
    [990, 960],
  ]) {
    const near = stage([{ x: allyX, y: 324 }], from, 324);
    assert.equal(leapOverLine(near.game, near.snake), false, `${allyX}`);
    assert.equal(near.snake.x, from);
    assert.equal(near.snake.leaps, 1);
  }
  const near = stage([{ x: 880, y: 324 }], 800, 324);
  // Wherever its line stands, the place it lands on is one a snake can stand on.
  const level = near.game.level;
  for (const y of [140, 200, 250, 324, 420, 500])
    for (const lineX of [520, 600, 700, 820]) {
      const { game, snake } = stage([{ x: lineX, y }], lineX - 80, y);
      if (!leapOverLine(game, snake)) {
        assert.equal(snake.leaps, 1, 'sans place libre, elle garde son saut');
        continue;
      }
      assert.ok(standable(snake.x, snake.y, level), `${lineX},${y} → ${snake.x},${snake.y}`);
      assert.ok(snake.x > lineX && snake.x <= CRYSTAL_X - 60, `${lineX} → ${snake.x}`);
    }
  for (const rock of level.rocks) {
    const { game, snake } = stage([{ x: rock.x - 40, y: rock.y }], rock.x - 120, rock.y);
    leapOverLine(game, snake);
    assert.ok(Math.hypot(snake.x - rock.x, snake.y - rock.y) >= rock.r, `rocher ${rock.x}`);
  }
});

test('sa ligne, ce sont les alliés vivants de sa route à portée devant elle', () => {
  // An ally far ahead, past the depth of the line, is not part of it.
  const far = stage([
    { x: 480, y: 324 },
    { x: 900, y: 324 },
  ]);
  assert.equal(leapOverLine(far.game, far.snake), true);
  assert.equal(far.snake.x, 480 + 40);
  // A fallen ally is no longer part of the line.
  const fallen = stage([
    { x: 480, y: 324 },
    { x: 600, y: 324 },
  ]);
  fallen.game.units[1].hp = 0;
  assert.equal(leapOverLine(fallen.game, fallen.snake), true);
  assert.equal(fallen.snake.x, 480 + 40);
  // A fallen ally alone does not make it leap.
  const alone = stage([{ x: 460, y: 324 }]);
  alone.game.units[0].hp = 0;
  assert.equal(leapOverLine(alone.game, alone.snake), false);
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

test('dans une partie, une sauterelle par vague dès la vague 7, jamais changée en serpent volant', () => {
  const { game, snake } = meet(6, 'grasshopper', 7);
  assert.equal(snake.leaps, 1);
  assert.equal(game.balanceRevision, 6);
  assert.throws(() => meet(5, 'grasshopper', 7), /aucun grasshopper/);
  // What really comes out of the den, wave by wave: one grasshopper in each of waves 7 to 12.
  for (let wave = 1; wave <= 12; wave++) {
    const played = classic(6, 31);
    played.wave = wave - 1;
    played.gold = 0;
    played.units = [];
    played.normalizeCamp();
    assert.ok(played.startWave());
    const seen = new Set<number>();
    for (let step = 0; step < 30 * 90 && played.status === 'fighting'; step++) {
      played.step(1 / 30);
      for (const e of played.enemies) if (e.variant === 'grasshopper') seen.add(e.id);
      if (played.remaining === 0 && step > 30) break;
    }
    assert.equal(seen.size, wave >= 7 ? 1 : 0, `vague ${wave}`);
  }
});

test('dans une partie, elle franchit une vraie ligne d’alliés et marche ensuite vers le cristal', () => {
  const { game, snake } = meet(6, 'grasshopper', 7);
  // A line across its road, well before the crystal, and nothing else.
  const model = game.units[0];
  game.units = [0, 1, 2].map((i) => ({
    ...model,
    id: 91000 + i,
    kind: 'wall' as const,
    x: 600 + i * 30,
    y: snake.y,
    hp: 500,
    maxHp: 500,
  }));
  for (const e of game.enemies) if (e !== snake) e.hp = 0;
  // Put down ahead on its road, with the stage of that place, as the engine does.
  landAt(game, snake, 480, snake.y);
  let leapt = false;
  for (let step = 0; step < 30 * 20 && snake.hp > 0 && snake.x < 600; step++) {
    game.step(1 / 30);
    leapt ||= game.effects.some((e) => e.kind === 'leap' && e.sourceId === snake.id);
  }
  assert.ok(leapt, 'elle a sauté');
  assert.ok(snake.x > 660, `elle est passée derrière la ligne : ${snake.x}`);
  assert.equal(snake.leaps, 0);
  // Then it walks on toward the crystal: it does not turn back to bite the line it passed.
  const after = snake.x;
  for (let step = 0; step < 30 && snake.hp > 0 && game.enemies.includes(snake); step++) {
    game.step(1 / 30);
    assert.ok(
      game.units.every((u) => u.hp === 500),
      'elle ne mord pas la ligne derrière elle',
    );
  }
  assert.ok(snake.x > after + 10, `puis elle avance vers le cristal : ${after} → ${snake.x}`);
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
