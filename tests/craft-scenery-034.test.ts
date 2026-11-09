import test from 'node:test';
import assert from 'node:assert/strict';
import { stageTheme, stageComposition } from '../src/render/stageLayout.ts';
import { levelForWave, missionLevel } from '../src/levels.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';

test('un seul cadre adapte chaque géométrie existante, sans confondre le bosquet ambré', () => {
  assert.deepEqual(
    [
      levelForWave(1),
      levelForWave(5),
      levelForWave(9),
      ...[0, 1, 2].map((n) => missionLevel(n as 0 | 1 | 2)),
    ].map((level) => stageTheme(level).scenery),
    ['scenery-flood', null, 'scenery-marsh', 'scenery-flood', 'scenery-marsh', 'scenery-flood'],
  );
});

test('choisir et relire le décor ne modifie ni ancien départ, ni combat, ni RNG', () => {
  for (const layout of [0, 1, 2] as const) {
    const game = new Game(2026, undefined, { ...createMissionRun('trois-ponts', 2026), layout });
    const before = JSON.stringify(game);
    for (let read = 0; read < 20; read++) stageTheme(game.level);
    assert.equal(JSON.stringify(game), before);
  }
});

test('le cadre laisse le ruisseau libre, sans rochers ni fougères qui semblent flotter', () => {
  for (const level of [
    levelForWave(1),
    levelForWave(5),
    levelForWave(9),
    ...[0, 1, 2].map((n) => missionLevel(n as 0 | 1 | 2)),
  ]) {
    for (const seed of [0, 2026, 12345, 0xffffffff]) {
      const { decor } = stageComposition(level, seed);
      assert.ok(decor.length >= 10);
      assert.ok(decor.every((p) => Math.abs(p.x - 528) >= p.radius + 54));
    }
  }
});
