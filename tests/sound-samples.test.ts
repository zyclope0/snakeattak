import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueOf, createSamples } from '../src/audio/samples.ts';
import { fakeAudioContext, settle } from './sound-fakes.ts';

const files = catalogueOf({
  '../assets/audio/hit-1.mp3': '/a/hit-1.mp3',
  '../assets/audio/hit-2.mp3': '/a/hit-2.mp3',
  '../assets/audio/wave-start-1.mp3': '/a/wave-start-1.mp3',
  '../assets/audio/music-king.mp3': '/a/music-king.mp3',
  '../assets/audio/music-epic.mp3': '/a/music-epic.mp3',
});

/** The browser's music players and downloads, replaced for the length of one test. */
function fakeBrowser(t: { after(restore: () => void): void }) {
  const log: string[] = [];
  const players: { onended: (() => void) | null }[] = [];
  const downloads: (() => void)[] = [];
  class Player {
    onended: (() => void) | null = null;
    loop = false;
    preload = '';
    private readonly name: string;
    constructor(url: string) {
      this.name = url.slice(url.lastIndexOf('-') + 1, -4);
      players.push(this);
    }
    async play() {
      log.push(`play ${this.name}${this.loop ? ', looping' : ''}`);
    }
    pause() {
      log.push(`pause ${this.name}`);
    }
    load() {}
    removeAttribute() {}
  }
  const real = { Audio: globalThis.Audio, fetch: globalThis.fetch };
  Object.assign(globalThis, {
    Audio: Player,
    fetch: (url: string) =>
      new Promise((resolve) =>
        downloads.push(() => resolve({ arrayBuffer: async () => url.slice(3) })),
      ),
  });
  t.after(() => Object.assign(globalThis, real));
  return {
    log,
    players,
    async arrive() {
      for (const finish of downloads.splice(0)) finish();
      await settle();
    },
  };
}

test('file names say what they are: variants of a cue, or a music', () => {
  assert.deepEqual(
    [...files.cues],
    [
      ['hit', ['/a/hit-1.mp3', '/a/hit-2.mp3']],
      ['wave-start', ['/a/wave-start-1.mp3']],
    ],
  );
  assert.deepEqual(
    [...files.tracks],
    [
      ['king', '/a/music-king.mp3'],
      ['epic', '/a/music-epic.mp3'],
    ],
  );
});

test('a cue is silent until its file is decoded, then plays at most eight at once', async (t) => {
  const browser = fakeBrowser(t);
  const audio = fakeAudioContext();
  const samples = createSamples(audio.context, audio.context.createGain(), files);
  assert.equal(samples.play('wave-start'), false, 'still downloading');
  await browser.arrive();
  assert.equal(samples.play('feast'), false, 'no such file');
  assert.equal(samples.play('wave-start'), true);
  assert.equal(samples.play('hit', 0.5), true);
  assert.equal(audio.files[0], 'wave-start-1.mp3 1');
  assert.match(audio.files[1], /^hit-[12]\.mp3 0\.5$/);
  const accepted = Array.from({ length: 8 }, () => samples.play('hit'));
  assert.deepEqual(accepted, [true, true, true, true, true, true, false, false]);
  audio.finishAll();
  assert.equal(samples.play('hit'), true, 'a voice is free again');
});

test('music: asked twice it starts once; an introduction leads into its loop', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const browser = fakeBrowser(t);
  const audio = fakeAudioContext();
  const samples = createSamples(audio.context, audio.context.createGain(), files);
  samples.music('king', 'epic');
  samples.music('king', 'epic');
  assert.equal(samples.track(), 'king');
  browser.players[0]!.onended?.();
  assert.equal(samples.track(), 'epic');
  samples.hold(true);
  samples.hold(false);
  samples.music('calm');
  assert.equal(samples.track(), 'calm', 'asked for, even without a file');
  samples.hold(false);
  samples.duck(true);
  samples.music(null);
  await settle();
  assert.deepEqual(browser.log, [
    'play king',
    'pause king',
    'play epic, looping',
    'pause epic',
    'play epic, looping',
  ]);
  // Rise of the king, rise of the epic, fall of the epic, then the pause level.
  assert.deepEqual(audio.fades, [0.55, 0.55, 0, 0.22]);
  t.mock.timers.tick(1200);
  assert.equal(browser.log.at(-1), 'pause epic', 'the faded music is released');
});
