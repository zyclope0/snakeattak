import test from 'node:test';
import assert from 'node:assert/strict';
import { stageComposition, STAGE_SIZES } from '../src/render/stageLayout.ts';
import { missionLevel } from '../src/levels.ts';
import { Game } from '../src/game.ts';
import { blocked } from '../src/navigation.ts';
import { createMissionRun } from '../src/missions.ts';
import { laneRoad, junctionRoad, routeJunctions } from '../src/routes.ts';

test('chaque disposition garde exactement ses trois passages et un décor espacé hors des routes', () => {
  for (const layout of [0, 1, 2] as const)
    for (const seed of [0, 2026, 12345, 0xffffffff]) {
      const level = missionLevel(layout),
        composition = stageComposition(level, seed);
      assert.deepEqual(
        composition.bridges.map((p) => [p.x, p.y]),
        [
          [528, 180],
          [528, 324],
          [528, 468],
        ],
      );
      const road = [0, 1, 2]
        .flatMap((lane) => laneRoad(lane, level))
        .concat(...routeJunctions(level).map((x) => junctionRoad(x, level)));
      assert.ok(composition.decor.length >= 10 && composition.decor.length <= 30);
      for (const [i, item] of composition.decor.entries()) {
        assert.ok(item.x - item.radius >= 12 && item.x + item.radius <= 1088);
        assert.ok(item.y - item.radius >= 12 && item.y + item.radius <= 608);
        assert.ok(road.every((p) => Math.hypot(p.x - item.x, p.y - item.y) >= item.radius + 43));
        assert.ok(item.scale >= 0.85 && item.scale <= 1.15);
        assert.ok(Math.abs(item.angle) <= 4);
        for (const prior of composition.decor.slice(0, i)) {
          const d = Math.hypot(prior.x - item.x, prior.y - item.y);
          assert.ok(d >= prior.radius + item.radius + 10);
          if (d < 130) assert.notEqual(item.frame, prior.frame, 'pas deux mêmes props voisins');
        }
      }
    }
});

test('décor reproductible et indépendant des tirages du combat et des sauvegardes', () => {
  const run = createMissionRun('trois-ponts', 2026),
    game = new Game(2026, undefined, run);
  const before = JSON.stringify(game);
  const first = stageComposition(game.level, run.seed);
  assert.deepEqual(stageComposition(game.level, run.seed), first);
  assert.notDeepEqual(stageComposition(game.level, run.seed + 1), first);
  assert.equal(JSON.stringify(game), before);
  game.startWave();
  game.step(1 / 30);
  assert.deepEqual(stageComposition(game.level, run.seed), first);
});

test('bâtiments et ponts restent dans le cadre avec une marge', () => {
  for (const object of [STAGE_SIZES.fort, ...STAGE_SIZES.dens]) {
    assert.ok(object.x - object.width / 2 >= 12);
    assert.ok(object.x + object.width / 2 <= 1088);
    assert.ok(object.y - object.height * 0.82 >= 12);
    assert.ok(object.y + object.height * 0.18 <= 608);
  }
});

test('la berge révèle toute la barrière réelle en conservant les ouvertures', () => {
  for (const layout of [0, 1, 2] as const) {
    const level = missionLevel(layout),
      composition = stageComposition(level, 2026);
    for (let y = 96; y <= 552; y++)
      for (const x of [481, 490, 528, 575]) {
        const visibleBarrier = composition.banks.some(
          (b) => x > b.left && x < b.right && y > b.top && y < b.bottom,
        );
        // The outer boundary itself is decorative; match the open interior exactly.
        if (y === 96 || y === 552) continue;
        assert.equal(visibleBarrier, blocked(x, y, level), `${layout}: ${x},${y}`);
      }
  }
});
