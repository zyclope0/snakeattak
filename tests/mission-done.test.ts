import test from 'node:test';
import assert from 'node:assert/strict';
import { MARK_LENGTH_LIMIT, campMark, createMissionDone } from '../src/missionDone.ts';
import { MISSION_DONE_KEY } from '../src/storageKeys.ts';
import { memory } from './voyage-helpers.ts';

const camp = 'CAMP-' + 'x'.repeat(4000);

test('the mark of a camp is short, stable, and differs from one camp to the next', () => {
  assert.equal(campMark(camp), campMark(String(camp)));
  assert.ok(campMark(camp).length <= MARK_LENGTH_LIMIT);
  assert.notEqual(campMark(camp), campMark(camp + 'y'));
  assert.notEqual(campMark('ab'), campMark('ba'));
  assert.equal(campMark(''), '0:' + (0x811c9dc5).toString(36));
});

test('a mission won stays finished after the game is closed, until its camp is played again', () => {
  const device = memory();
  createMissionDone(device).mark(camp);
  assert.equal(device.values.get(MISSION_DONE_KEY), campMark(camp));
  // The game is closed and opened again: a new reader, the same device.
  const reopened = createMissionDone(device);
  assert.equal(reopened.finished(camp), true);
  // Another camp, a new departure or no camp at all is not the mission won.
  for (const other of [camp + '!', null, undefined, ''])
    assert.equal(reopened.finished(other), false, String(other));
  reopened.clear();
  assert.equal(reopened.finished(camp), false);
  assert.equal(device.values.has(MISSION_DONE_KEY), false);
});

test('without a usable storage the home behaves as before, never with an error', () => {
  const blocked = memory();
  blocked.blocked = true;
  const done = createMissionDone(blocked);
  done.mark(camp);
  done.clear();
  assert.equal(done.finished(camp), false);
  assert.equal(createMissionDone(undefined).finished(camp), false);
  // A damaged or foreign value is not a mark.
  for (const raw of ['x'.repeat(MARK_LENGTH_LIMIT + 1), 'n’importe quoi'])
    assert.equal(createMissionDone(memory({ [MISSION_DONE_KEY]: raw })).finished(camp), false);
  // Nothing is written for a mission without a camp.
  const empty = memory();
  createMissionDone(empty).mark(null);
  assert.equal(empty.values.size, 0);
});
