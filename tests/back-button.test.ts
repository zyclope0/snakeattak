import test from 'node:test';
import assert from 'node:assert/strict';
import { backStep, nativeBack, type BackScene } from '../src/ui/backButton.ts';

const scene = (on: Partial<BackScene>): BackScene => ({
  window: false,
  board: false,
  over: false,
  page: false,
  ...on,
});

test('« retour » does what the nearest button would do', () => {
  assert.equal(backStep(scene({})), 'leave', 'the first screen of the home');
  assert.equal(backStep(scene({ page: true })), 'page', 'a page of the home');
  assert.equal(backStep(scene({ board: true })), 'pause', 'a battle, or its camp');
  assert.equal(backStep(scene({ board: true, over: true })), 'home', 'a game won or lost');
});

test('an open window is asked first, whatever is behind it', () => {
  for (const behind of [{}, { page: true }, { board: true }, { board: true, over: true }])
    assert.equal(backStep(scene({ ...behind, window: true })), 'window');
});

test('the board hides the page of the home it was started from', () => {
  // The mission page stays shown under the board: « retour » pauses, it does not turn pages.
  assert.equal(backStep(scene({ board: true, page: true })), 'pause');
  assert.equal(backStep(scene({ board: true, over: true, page: true })), 'home');
});

test('only the home, with nothing over it, lets the application be left', () => {
  const all = [false, true];
  for (const window of all)
    for (const board of all)
      for (const over of all)
        for (const page of all)
          assert.equal(
            backStep({ window, board, over, page }) === 'leave',
            !window && !board && !page,
          );
});

test('« retour » is taken only from a native side that carries the module', () => {
  assert.equal(nativeBack(undefined), false, 'a browser');
  assert.equal(nativeBack({}), false, 'a native side that names no module');
  assert.equal(
    nativeBack({ PluginHeaders: [{ name: 'Filesystem' }, { name: 'Share' }] }),
    false,
    'an application built before the module',
  );
  assert.equal(nativeBack({ PluginHeaders: [{ name: 'Share' }, { name: 'App' }] }), true);
});
