import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceRecording, performanceEnabled } from '../src/render/performanceRecording.ts';

test('les fenêtres complètes donnent médiane/minimum sans inventer une mesure vide', () => {
  const r = new PerformanceRecording();
  assert.equal(r.snapshot().fpsMedian, null);
  for (let i = 0; i < 50; i++) r.record(20);
  for (let i = 0; i < 25; i++) r.record(40);
  assert.equal(r.snapshot().fpsMedian, 37.5);
  assert.equal(r.snapshot().fpsMin, 25);
  assert.equal(r.snapshot().activeMs, 2000);
  assert.equal(r.snapshot().longestFrameMs, 40);
});
test('la mesure reste bornée, exclut les valeurs invalides et inclut les vrais blocages', () => {
  const r = new PerformanceRecording(2);
  for (const x of [NaN, Infinity, 0, -1]) assert.equal(r.record(x), false);
  r.record(2000);
  r.record(1000);
  r.record(5000);
  assert.equal(r.snapshot().windows, 2);
  assert.equal(r.snapshot().fpsMin, 0.2);
  assert.equal(r.snapshot().truncated, true);
  r.reset();
  assert.equal(r.snapshot().windows, 0);
  assert.equal(r.snapshot().longestFrameMs, null);
});
test('le compteur de production exige perf=1 et conserve l’ancienne option DEV', () => {
  assert.equal(performanceEnabled('', false), false);
  assert.equal(performanceEnabled('?perf=0', false), false);
  assert.equal(performanceEnabled('?debug-performance', false), false);
  assert.equal(performanceEnabled('?perf=1', false), true);
  assert.equal(performanceEnabled('?debug-performance', true), true);
});
