import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';

// An enemy must turn towards an opponent, rather than retain its travel direction.
test('un serpent mord à gauche en regardant sa cible', () => {
  const g = new Game();
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, { x: 850, y: 324, facing: 1, lane: 1, stage: 5, hp: 10000, maxHp: 10000 });
  g.units = g.units.filter((u) => u.kind === 'hero');
  Object.assign(g.units[0], { x: 828, y: 324, cool: 100 });
  g.step(1 / 30);
  assert.equal(e.state, 'attack');
  assert.equal(e.facing, -1);
});

test('les routes quittent la ligne droite et restent franchissables sur les trois cartes', async () => {
  const routes = await import('../src/routes.ts');
  const { blocked } = await import('../src/navigation.ts');
  const { levelForWave } = await import('../src/levels.ts');
  for (const wave of [1, 5, 9]) {
    const level = levelForWave(wave);
    for (let lane = 0; lane < 3; lane++) {
      const points = routes.laneRoad(lane, level);
      assert.ok(points.some((p) => p.x < 372 && Math.abs(p.y - [180, 324, 468][lane]) > 20));
      for (let i = 0; i < points.length; i++) {
        assert.equal(
          blocked(points[i].x, points[i].y, level),
          false,
          JSON.stringify({ wave, lane, p: points[i] }),
        );
        if (i)
          assert.ok(Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) < 20);
      }
      for (const x of [372, 444, 612, 684, 828, 972]) {
        const p = routes.lanePoint(x, lane, level);
        assert.equal(blocked(p.x, p.y, level), false);
      }
    }
    for (const x of [372, 684])
      for (const p of routes.junctionRoad(x)) assert.equal(blocked(p.x, p.y, level), false);
  }
});

test('la variante au casque regarde dans le sens inverse de son image source', async () => {
  const { spriteFlip } = await import('../src/render/actorLayout.ts');
  assert.equal(spriteFlip('snake', 'runner', 1), true);
  assert.equal(spriteFlip('snake', 'runner', -1), false);
  assert.equal(spriteFlip('snake', 'normal', 1), false);
  assert.equal(spriteFlip('snake', 'normal', -1), true);
  assert.equal(spriteFlip('snake', 'spitter', 1), true);
  // The newcomers are drawn facing right, like the snake family (18 November 2026).
  for (const variant of ['fang', 'rare', 'shadow', 'grasshopper'] as const) {
    assert.equal(spriteFlip('snake', variant, 1), false, variant);
    assert.equal(spriteFlip('snake', variant, -1), true, variant);
  }
  assert.equal(spriteFlip('dragon', 'normal', -1), false);
  assert.equal(spriteFlip('dragon', 'normal', 1), true);
});

test('un monstre suit la courbe du sentier au lieu de marcher sur une ligne horizontale', async () => {
  const { lanePoint } = await import('../src/routes.ts');
  const g = new Game(11);
  g.units = [];
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, { x: 108, y: 180, lane: 0, stage: 0, path: [], nav: 0 });
  while (e.x < 240 && g.time < 15) g.step(1 / 30);
  assert.ok(e.x >= 240);
  assert.ok(Math.abs(e.y - lanePoint(e.x, 0, g.level).y) <= 15, `Sortie du sentier: ${e.y}`);
});

test('deux alliés superposés retrouvent une distance lisible sans traverser un obstacle', () => {
  const g = new Game();
  g.units = g.units.filter((u) => u.kind === 'club');
  for (const u of g.units) Object.assign(u, { x: 828, y: 324, homeX: 828, homeY: 324 });
  for (let i = 0; i < 90; i++) g.step(1 / 30);
  const [a, b] = g.units;
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 35.5);
});

test('toutes les variantes traversent les trois cartes en restant sur les sentiers', async () => {
  const { lanePoint } = await import('../src/routes.ts');
  const { blocked } = await import('../src/navigation.ts');
  const variants = [
    'normal',
    'runner',
    'armored',
    'spitter',
    'clockwork',
    'spring',
    'umbrella',
    'rattlesnake',
    'royal',
    'mamba',
  ] as const;
  for (const wave of [1, 5, 9])
    for (const variant of variants)
      for (let lane = 0; lane < 3; lane++) {
        const g = new Game(29 + lane);
        g.units = [];
        g.wave = wave - 1;
        g.startWave();
        g.step(1 / 30);
        g.remaining = 0;
        g.eggs = [];
        const e = g.enemies[0];
        Object.assign(e, {
          x: 108,
          y: [180, 324, 468][lane],
          lane,
          variant,
          boss: false,
          path: [],
          nav: 0,
        });
        for (let i = 0; i < 5400 && g.status === 'fighting'; i++) {
          const before = { x: e.x, y: e.y };
          g.step(1 / 30);
          assert.equal(blocked(e.x, e.y, g.level), false, `${wave}/${variant}/${lane}`);
          assert.ok(Math.hypot(e.x - before.x, e.y - before.y) < 8, 'aucune téléportation');
          if (e.turnY === null && e.x < 972)
            assert.ok(
              Math.abs(e.y - lanePoint(e.x, e.lane, g.level).y) < 17,
              `hors piste ${wave}/${variant}/${lane}: ${e.x},${e.y}`,
            );
        }
        assert.equal(g.base, 91, `blocage ${wave}/${variant}/${lane}`);
        assert.equal(g.enemies.length, 0);
      }
});

test('un tireur arrière rejoint une portée utile contre un serpent retenu au front', () => {
  const g = new Game();
  g.units = [];
  g.gold = 1000;
  g.wave = 1;
  g.recruit('shield', 660, 324);
  g.recruit('archer', 948, 324);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, {
    x: 620,
    y: 324,
    lane: 1,
    stage: 3,
    hp: 10000,
    maxHp: 10000,
    path: [],
    nav: 0,
  });
  for (let i = 0; i < 240; i++) g.step(1 / 30);
  assert.ok(
    g.units.find((u) => u.kind === 'archer')!.x < 850,
    'le tireur reste hors de portée alors que le bouclier retient le serpent',
  );
  assert.ok(g.units.find((u) => u.kind === 'archer')!.x > 700, 'le tireur conserve sa profondeur');
});

test('un serpent légalement à côté d’un rocher rejoint le chemin sans blocage', () => {
  for (const [wave, x, y, lane] of [
    [5, 756, 140, 0],
    [9, 780, 510, 2],
  ]) {
    const g = new Game(61);
    g.units = [];
    g.wave = wave - 1;
    g.startWave();
    g.step(1 / 30);
    g.remaining = 0;
    g.eggs = [];
    const e = g.enemies[0];
    Object.assign(e, { x, y, lane, stage: 4, path: [], nav: 0, variant: 'normal', boss: false });
    for (let i = 0; i < 7200 && g.status === 'fighting'; i++) {
      const before = { x: e.x, y: e.y };
      g.step(1 / 30);
      assert.ok(Math.hypot(e.x - before.x, e.y - before.y) < 3, 'reprise sans téléportation');
    }
    assert.equal(g.base, 91, `monstre bloqué au rocher: carte ${wave}`);
    assert.equal(g.enemies.length, 0);
  }
});

test('un serpent qui passe un soigneur continue à regarder celui qu’il mord', () => {
  for (const variant of ['normal', 'spitter'] as const)
    for (const boss of [false, true])
      for (const x of [800, 850]) {
        const g = new Game();
        g.units = [];
        g.gold = 1000;
        g.recruit('nurse', x, 324);
        g.startWave();
        g.step(1 / 30);
        g.remaining = 0;
        g.eggs = [];
        const e = g.enemies[0];
        Object.assign(e, {
          x: 828,
          y: 324,
          lane: 1,
          stage: 5,
          variant,
          boss,
          cool: 0,
          path: [],
          nav: 0,
        });
        g.step(1 / 30);
        assert.ok(g.units[0].hp < g.units[0].maxHp);
        assert.equal(e.facing, x < 828 ? -1 : 1, `${variant}/${boss}/${x}`);
        assert.equal(e.state, 'attack');
        assert.ok(e.x > 828, 'le soigneur ne bloque pas la marche');
      }
});
