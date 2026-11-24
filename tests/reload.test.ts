import test from 'node:test';
import assert from 'node:assert/strict';
import { beforeReload, reloadPage } from '../src/ui/reload.ts';

const page = () => {
  const calls: string[] = [];
  return { calls, reload: () => void calls.push('reload') };
};
const soon = (ms: number) => new Promise((done) => setTimeout(done, ms));

// One file, in this order: what is said before a reload stays said for the tests after it.
test('with nothing to do first, the page is reloaded at once', () => {
  const tab = page();
  reloadPage(tab);
  assert.deepEqual(tab.calls, ['reload']);
});

test('what was to be done first is done before the page goes', async () => {
  const tab = page();
  beforeReload(async () => void tab.calls.push('given back'));
  reloadPage(tab);
  assert.deepEqual(tab.calls, ['given back'], 'the page is still there while it is done');
  await soon(20);
  assert.deepEqual(tab.calls, ['given back', 'reload']);
});

test('a task that fails, or never ends, does not keep the page', async () => {
  const failing = page();
  beforeReload(() => Promise.reject(new Error('no native side')));
  reloadPage(failing);
  await soon(20);
  assert.deepEqual(failing.calls, ['reload']);
  const stuck = page();
  beforeReload(() => new Promise(() => {}));
  reloadPage(stuck);
  await soon(100);
  assert.deepEqual(stuck.calls, [], 'it waits a little');
  await soon(400);
  assert.deepEqual(stuck.calls, ['reload'], 'but not for long');
});
