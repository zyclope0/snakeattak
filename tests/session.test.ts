import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';

test('simulation à pas fixe indépendante du nombre d’images', () => {
  const a = new Session(32),
    b = new Session(32);
  a.game.startWave();
  b.game.startWave();
  for (let i = 0; i < 300; i++) a.advance(1000 / 60);
  for (let i = 0; i < 150; i++) b.advance(1000 / 30);
  assert.deepEqual(a.game, b.game);
});
test('pause, reprise et redémarrage sans temps accumulé résiduel', () => {
  const s = new Session(1);
  s.advance(20);
  s.game.paused = true;
  s.advance(10000);
  assert.equal(s.game.time, 0);
  s.game.paused = false;
  s.advance(20);
  assert.equal(s.game.time, 0);
  s.speed = 2;
  s.selected = 'ninja';
  s.restart(1);
  assert.equal(s.speed, 1);
  assert.equal(s.selected, null);
  assert.equal(s.game.wave, 0);
  s.advance(20);
  assert.equal(s.game.time, 0);
});
test('une image bloquée ou une durée invalide ne provoque pas de rattrapage infini', () => {
  const s = new Session(4);
  s.advance(NaN);
  s.advance(-2);
  s.advance(Infinity);
  assert.equal(s.game.time, 0);
  s.advance(60000);
  assert.ok(s.game.time <= 0.101);
  assert.ok(s.game.time > 0);
});
