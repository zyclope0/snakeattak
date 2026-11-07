import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun } from '../src/missions.ts';
import {
  createMissionProgress,
  createMissionProgressController,
  readMissionProgress,
  validateMissionProgress,
} from '../src/missionProgress.ts';

test('only a completed expedition awards stars and unlocks its successor', () => {
  const progress = createMissionProgressController();
  assert.equal(progress.unlocked('refuge'), true);
  assert.equal(progress.unlocked('trois-ponts'), false);
  assert.equal(progress.unlocked('unknown' as never), false);
  const run = createMissionRun('refuge', 42);
  assert.equal(progress.started(createMissionRun('course', 42)), false);
  assert.equal(progress.started(run), true);
  const game = new Game(42, undefined, run);
  assert.equal(progress.record(game), false);
  assert.equal(progress.state.bestStars.refuge, 0);
  assert.equal(progress.unlocked('trois-ponts'), false);
  game.status = 'lost';
  assert.equal(progress.record(game), false);
  game.status = 'won';
  assert.equal(progress.record(game), false, 'a status alone is not a completed expedition');
  game.wave = game.totalWaves;
  assert.equal(progress.record(game), true);
  assert.equal(progress.state.bestStars.refuge, 3);
  assert.equal(progress.unlocked('trois-ponts'), true);
  assert.equal(progress.unlocked('course'), false);
  game.missionMinBase = 30;
  assert.equal(progress.record(game), false);
  assert.equal(progress.state.bestStars.refuge, 3);
  const classic = new Game(1);
  classic.status = 'won';
  classic.wave = 12;
  assert.equal(progress.record(classic), false);
});

test('mode switches keep a separate classic army and deterministic expedition retry', () => {
  const progress = createMissionProgressController();
  const classic = new Game(17);
  classic.gold = 999;
  assert.equal(progress.rememberCamp(classic), true);
  const oldCamp = progress.state.classicCamp;
  const run = createMissionRun('refuge', 818);
  assert.equal(progress.started(run), true);
  const game = new Game(818, undefined, run);
  assert.equal(progress.sync(game), true);
  assert.equal(progress.state.classicCamp, oldCamp);
  assert.deepEqual(progress.lastRun('refuge'), run);
  const missionCamp = progress.state.retryCamp;
  assert.ok(missionCamp);
  assert.deepEqual(decodeCheckpoint(missionCamp)!.mission, run);
  game.status = 'fighting';
  assert.equal(progress.rememberCamp(game), false);
  assert.equal(progress.state.retryCamp, missionCamp);
  assert.equal(progress.switchMode('classic'), oldCamp);
  assert.equal(progress.switchMode('missions'), missionCamp);
  assert.equal(decodeCheckpoint(progress.switchMode('classic')!)!.gold, 999);
  const freshRun = createMissionRun('refuge', 919, run);
  assert.equal(progress.started(freshRun), true);
  assert.equal(progress.state.retryCamp, null);
  assert.deepEqual(progress.lastRun('refuge'), freshRun);
  assert.equal(progress.state.classicCamp, oldCamp);
});

test('progress validation rejects malformed fields without modifying live progress', () => {
  const progress = createMissionProgressController();
  const valid = createMissionProgress();
  assert.deepEqual(readMissionProgress(JSON.stringify(valid)), valid);
  assert.ok(validateMissionProgress(valid));
  const invalids: unknown[] = [
    { ...valid, version: 2 },
    { ...valid, bestStars: { ...valid.bestStars, refuge: NaN } },
    { ...valid, bestStars: { ...valid.bestStars, refuge: 4 } },
    { ...valid, bestStars: { ...valid.bestStars, surprise: 2 } },
    { ...valid, bestStars: { refuge: 0 } },
    { ...valid, lastRuns: { surprise: createMissionRun('refuge', 1) } },
    { ...valid, lastRuns: { refuge: createMissionRun('course', 1) } },
    { ...valid, lastRuns: { refuge: { ...createMissionRun('refuge', 1), seed: Infinity } } },
    { ...valid, lastRuns: [] },
    { ...valid, retryCamp: encodeCheckpoint(new Game(1)) },
    { ...valid, classicCamp: 'invalid' },
    { ...valid, activeMode: 'other' },
  ];
  const cycle = { ...valid, cycle: {} };
  cycle.cycle = cycle;
  invalids.push(cycle);
  for (const invalid of invalids) {
    assert.equal(validateMissionProgress(invalid), null);
    assert.equal(progress.replaceState(invalid as never), false);
    assert.deepEqual(progress.state, valid);
  }
  const copy = progress.state;
  copy.bestStars.refuge = 3;
  assert.equal(progress.state.bestStars.refuge, 0);
  const next = createMissionProgress();
  next.bestStars.refuge = 2;
  assert.equal(progress.replaceState(next), true);
  next.bestStars.refuge = 0;
  assert.equal(progress.state.bestStars.refuge, 2);
});
