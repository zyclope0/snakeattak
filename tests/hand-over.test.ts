import test from 'node:test';
import assert from 'node:assert/strict';

const { canHandOver, handOver } = await import('../src/ui/download.ts');

// A file the family asks for (export, copies, start-up rescue) goes through one function that
// says what became of it. The Android application cannot hand a file over: asking for one did
// nothing at all, and the game said « Fichier prêt » all the same (the parent's phone, build
// 64, 22 November 2026).

test('the application build hands no file over; every other build does', () => {
  assert.equal(canHandOver('android'), false);
  for (const mode of ['production', 'development', 'portable', 'ads-preview', 'ads-test', ''])
    assert.equal(canHandOver(mode), true, mode);
  // Outside a build (these tests), nothing says « application ».
  assert.equal(canHandOver(), true);
});

test('a hand-over that breaks is said to have failed, never to be ready', () => {
  // No page here: the browser's part throws, as it would where downloads are refused.
  assert.equal(typeof document, 'undefined');
  assert.equal(handOver('{"version":6}', 'conquete-serpents-famille.json'), 'failed');
});
