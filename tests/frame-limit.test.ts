import test from 'node:test';
import assert from 'node:assert/strict';
import { frameStride, limitFrames, limitRate } from '../src/render/frameLimit.ts';

const hz = (rate: number) => 1000 / rate;

test('only a screen at least twice as fast as 60 Hz skips frames', () => {
  for (const [rate, stride] of [
    [60, 1],
    [75, 1],
    [90, 1],
    [100, 1],
    [119.9, 2],
    [120, 2],
    [144, 2],
    [165, 2],
    [240, 4],
  ])
    assert.equal(frameStride(hz(rate)), stride, `${rate} Hz`);
  assert.equal(frameStride(0), 1);
  assert.equal(frameStride(Number.NaN), 1);
});

test('the wait between two drawn frames tolerates a frame a little early', () => {
  assert.equal(limitRate(hz(60)), 0, 'every frame drawn at 60 Hz');
  assert.equal(limitRate(hz(90)), 0, 'and at 90 Hz');
  const at120 = limitRate(hz(120));
  // At 120 Hz one frame (8.3 ms) is not enough, two (16.7 ms) are, even a millisecond early.
  assert.ok(at120 > hz(120) + 1 && at120 < 2 * hz(120) - 1, String(at120));
});

test('the loop draws every frame until the screen is measured, then follows its pace', () => {
  const loop = { _limitRate: 99 };
  const waiting: ((time: number) => void)[] = [];
  limitFrames(loop, ((callback: (time: number) => void) => {
    waiting.push(callback);
    return 0;
  }) as typeof requestAnimationFrame);
  assert.equal(loop._limitRate, 0);
  let time = 0;
  const run = (frames: number, rate: number) => {
    for (let i = 0; i < frames; i++) {
      waiting.shift()!(time);
      time += hz(rate);
    }
  };
  // A slow start (loading) is not the screen's pace: the next measure corrects it.
  run(31, 30);
  assert.equal(loop._limitRate, 0);
  run(30, 120);
  assert.ok(Math.abs(loop._limitRate - limitRate(hz(120))) < 1e-6, String(loop._limitRate));
  // The screen slows down to 90 Hz: every frame is drawn again.
  run(30, 90);
  assert.equal(loop._limitRate, 0);
  run(30, 144);
  assert.ok(Math.abs(loop._limitRate - limitRate(hz(144))) < 1e-6, String(loop._limitRate));
});
