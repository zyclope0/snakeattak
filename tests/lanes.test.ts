import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { LANES, laneDefense, chooseLane } from '../src/ai.ts';
import { findPath } from '../src/navigation.ts';
test('trois voies traversent la rivière et les jonctions les relient', () => {
  assert.equal(LANES.length, 3);
  for (const y of LANES) {
    const path = findPath({ x: 444, y }, { x: 612, y });
    assert.ok(path.length > 0);
    assert.ok(path.every((p) => Math.abs(p.y - y) < 40));
  }
  for (const y of LANES)
    assert.ok(findPath({ x: 372, y: LANES[0] }, { x: 372, y }).length > 0 || y === LANES[0]);
});
test('le score tient compte des combattants, soins, palissades et santé', () => {
  const g = new Game();
  g.units = [];
  g.recruit('wall', 780, 180);
  const s = laneDefense(g.units);
  assert.ok(s[0] > s[2]);
  g.units[0].hp = 1;
  assert.ok(laneDefense(g.units)[0] < s[0]);
});
test('IA avancée privilégie davantage la voie faible, sans supprimer les autres', () => {
  const scores = [10, 4, 0];
  let low = 0,
    high = 0;
  const counts = [0, 0, 0];
  for (let i = 0; i < 1000; i++) {
    const random = (i + 0.5) / 1000;
    const a = chooseLane(scores, 1, random),
      b = chooseLane(scores, 6, random);
    if (a === 2) low++;
    if (b === 2) high++;
    counts[b]++;
  }
  assert.ok(high > low + 100);
  assert.ok(high > 600);
  assert.ok(counts.every((c) => c > 0));
});
test('œufs : incubation suspendue en pause, éclosion ajoute des serpents et retarde la fin', () => {
  const g = new Game();
  g.startWave();
  assert.ok(g.eggs.length > 0);
  const timers = g.eggs.map((e) => e.hatchIn);
  g.paused = true;
  g.step(0.05);
  assert.deepEqual(
    g.eggs.map((e) => e.hatchIn),
    timers,
  );
  g.paused = false;
  g.remaining = 0;
  g.enemies = [];
  g.step(0.05);
  assert.equal(g.status, 'fighting');
  g.eggs.forEach((e) => (e.hatchIn = 0));
  g.step(0.05);
  assert.equal(g.eggs.length, 0);
  assert.ok(g.enemies.length >= 2);
});
test('nouvelle partie avec la même graine reproduit éclosions et choix', () => {
  const a = new Game(15),
    b = new Game(15);
  a.startWave();
  b.startWave();
  for (let i = 0; i < 800; i++) {
    a.step(1 / 30);
    b.step(1 / 30);
  }
  assert.deepEqual(a, b);
});
test('les serpents changent réellement de voie à la jonction face à une défense concentrée', () => {
  let changes = 0;
  for (let i = 0; i < 40; i++) {
    const g = new Game(i * 10000019);
    g.units = [];
    g.wave = 5;
    g.startWave();
    g.step(0.05);
    const e = g.enemies[0];
    e.x = 372;
    e.y = LANES[0];
    e.lane = 0;
    e.stage = 0;
    for (const y of [144, 180, 216]) g.recruit('club', 780, y);
    g.step(0.05);
    assert.equal(e.stage, 1);
    if (e.lane !== 0) changes++;
  }
  assert.ok(changes >= 30, `seulement ${changes} changements sur 40`);
});
test('un changement de voie suit la liaison verticale avant de repartir vers la base', () => {
  const g = new Game();
  g.wave = 5;
  g.units = [];
  g.startWave();
  g.step(0.05);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  e.x = 684;
  e.y = 180;
  e.lane = 2;
  e.stage = 4;
  e.turnY = 468;
  e.nav = 0;
  e.path = [];
  for (let i = 0; i < 40; i++) g.step(1 / 30);
  assert.ok(e.y > 210, `le serpent ne suit pas la liaison : ${e.x},${e.y}`);
  assert.ok(Math.abs(e.x - 684) < 20, `coupe hors jonction : ${e.x}`);
});
