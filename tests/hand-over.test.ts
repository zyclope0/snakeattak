import test from 'node:test';
import assert from 'node:assert/strict';

const { canHandOver, handOver, oneAtATime, shareInApp } = await import('../src/ui/download.ts');

// A file the family asks for (export, copies, start-up rescue) goes through one function that
// says what became of it. In the Android application a browser download did nothing at all,
// and the game said « Fichier prêt » all the same (the parent's phone, build 64, 22 November
// 2026). From build 65 the application writes the file and opens Android's share sheet,
// through two official Capacitor plugins (the parent's agreement, 22 November 2026).

const withPlugins = () => true;
const without = () => false;

test('a website always hands a file over; the application only with its two plugins', () => {
  for (const mode of ['production', 'development', 'portable', 'ads-preview', 'ads-test', ''])
    assert.equal(canHandOver(mode, without), true, mode);
  assert.equal(canHandOver('android', without), false, 'build 64: nothing receives the file');
  assert.equal(canHandOver('android', withPlugins), true, 'build 65 and later');
  // Outside a build (these tests), nothing says « application ».
  assert.equal(canHandOver(), true);
});

test('the native side is asked what it offers: both plugins, or no file', () => {
  const headers = (...names: string[]) => ({ PluginHeaders: names.map((name) => ({ name })) });
  const native = (bridge: unknown) => () =>
    canHandOver('android', () => {
      const old = (globalThis as { Capacitor?: unknown }).Capacitor;
      (globalThis as { Capacitor?: unknown }).Capacitor = bridge;
      try {
        return canHandOver('android');
      } finally {
        (globalThis as { Capacitor?: unknown }).Capacitor = old;
      }
    });
  assert.equal(native(headers('Filesystem', 'Share'))(), true);
  assert.equal(native(headers('Share'))(), false, 'a plugin missing: no file');
  assert.equal(native(headers('Filesystem'))(), false);
  assert.equal(native({})(), false, 'a bridge that announces nothing');
  assert.equal(native(undefined)(), false, 'no native side: a browser');
});

test('in the application: written in the cache, then shared; each outcome said as it is', async () => {
  const done: string[] = [];
  const plugins = (share: () => Promise<boolean>, write = async () => 'file:///cache/f.json') => ({
    write: async (name: string, text: string) => {
      done.push(`write ${name} ${text}`);
      return write();
    },
    share: async (name: string, uri: string) => {
      done.push(`share ${name} ${uri}`);
      return share();
    },
  });
  const ok = plugins(async () => true);
  assert.equal(await shareInApp('{"v":6}', 'f.json', withPlugins, async () => ok), 'saved');
  assert.deepEqual(done, ['write f.json {"v":6}', 'share f.json file:///cache/f.json']);
  // The family left the game, came back and closed the sheet: the plugin succeeds, but names
  // no app. Nothing says the file went anywhere.
  const left = plugins(async () => false);
  assert.equal(await shareInApp('x', 'f.json', withPlugins, async () => left), 'canceled');
  // The sheet went without the game being left: the plugin says « canceled ».
  const closed = plugins(async () => {
    throw new Error('Share canceled');
  });
  assert.equal(await shareInApp('x', 'f.json', withPlugins, async () => closed), 'canceled');
  // Anything else is a failure, never « ready ».
  const broken = plugins(async () => {
    throw new Error('Can’t share while sharing is in progress');
  });
  assert.equal(await shareInApp('x', 'f.json', withPlugins, async () => broken), 'failed');
  const unwritten = plugins(
    async () => true,
    async () => {
      throw new Error('disk full');
    },
  );
  assert.equal(await shareInApp('x', 'f.json', withPlugins, async () => unwritten), 'failed');
  assert.equal(
    await shareInApp('x', 'f.json', withPlugins, async () => {
      throw new Error('the plugin did not load');
    }),
    'failed',
  );
  // Without the plugins, nothing is even tried.
  let loaded = false;
  assert.equal(
    await shareInApp('x', 'f.json', without, async () => {
      loaded = true;
      return ok;
    }),
    'unavailable',
  );
  assert.equal(loaded, false);
});

test('on a website, a hand-over that breaks is said to have failed, never to be ready', async () => {
  // No page here: the browser's part throws, as it would where downloads are refused.
  assert.equal(typeof document, 'undefined');
  assert.equal(await handOver('{"version":6}', 'conquete-serpents-famille.json'), 'failed');
});

test('a second tap while the share sheet is open waits for the first one', async () => {
  let runs = 0;
  let answer: (value: 'saved') => void = () => {};
  const once = oneAtATime(() => {
    runs += 1;
    return new Promise((resolve) => (answer = resolve));
  });
  const first = once('a', 'f.json');
  const second = once('b', 'g.json');
  assert.equal(runs, 1, 'the plugin is asked once');
  answer('saved');
  assert.deepEqual(await Promise.all([first, second]), ['saved', 'saved']);
  // Once answered, the next tap asks again.
  const third = once('c', 'h.json');
  assert.equal(runs, 2);
  answer('saved');
  assert.equal(await third, 'saved');
  // A failed share does not keep the next one waiting.
  const failing = oneAtATime(async () => {
    runs += 1;
    throw new Error('lost');
  });
  await assert.rejects(failing('d', 'i.json'));
  await assert.rejects(failing('e', 'j.json'));
});
