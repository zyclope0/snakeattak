import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import {
  BALANCE_REVISIONS,
  CURRENT_BALANCE_REVISION,
  allyExists,
  balanceRecruitPrice,
  grasshopperLeap,
  lateEggRule,
  ninjaTeleport,
  spinosaurusRule,
} from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { kinds, unlockWave } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { decodeDeparture, departureForGame, encodeDeparture } from '../src/departures.ts';
import { LANES } from '../src/ai.ts';
import { CAMP_LEFT } from '../src/boardLandmarks.ts';
import { inRiver } from '../src/navigation.ts';
import { addAlly } from '../src/engine/state.ts';
import type { Entity } from '../src/engine/state.ts';
import { climbOut } from '../src/engine/swim.ts';
import { leapOverLine } from '../src/engine/leap.ts';
import { reliefTeams } from '../src/defenders.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { friendChoices } from '../src/ui/capriceFriends.ts';
import { variantFor } from '../src/waves.ts';

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

// Seventh balance revision, 19 November 2026: the child's spinosaurus. « Sa morsure et sa voile
// sont très dangereux et il nage mais pas tous le temps pour pas trop déséquilibrer le jeux »;
// it arrives at wave 8 of the great adventure. Every number below is retyped on purpose.
const classic = (revision: 6 | 7, seed = 7) => new Game(seed, undefined, undefined, revision);

/**
 * A wave 8 of the seventh revision with no one but a spinosaurus at (x, y) and one snake at
 * (sx, sy) on the middle lane. No other snake comes.
 */
function pond(x: number, y: number, sx: number, sy = LANES[1] + 11) {
  const game = classic(7, 31);
  game.wave = 7;
  game.normalizeCamp();
  assert.ok(game.startWave());
  for (let step = 0; step < 30 * 60 && !game.enemies.length; step++) game.step(1 / 30);
  const snake = game.enemies[0];
  game.enemies = [snake];
  game.eggs = [];
  game.remaining = 0;
  Object.assign(snake, {
    variant: 'normal',
    x: sx,
    y: sy,
    lane: 1,
    stage: 2,
    turnY: null,
    path: [],
    nav: 0,
  });
  snake.hp = snake.maxHp = 5000;
  game.units = [];
  const spino = addAlly(game, 'spinosaurus', x, y);
  game.effects = [];
  return { game, spino, snake };
}

test('la révision 7 est la révision courante et n’ajoute que le spinosaure', () => {
  assert.deepEqual([...BALANCE_REVISIONS], [1, 2, 3, 4, 5, 6, 7]);
  // Accepted by the parent on 19 November 2026 after 2 800 simulated games.
  assert.equal(CURRENT_BALANCE_REVISION, 7);
  assert.deepEqual(spinosaurusRule(7), {
    sailRadius: 72,
    sailShare: 0.25,
    swimEvery: 20,
    swimReach: 240,
    swimSpeed: 120,
  });
  for (const revision of [1, 2, 3, 4, 5, 6] as const) assert.equal(spinosaurusRule(revision), null);
  const { cost, hp, damage, range, speed, rate } = kinds.spinosaurus;
  assert.deepEqual([cost, hp, damage, range, speed, rate], [420, 400, 84, 60, 66, 1.3]);
  assert.equal(unlockWave.spinosaurus, 8);
  // Nothing else moves: prices, eggs, snakes and their powers stay those of the sixth.
  for (const kind of Object.keys(kinds) as Kind[])
    if (kind !== 'spinosaurus')
      assert.equal(balanceRecruitPrice(kind, 7), balanceRecruitPrice(kind, 6), kind);
  assert.deepEqual(lateEggRule(7), lateEggRule(6));
  assert.deepEqual(ninjaTeleport(7), ninjaTeleport(6));
  assert.deepEqual(grasshopperLeap(7), grasshopperLeap(6));
  for (let wave = 1; wave <= 12; wave++)
    for (let index = 0; index < 40; index++)
      assert.equal(variantFor(wave, index, 7), variantFor(wave, index, 6), `${wave}/${index}`);
  assert.throws(() => new Game(7, undefined, createMissionRun('refuge', 7, undefined, 2), 7));
});

test('le spinosaure n’existe que dans la grande aventure de la révision 7, dès la vague 8', () => {
  for (const revision of [1, 2, 3, 4, 5, 6] as const)
    assert.equal(allyExists('spinosaurus', revision), false);
  assert.equal(allyExists('spinosaurus', 7), true);
  assert.equal(allyExists('trex', 1), true);
  const recruitAt = (game: Game, wave: number) => {
    game.wave = wave;
    game.gold = 5000;
    game.units = [];
    return game.recruit('spinosaurus', 948, 324);
  };
  assert.equal(recruitAt(classic(6), 11), false, 'jamais dans la révision 6');
  assert.equal(classic(6).knowsAlly('spinosaurus'), false);
  assert.equal(recruitAt(classic(7), 6), false, 'pas avant la vague 8');
  const game = classic(7);
  assert.equal(recruitAt(game, 7), true, 'la vague 8 est celle qui vient');
  assert.equal(game.gold, 5000 - 420);
  assert.equal(game.units[0].hp, 400);
  // No expedition offers it, even the last ones, nor among a challenge's friends.
  for (const balance of [undefined, 2] as const) {
    const run = createMissionRun('trois-ponts', 7, null, balance);
    const mission = new Game(7, undefined, run);
    mission.gold = 5000;
    assert.equal(mission.knowsAlly('spinosaurus'), false);
    assert.equal(mission.recruit('spinosaurus', 948, 324), false);
    assert.ok(!friendChoices(run).includes('spinosaurus'));
  }
});

test('sa morsure frappe son serpent, sa voile tous ceux autour de lui, au quart', () => {
  const { game, spino, snake } = pond(700, 324, 720, 324);
  // Behind it, within the sail but further than its snake.
  const near = { ...snake, id: 99001, x: 655, y: 300, hp: 500, maxHp: 500 } as Entity;
  const far = { ...snake, id: 99002, x: 700 + 80, y: 324 + 30, hp: 500, maxHp: 500 } as Entity;
  const flying = { ...snake, id: 99003, x: 700, y: 360, hp: 500, variant: 'flying' } as Entity;
  game.enemies.push(near, far, flying);
  spino.cool = 0;
  spino.swim = { wait: 10, prey: null, back: false };
  game.step(1 / 30);
  assert.equal(snake.hp, 5000 - 84, 'la morsure');
  assert.equal(near.hp, 500 - 21, 'la voile, derrière lui aussi');
  assert.equal(far.hp, 500, 'trop loin de la voile');
  assert.equal(flying.hp, 500, 'un serpent qui vole passe au-dessus de la voile');
  assert.ok(game.effects.some((e) => e.kind === 'sail'));
});

test('il nage jusqu’au pont, mord le serpent depuis l’eau, puis revient au camp', () => {
  const { game, spino, snake } = pond(624, 372, 492);
  let swam = false,
    bitten = 0;
  for (let step = 0; step < 30 * 6 && !(spino.swim?.wait ?? 0); step++) {
    const before = snake.hp;
    game.step(1 / 30);
    if (inRiver(spino.x, spino.y)) swam = true;
    if (snake.hp < before) {
      bitten++;
      assert.ok(swam, 'la morsure vient de la rivière');
    }
  }
  assert.ok(swam, 'il est entré dans la rivière');
  assert.equal(bitten, 1, 'une seule morsure par plongée');
  assert.ok(spino.x >= CAMP_LEFT && !inRiver(spino.x, spino.y), 'il est revenu au camp');
  assert.equal(spino.swim!.wait, 20);
  assert.equal(game.effects.filter((e) => e.kind === 'splash').length >= 1, true);
});

test('il ne nage pas tout le temps : une plongée toutes les 20 secondes au plus', () => {
  const { game, spino, snake } = pond(624, 372, 492);
  let dives = 0,
    wet = false;
  for (let step = 0; step < 30 * 30; step++) {
    // The snake stays on its bridge, out of reach from the bank.
    Object.assign(snake, { x: 492, y: LANES[1] + 11, path: [], nav: 1 });
    game.step(1 / 30);
    const now = inRiver(spino.x, spino.y);
    if (now && !wet) dives++;
    wet = now;
  }
  assert.equal(dives, 2, 'deux plongées en trente secondes, pas plus');
});

test('pas de plongée sans serpent sur un pont, ni vers un serpent trop loin', () => {
  const inCamp = pond(700, 400, 760, 400);
  for (let step = 0; step < 60; step++) inCamp.game.step(1 / 30);
  assert.equal(inCamp.spino.swim?.prey ?? null, null);
  const far = pond(940, 160, 492);
  for (let step = 0; step < 60; step++) far.game.step(1 / 30);
  assert.ok(!inRiver(far.spino.x, far.spino.y));
  assert.equal(far.spino.swim?.prey ?? null, null);
});

test('une vague finie pendant qu’il nage : il sort sur la rive, et le camp se sauvegarde', () => {
  const { game, spino } = pond(624, 372, 492);
  for (let step = 0; step < 30 && !inRiver(spino.x, spino.y); step++) game.step(1 / 30);
  assert.ok(inRiver(spino.x, spino.y));
  climbOut(game);
  assert.ok(spino.x >= CAMP_LEFT && !inRiver(spino.x, spino.y));
  assert.equal(spino.swim, undefined);
  // The same through the real end of a wave.
  const again = pond(624, 372, 492);
  for (let step = 0; step < 30 && !inRiver(again.spino.x, again.spino.y); step++)
    again.game.step(1 / 30);
  again.snake.hp = 0;
  for (let step = 0; step < 30 && again.game.status === 'fighting'; step++) again.game.step(1 / 30);
  assert.equal(again.game.status, 'preparing');
  assert.ok(again.spino.x >= CAMP_LEFT && !inRiver(again.spino.x, again.spino.y));
  const raw = encodeCheckpoint(again.game);
  assert.ok(raw);
  const back = decodeCheckpoint(raw)!;
  assert.equal(back.balanceRevision, 7);
  assert.ok(back.units.some((u) => u.kind === 'spinosaurus'));
});

test('une sauvegarde ou un code de la révision 6 ne contient jamais de spinosaure', () => {
  const old = classic(6, 2026);
  old.initialSeed = 2026;
  old.wave = 8;
  const raw = encodeCheckpoint(old)!;
  const data = JSON.parse(raw);
  assert.equal(data.version, 13);
  data.units.push({ ...data.units[0], id: data.nextId + 1, kind: 'spinosaurus', x: 900 });
  data.nextId += 1;
  assert.equal(decodeCheckpoint(JSON.stringify(data)), null);
  const game = classic(7, 2026);
  game.initialSeed = 2026;
  const code = encodeDeparture(departureForGame(game)!);
  assert.match(code, /^AVENTURE-9-/);
  const decoded = decodeDeparture(code);
  assert.ok(decoded.ok);
  assert.deepEqual({ ...decoded.departure }, { kind: 'classic', seed: 2026, balance: 7 });
  assert.match(encodeDeparture({ kind: 'classic', seed: 2026, balance: 6 }), /^AVENTURE-8-/);
});

test('sa proie disparaît avant l’eau : il reste au camp, sans glisser vers la rive', () => {
  const { game, spino, snake } = pond(700, 372, 492);
  // Another snake, far from the camp, so that the wave goes on.
  game.enemies.push({ ...snake, id: 99010, x: 200, y: LANES[0], lane: 0, stage: 0 });
  for (let step = 0; step < 5; step++) game.step(1 / 30);
  assert.equal(spino.swim!.prey, snake.id, 'la plongée a commencé');
  assert.ok(!inRiver(spino.x, spino.y));
  snake.hp = 0;
  game.step(1 / 30);
  assert.deepEqual(spino.swim, { wait: 0, prey: null, back: false });
  const x = spino.x;
  for (let step = 0; step < 30; step++) game.step(1 / 30);
  // On land it walks back home at its own pace, around the rocks, not at the swim speed.
  assert.ok(spino.x >= x, `${spino.x} / ${x}`);
});

test('il ne plonge pas vers un serpent que sa morsure n’atteint pas depuis l’eau', () => {
  const { game, spino, snake } = pond(624, 250, 575, LANES[1] + 20);
  for (let step = 0; step < 60; step++) {
    Object.assign(snake, { x: 575, y: LANES[1] + 20, path: [], nav: 1 });
    game.step(1 / 30);
    assert.ok(!inRiver(spino.x, spino.y), `pas 30-${step}`);
  }
  assert.equal(spino.swim?.prey ?? null, null);
});

test('son serpent s’éloigne du bord pendant qu’il nage : il abandonne et revient', () => {
  const { game, spino, snake } = pond(624, 372, 492);
  for (let step = 0; step < 10; step++) game.step(1 / 30);
  assert.equal(spino.swim!.prey, snake.id);
  const full = snake.hp;
  for (let step = 0; step < 30 * 6 && !spino.swim!.wait; step++) {
    // Far side of the bridge, out of reach of the water where it swims.
    Object.assign(snake, { x: 492, y: LANES[1] - 30, path: [], nav: 1 });
    game.step(1 / 30);
  }
  assert.equal(snake.hp, full, 'pas de morsure');
  assert.equal(spino.swim!.wait, 20);
  assert.ok(spino.x >= CAMP_LEFT && !inRiver(spino.x, spino.y));
});

test('pendant qu’il nage, il ne compte ni dans la ligne de la sauterelle ni dans les renforts', () => {
  const { game, spino, snake } = pond(530, 372, 430, LANES[1]);
  spino.swim = { wait: 0, prey: 999, back: false };
  Object.assign(snake, { variant: 'grasshopper', leaps: 1, state: 'attack' });
  assert.equal(leapOverLine(game, snake), false, 'pas de saut par-dessus un nageur');
  assert.equal(snake.leaps, 1);
  assert.ok(
    ![...reliefTeams(game.units, game.enemies).values()].some((team) => team.has(spino.id)),
  );
  // The same spinosaurus on land is part of both.
  spino.swim = { wait: 0, prey: null, back: false };
  Object.assign(spino, { x: 520, y: LANES[1] });
  assert.equal(leapOverLine(game, snake), true);
});
