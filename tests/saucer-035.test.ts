import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { levelForWave, missionLevel } from '../src/levels.ts';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { saucerReadout } from '../src/render/saucer.ts';

test('saucer appears only in the classic ruins chapter across all twelve waves', () => {
  for (let wave = 1; wave <= 12; wave++) {
    const readout = saucerReadout(levelForWave(wave), null);
    if (wave <= 8) assert.equal(readout, null, `classic wave ${wave}`);
    else assert.deepEqual(readout, { x: 1008, y: 48, width: 36, height: 20 });
  }
});

test('every mission and layout excludes the saucer, even with classic ruins art', () => {
  for (const definition of MISSIONS) {
    for (const layout of [0, 1, 2] as const) {
      const run = { ...createMissionRun(definition.id, 35), layout };
      assert.equal(saucerReadout(missionLevel(layout), run), null);
      assert.equal(saucerReadout(levelForWave(12), run), null);
      assert.equal(saucerReadout(missionLevel(layout), null), null);
    }
  }
});

test('saucer geometry stays stable and entirely inside the decorative top frame', () => {
  const readout = saucerReadout(levelForWave(9), null)!;
  assert.deepEqual(readout, { x: 1008, y: 48, width: 36, height: 20 });
  assert.ok(readout.x - readout.width / 2 > 0);
  assert.ok(readout.x + readout.width / 2 < 1100);
  assert.ok(readout.y - readout.height / 2 > 0);
  assert.ok(readout.y + readout.height / 2 < 100);
  for (let repeat = 0; repeat < 20; repeat++) {
    assert.deepEqual(saucerReadout(levelForWave(12), null), readout);
  }
});

test('reading the saucer never changes classic or mission game state', () => {
  const games = [new Game(35), new Game(35, undefined, createMissionRun('refuge', 35))];
  for (const game of games) {
    for (let wave = 1; wave <= game.totalWaves; wave++) {
      game.wave = wave;
      const before = JSON.stringify(game);
      saucerReadout(game.level, game.mission);
      assert.equal(JSON.stringify(game), before);
    }
  }
});
