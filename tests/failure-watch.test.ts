import test from 'node:test';
import assert from 'node:assert/strict';
import { describeFailure, watchBoard } from '../src/failureWatch.ts';
import { FAMILY_REFUSED_KEY, FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';
import { PLAYER_IDS, playerKey } from '../src/players.ts';

// A frame that throws stops the board for good. The watcher tells it apart from an error the
// board survives, and from a board put to sleep on purpose.

function stage() {
  const listeners = new Map<string, (event: unknown) => void>();
  const frames: (() => void)[] = [];
  const board = { count: 10, alive: true, awake: true };
  const told: string[] = [];
  watchBoard(
    { frame: () => board.count, running: () => board.awake },
    (detail) => told.push(detail),
    {
      addEventListener: (name: string, listener: (event: unknown) => void) =>
        void listeners.set(name, listener),
      requestAnimationFrame: (callback: () => void) => frames.push(callback),
    } as never,
  );
  return {
    board,
    told,
    error: (error: unknown) => listeners.get('error')!({ error, message: 'script error' }),
    rejection: (reason: unknown) => listeners.get('unhandledrejection')!({ reason }),
    /** The browser draws: the board counts a frame if it lives, then the waiting calls run. */
    draw(times: number) {
      for (let i = 0; i < times; i++) {
        if (board.alive && board.awake) board.count++;
        frames.splice(0).forEach((frame) => frame());
      }
    },
  };
}

test('a board that no longer draws after an error is told once, with the error in a line', () => {
  const s = stage();
  s.board.alive = false;
  s.error(new TypeError('snake is undefined'));
  s.draw(2);
  assert.deepEqual(s.told, [], 'the board is given three frames');
  s.draw(1);
  assert.deepEqual(s.told, ['TypeError: snake is undefined']);
  // Later errors say nothing more: the window is already there.
  s.error(new Error('again'));
  s.rejection('late');
  s.draw(10);
  assert.equal(s.told.length, 1);
});

test('an error the board survives says nothing, and the next one is still watched', () => {
  const s = stage();
  s.error(new Error('a sound that would not play'));
  s.rejection(new Error('an image that would not load'));
  s.draw(5);
  assert.deepEqual(s.told, []);
  s.board.alive = false;
  s.rejection('the board is gone');
  s.draw(3);
  assert.deepEqual(s.told, ['the board is gone']);
});

test('an error that stops the board while another is still waited on is not lost', () => {
  const s = stage();
  // A first error the board survives: it draws one more frame.
  s.error(new Error('a sound that would not play'));
  s.draw(1);
  // Then the frame that kills it, before the three frames of the first are over.
  s.board.alive = false;
  s.error(new RangeError('the frame that stops everything'));
  s.draw(2);
  assert.deepEqual(s.told, [], 'the wait starts again from the latest error');
  s.draw(1);
  assert.deepEqual(s.told, ['RangeError: the frame that stops everything']);
  // And the other way round: a fatal error followed by noise is told with its own words.
  const t = stage();
  t.board.alive = false;
  t.error(new Error('fatal'));
  t.draw(1);
  t.rejection('noise');
  t.draw(3);
  assert.deepEqual(t.told, ['Error: fatal']);
});

test('errors that keep coming on a dead board neither delay the window nor rename the failure', () => {
  // One more error at every frame, for as long as one likes: the window comes after three.
  const s = stage();
  s.board.alive = false;
  s.error(new RangeError('the frame that stops everything'));
  for (let frame = 0; frame < 3; frame++) {
    s.rejection('a timer that keeps failing');
    s.error(new Error('noise'));
    s.draw(1);
  }
  assert.deepEqual(s.told, ['RangeError: the frame that stops everything']);
  // An error every other frame does no better.
  const t = stage();
  t.board.alive = false;
  t.error(new TypeError('fatal'));
  t.draw(1);
  t.error(new Error('noise'));
  t.draw(1);
  t.error(new Error('noise'));
  t.draw(1);
  assert.deepEqual(t.told, ['TypeError: fatal']);
});

test('a board asleep because the page is hidden is not a board that failed', () => {
  const s = stage();
  s.board.awake = false;
  s.error(new Error('while hidden'));
  s.draw(5);
  assert.deepEqual(s.told, []);
  // Back on screen and drawing: still nothing. Stopped for good: told.
  s.board.awake = true;
  s.error(new Error('seen again'));
  s.draw(5);
  assert.deepEqual(s.told, []);
  s.board.alive = false;
  s.error(new Error('now it stops'));
  s.draw(3);
  assert.deepEqual(s.told, ['Error: now it stops']);
});

test('the detail is one short line: a name and a message, never a stack', () => {
  assert.equal(describeFailure(new RangeError('too far')), 'RangeError: too far');
  assert.equal(describeFailure('plain words'), 'plain words');
  assert.equal(describeFailure(undefined), 'Error');
  assert.equal(describeFailure({ stack: 'at secret (file.ts:1)' }), 'Error');
  assert.equal(describeFailure(new Error('x'.repeat(500))).length, 200);
  // An error event without its error object still gives its message.
  const s = stage();
  s.board.alive = false;
  s.error(undefined);
  s.draw(3);
  assert.deepEqual(s.told, ['script error']);
});

test('the rescue finds the family file of each player, as stored, and nothing else', async () => {
  // The module builds buttons: it is loaded here for its reader alone, which touches no page.
  const names: Record<string, unknown> = { document: {}, localStorage: {} };
  for (const [name, value] of Object.entries(names))
    if (!(name in globalThis)) Object.assign(globalThis, { [name]: value });
  const { registerHooks } = await import('node:module');
  registerHooks({
    load(url, context, nextLoad) {
      if (url.endsWith('.css'))
        return { format: 'module', source: 'export default "";', shortCircuit: true };
      return nextLoad(url, context);
    },
  });
  const { storedFamilyFiles } = await import('../src/ui/failure/rescue.ts');
  const stored = new Map<string, string>([
    ['conquete-serpents:players:v1', '{"players":4}'],
    [playerKey(FAMILY_STORAGE_KEY, 'p3'), 'third'],
    [FAMILY_REFUSED_KEY, 'a copy put aside'],
    [FAMILY_STORAGE_KEY, 'first, even {damaged'],
    [`${FAMILY_STORAGE_KEY}:p9x`, 'not a player'],
    [`${FAMILY_STORAGE_KEY}-old`, 'not a family file'],
    [playerKey(FAMILY_STORAGE_KEY, 'p2'), ''],
  ]);
  const device = {
    get length() {
      return stored.size;
    },
    key: (index: number) => [...stored.keys()][index] ?? null,
    getItem: (key: string) => stored.get(key) ?? null,
  };
  assert.deepEqual(storedFamilyFiles(device), [
    { player: 1, raw: 'first, even {damaged' },
    { player: 3, raw: 'third' },
  ]);
  // Every player the game knows has a key the rescue recognises.
  for (const [index, id] of PLAYER_IDS.entries()) {
    const one = new Map([[playerKey(FAMILY_STORAGE_KEY, id), 'x']]);
    const files = storedFamilyFiles({
      length: 1,
      key: () => [...one.keys()][0]!,
      getItem: (key: string) => one.get(key) ?? null,
    });
    assert.deepEqual(files, [{ player: index + 1, raw: 'x' }], id);
  }
});
