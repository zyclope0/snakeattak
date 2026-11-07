import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameMetrics } from '../src/render/frameMetrics.ts';

test('le compteur calcule fréquence et coût CPU sans mélanger les deux', () => {
  const m = new FrameMetrics(120);
  for (let i = 0; i < 60; i++) m.record(1000 / 60, 2);
  const s = m.snapshot();
  assert.equal(s.frames, 60);
  assert.ok(Math.abs(s.fps - 60) < 1e-8);
  assert.equal(s.updateP95Ms, 2);
  assert.ok(Math.abs(s.updateMeanMs - 2) < 1e-8);
});
test('la fenêtre est bornée et oublie les anciennes images lentes', () => {
  const m = new FrameMetrics(4);
  m.record(100, 20);
  for (let i = 0; i < 4; i++) m.record(20, 1);
  assert.equal(m.snapshot().frames, 4);
  assert.equal(m.snapshot().fps, 50);
  assert.equal(m.snapshot().updateP95Ms, 1);
});
test('valeurs invalides et retour d’onglet suspendu ne polluent pas la mesure', () => {
  const m = new FrameMetrics(8);
  for (const pair of [
    [NaN, 1],
    [0, 1],
    [-1, 2],
    [Infinity, 1],
    [1001, 1],
    [16, -1],
    [16, NaN],
  ])
    assert.equal(m.record(...(pair as [number, number])), false);
  assert.deepEqual(m.snapshot(), {
    frames: 0,
    fps: 0,
    frameP95Ms: 0,
    updateP95Ms: 0,
    updateMeanMs: 0,
  });
  assert.equal(m.record(100, 30), true);
  assert.equal(m.snapshot().fps, 10);
  assert.throws(() => new FrameMetrics(0), RangeError);
});
