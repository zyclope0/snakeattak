import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { waveBriefing } from '../src/waves.ts';
function spawns(wave: number, seconds: number) {
  const g = new Game(23);
  g.units = [];
  g.wave = wave - 1;
  g.startWave();
  g.eggs = [];
  const seen = new Set<number>(),
    born: { time: number; lane: number }[] = [];
  for (let i = 0; i < seconds * 30; i++) {
    g.step(1 / 30);
    for (const e of g.enemies)
      if (!seen.has(e.id)) {
        seen.add(e.id);
        born.push({ time: g.time, lane: e.lane });
      }
  }
  return born;
}
test('les ruées arrivent en petits groupes séparés par une respiration', () => {
  const b = spawns(3, 6),
    intervals = b.slice(1).map((v, i) => v.time - b[i].time);
  assert.ok(intervals.some((t) => t < 0.5));
  assert.ok(intervals.some((t) => t > 1.8));
  assert.match(waveBriefing(3).tip, /groupes/i);
});
test('les trois fronts débutent par trois voies distinctes', () => {
  for (const w of [2, 6, 10]) {
    const b = spawns(w, 3);
    assert.equal(new Set(b.slice(0, 3).map((e) => e.lane)).size, 3);
  }
});
test('la couvée échelonne ses éclosions et couvre les trois voies', () => {
  const g = new Game();
  g.wave = 7;
  g.startWave();
  const times = g.eggs.map((e) => e.hatchIn).sort((a, b) => a - b);
  assert.ok(times[1] - times[0] >= 3 && times[2] - times[1] >= 3);
  assert.ok(times[2] >= 18);
  assert.equal(new Set(g.eggs.map((e) => e.lane)).size, 3);
  const before = g.eggs.map((e) => e.hatchIn),
    timer = g.spawnTimer;
  g.paused = true;
  g.step(0.05);
  assert.deepEqual(
    g.eggs.map((e) => e.hatchIn),
    before,
  );
  assert.equal(g.spawnTimer, timer);
  assert.match(waveBriefing(8).tip, /éclosions/i);
});
