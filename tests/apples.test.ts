import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const A = await import('../src/apples.ts');
const { stageComposition } = await import('../src/render/stageLayout.ts');
const { Game } = await import('../src/game.ts');
const { MISSIONS, createMissionRun } = await import('../src/missions.ts');
const { ENDLESS_RULES } = await import('../src/endless.ts');
const { levelForWave, missionLevel } = await import('../src/levels.ts');
const { laneRoad, junctionRoad, routeJunctions } = await import('../src/routes.ts');
const X = await import('../src/expedition.ts');
type AGame = InstanceType<typeof Game>;

/** The apple of the wave a game is fighting, with the props its board is drawn with. */
const appleIn = (game: AGame) =>
  A.appleOf(game, stageComposition(game.level, A.appleSeed(game)).decor);
/** The game fighting wave `wave`: only what the rule reads is set. */
function fighting(game: AGame, wave: number, kings = 0) {
  game.wave = wave;
  game.status = 'fighting';
  if (kings) game.kings = kings;
  return game;
}
const wavesWithApple = (make: () => AGame, waves: number, kings = 0) =>
  Array.from({ length: waves }, (_, i) => i + 1).filter(
    (wave) => appleIn(fighting(make(), wave, kings)) !== null,
  );

test('une pomme toutes les trois vagues, dans chaque mode', () => {
  assert.equal(A.APPLE_EVERY_WAVES, 3);
  assert.equal(A.APPLES_TO_UNLOCK, 12);
  // The great adventure: waves 3, 6, 9 and 12.
  assert.deepEqual(
    wavesWithApple(() => new Game(2026, undefined, undefined, 7), 12),
    [3, 6, 9, 12],
  );
  // Each mission: its third wave, whether it has three or four.
  for (const { id, waves } of MISSIONS)
    assert.deepEqual(
      wavesWithApple(() => new Game(7, undefined, createMissionRun(id, 7)), waves.length),
      [3],
      id,
    );
  // The endless adventure counts on from its first wave: 15 and 18 after one king, 27 after two.
  const endless = () => new Game(11, undefined, undefined, 7, undefined, ENDLESS_RULES[1]);
  assert.deepEqual(wavesWithApple(endless, 12, 1), [3, 6, 9, 12]);
  assert.equal(appleIn(fighting(endless(), 3, 1))!.wave, 15);
  assert.equal(appleIn(fighting(endless(), 3, 2))!.wave, 27);
  // A battle of « La Grande Expédition »: its third wave.
  const battle = () => X.createExpeditionGame(X.planExpedition(4242)!, X.startExpedition(4242)!)!;
  assert.ok(battle(), 'a battle of the expedition opens');
  assert.deepEqual(wavesWithApple(battle, battle().totalWaves), [3]);
  // Between two waves, and before the first, nothing.
  for (const wave of [0, -3, 1.5, NaN]) assert.equal(A.waveHasApple(wave), false);
});

test('la même partie montre la même pomme, au même endroit, après le même temps', () => {
  const make = () => fighting(new Game(33, undefined, createMissionRun('refuge', 33)), 3);
  const apple = appleIn(make())!;
  assert.deepEqual(appleIn(make()), apple);
  // Retyped: a change here moves every apple a child is looking for.
  assert.equal(apple.id, '33:3');
  assert.equal(apple.wave, 3);
  assert.equal(Math.round(apple.x), 438);
  assert.equal(Math.round(apple.y), 114);
  assert.equal(apple.delay.toFixed(3), '5.996');
  const classic = appleIn(fighting(new Game(2026, undefined, undefined, 7), 6))!;
  assert.deepEqual(
    [classic.id, Math.round(classic.x), Math.round(classic.y), classic.delay.toFixed(3)],
    ['2026:6', 194, 94, '14.626'],
  );
  // Another seed, another wave: another apple, under another name.
  assert.notEqual(
    appleIn(fighting(new Game(34, undefined, createMissionRun('refuge', 34)), 3))!.id,
    apple.id,
  );
  assert.notEqual(appleIn(fighting(new Game(2026, undefined, undefined, 7), 9))!.id, classic.id);
});

test('la pomme ne touche à rien de la bataille', () => {
  const game = new Game(33, undefined, createMissionRun('refuge', 33));
  assert.ok(game.startWave());
  for (let i = 0; i < 40; i++) game.step(0.05);
  game.wave = 3;
  const before = JSON.stringify(game);
  const rng = game.rng;
  assert.ok(appleIn(game));
  assert.equal(game.rng, rng, 'the stream of the fight is not drawn');
  assert.equal(JSON.stringify(game), before, 'nothing of the game changes');
  assert.ok(!Object.keys(game).some((key) => /apple|pomme/i.test(key)));
});

test('sur chaque terrain, la pomme est hors des routes, des rochers, du décor et des écrits', () => {
  const levels = [
    ...new Map([1, 4, 7, 10].map((wave) => [levelForWave(wave).id, levelForWave(wave)])).values(),
    ...([0, 1, 2] as const).map((layout) => missionLevel(layout)),
  ];
  assert.equal(levels.length, 6, 'three terrains of the adventure, three of the expeditions');
  const level = (id: string) => levels.find((l) => l.id === id)!;
  let found = 0;
  for (const terrain of levels) {
    const roads = [0, 1, 2]
      .flatMap((lane) => laneRoad(lane, terrain))
      .concat(...routeJunctions(terrain).map((x) => junctionRoad(x, terrain)));
    for (let s = 0; s < 300; s++) {
      const seed = Math.imul(s, 2654435761) >>> 0;
      const props = stageComposition(terrain, seed).decor;
      const game = { wave: 3, kings: 0, endless: null, initialSeed: seed, mission: null };
      const apple = A.appleOf({ ...game, level: level(terrain.id) }, props);
      assert.ok(apple, `${terrain.id} ${seed}: an apple`);
      found++;
      const { x, y, delay } = apple;
      assert.ok(delay >= 4 && delay < 15, 'between 4 and 15 seconds after the wave starts');
      assert.ok(
        A.APPLE_ZONES.some((z) => x >= z.left && x <= z.right && y >= z.top && y <= z.bottom),
        'in one of the zones of the top of the board',
      );
      assert.ok(roads.every((p) => Math.hypot(p.x - x, p.y - y) >= A.APPLE_RADIUS + 43));
      assert.ok(terrain.rocks.every((r) => Math.hypot(r.x - x, r.y - y) >= r.r + A.APPLE_RADIUS));
      assert.ok(props.every((p) => Math.hypot(p.x - x, p.y - y) >= p.radius + A.APPLE_RADIUS));
    }
  }
  assert.equal(found, 1800);
  // The zones: out of the dens, the river, the camp and the crystal, under the top of the
  // board where the page writes the lanes of the first expedition and the king's gauge.
  for (const z of A.APPLE_ZONES) {
    assert.ok(z.top - A.APPLE_RADIUS >= 24 && z.bottom + A.APPLE_RADIUS <= 140);
    assert.ok(z.left - A.APPLE_RADIUS >= 150 && z.right + A.APPLE_RADIUS <= 935);
    assert.ok(z.right + A.APPLE_RADIUS < 470 || z.left - A.APPLE_RADIUS > 590, 'not on the river');
    // In the columns of the camp, above it: a tap that places an ally is never on the apple.
    if (z.right + A.APPLE_RADIUS >= 600) assert.ok(z.bottom + A.APPLE_RADIUS <= 108);
    // Beside the middle of the top band, where the lanes are written (up to 72 units high).
    if (z.top - A.APPLE_RADIUS < 76)
      assert.ok(z.right + A.APPLE_RADIUS < 300 || z.left - A.APPLE_RADIUS > 800);
  }
});
