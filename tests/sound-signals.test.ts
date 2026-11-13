import test from 'node:test';
import assert from 'node:assert/strict';
import type { Effect, Game } from '../src/game.ts';
import { createGameSounds } from '../src/audio/gameSounds.ts';
import { createSignalPlayer, type SoundEngine } from '../src/audio/signalPlayer.ts';
import type { Samples, Track } from '../src/audio/samples.ts';
import { fakeAudioContext } from './sound-fakes.ts';

type GameView = Pick<
  Game,
  'wave' | 'totalWaves' | 'hatched' | 'status' | 'feast' | 'mission' | 'paused'
> & {
  units: { id: number; kind: string }[];
  enemies: { id: number; boss: boolean; hp: number }[];
  effects: Effect[];
};
const newGame = (changes: Partial<GameView> = {}): GameView => ({
  wave: 1,
  totalWaves: 12,
  hatched: 0,
  status: 'fighting',
  feast: null,
  mission: null,
  paused: false,
  units: [
    { id: 1, kind: 'hero' },
    { id: 2, kind: 'club' },
    { id: 3, kind: 'dino' },
  ],
  enemies: [{ id: 100, boss: false, hp: 5 }],
  effects: [],
  ...changes,
});
const effect = (kind: Effect['kind'], sourceId?: number) => ({ kind, sourceId }) as Effect;
const mission = {} as NonNullable<Game['mission']>;
const king = { id: 200, boss: true, hp: 300 };

/** The listener with the real signal player, and stand-ins for the files and the engine. */
function listen({ music = true, effects = true, filesReady = true, atHome = false } = {}) {
  const audio = fakeAudioContext();
  const heard: string[] = [];
  const state = { home: atHome, music, effects, quiet: false, track: null as Track | null };
  const samples: Samples = {
    play(cue, volume = 1) {
      if (filesReady) heard.push(`${cue} ${volume}`);
      return filesReady;
    },
    music(track, then) {
      if (track === state.track) return;
      state.track = track;
      heard.push(`music ${track}${then ? ` then ${then}` : ''}`);
    },
    track: () => state.track,
    hold() {},
    duck(quiet) {
      state.quiet = quiet;
    },
  };
  const engine: SoundEngine = { context: audio.context, synthOutput: audio.context.createGain() };
  engine.samples = samples;
  const frame = createGameSounds({
    engine,
    settings: state,
    play: createSignalPlayer(engine, state),
    atHome: () => state.home,
  });
  return {
    ...audio,
    engine,
    state,
    /** What one frame makes heard, a tenth of a second after the last one. */
    after(game: GameView) {
      audio.clock.currentTime += 0.1;
      heard.length = 0;
      audio.notes.length = 0;
      frame(game as unknown as Game);
      return [...heard];
    },
  };
}

test('each effect has its file and its volume; a blow sounds like the one who strikes', () => {
  const sound = listen({ music: false });
  const game = newGame();
  sound.after(game);
  const expected: [Effect['kind'], number | undefined, string][] = [
    ['hit', 1, 'sword 0.6'],
    ['hit', 3, 'stomp 0.8'],
    ['hit', 100, 'bite 0.6'],
    ['hit', 2, 'hit 0.5'],
    ['hit', undefined, 'hit 0.5'],
    ['block', 1, 'block 0.6'],
    ['honey', undefined, 'honey 1'],
    ['shell', 9, 'shell 1'],
    ['heal', 4, 'heal 0.6'],
    ['fire', 5, 'fire 0.7'],
    ['arrow', 6, 'arrow 0.6'],
    ['gold', undefined, 'gold 0.7'],
    ['poison', 100, 'poison 0.6'],
  ];
  for (const [kind, source, cue] of expected) {
    game.effects = [effect(kind, source)];
    assert.deepEqual(sound.after(game), [cue], `${kind} from ${source}`);
  }
});

test('one signal per frame, the most important first, and nothing is said twice', () => {
  const sound = listen({ music: false });
  const game = newGame({ status: 'preparing', wave: 0 });
  assert.deepEqual(sound.after(game), [], 'a first look at a game is silent');
  // Everything at once: each frame, only what stays unsaid can still sound.
  game.status = 'fighting';
  game.wave = 1;
  game.units.push({ id: 4, kind: 'club' });
  game.hatched = 1;
  game.feast = { lane: 1, remaining: 3, flavor: 'lure' };
  game.effects = [effect('gold')];
  assert.deepEqual(sound.after(game), ['wave-start 1']);
  assert.deepEqual(sound.after(game), [], 'the rest of that frame is not caught up');
  game.units.push({ id: 5, kind: 'club' });
  game.hatched = 2;
  game.feast = { lane: 2, remaining: 3, flavor: 'sticky' };
  assert.deepEqual(sound.after(game), ['place 0.7']);
  game.hatched = 3;
  game.feast = { lane: 0, remaining: 3, flavor: 'lure' };
  game.effects = [effect('gold')];
  assert.deepEqual(sound.after(game), ['hatch 1']);
  game.feast = { lane: 1, remaining: 3, flavor: 'lure' };
  game.effects = [effect('gold')];
  assert.deepEqual(sound.after(game), ['feast 1']);
  game.status = 'preparing';
  game.wave = 2;
  assert.deepEqual(sound.after(game), ['wave-end 1']);
  game.status = 'won';
  game.wave = 3;
  assert.deepEqual(sound.after(game), ['won 1']);
  assert.deepEqual(sound.after(game), []);
  const next = newGame({ wave: 5 });
  assert.deepEqual(sound.after(next), [], 'another game starts from what it shows');
  next.status = 'lost';
  next.effects = [effect('hit', 1)];
  assert.deepEqual(sound.after(next), ['lost 1']);
});

test('effects are spaced out, and a healing never sounds twice within three seconds', () => {
  const sound = listen({ music: false });
  const game = newGame();
  sound.after(game);
  game.effects = [effect('gold'), effect('fire'), effect('arrow')];
  assert.deepEqual(sound.after(game), ['gold 0.7'], 'the first new effect of the frame');
  game.effects = [...game.effects, effect('hit', 1)];
  sound.clock.currentTime -= 0.05;
  assert.deepEqual(sound.after(game), [], 'too soon after the last one');
  assert.deepEqual(sound.after(game), [], 'neither it nor the others are caught up later');
  game.effects = [effect('heal')];
  assert.deepEqual(sound.after(game), ['heal 0.6']);
  sound.clock.currentTime += 2;
  game.effects = [effect('heal')];
  assert.deepEqual(sound.after(game), [], 'the first healing is still sounding');
  sound.clock.currentTime -= 0.05;
  game.effects = [effect('hit', 1)];
  assert.deepEqual(sound.after(game), [], 'a silent healing still takes the turn');
  sound.clock.currentTime += 1;
  game.effects = [effect('heal')];
  assert.deepEqual(sound.after(game), ['heal 0.6']);
});

test('a pause and the effects setting silence the signals without storing them up', () => {
  const sound = listen({ music: false });
  const game = newGame();
  sound.after(game);
  game.paused = true;
  game.hatched = 1;
  game.effects = [effect('hit', 1)];
  assert.deepEqual(sound.after(game), []);
  game.paused = false;
  assert.deepEqual(sound.after(game), []);
  sound.state.effects = false;
  game.status = 'won';
  assert.deepEqual(sound.after(game), []);
  sound.state.effects = true;
  assert.deepEqual(sound.after(game), []);
});

test('the music follows the place, the wave and the king', () => {
  const sound = listen({ effects: false, atHome: true });
  const game = newGame({ status: 'preparing', wave: 0 });
  assert.deepEqual(sound.after(game), ['music menu']);
  sound.state.home = false;
  assert.deepEqual(sound.after(game), ['music calm']);
  Object.assign(game, { status: 'fighting', wave: 7 });
  assert.deepEqual(sound.after(game), []);
  game.wave = 8;
  assert.deepEqual(sound.after(game), ['music epic'], 'wave 8 of the adventure');
  game.status = 'preparing';
  assert.deepEqual(sound.after(game), ['music calm'], 'between two waves');
  Object.assign(game, { status: 'fighting', wave: 3 });
  game.enemies.push({ ...king });
  assert.deepEqual(sound.after(game), ['music king then epic']);
  assert.deepEqual(sound.after(game), [], 'the king music is left to finish');
  sound.state.track = 'epic';
  assert.deepEqual(sound.after(game), [], 'and the epic one is not started again');
  game.paused = true;
  sound.after(game);
  assert.equal(sound.state.quiet, true, 'quieter during a pause');
  sound.state.home = true;
  assert.deepEqual(sound.after(game), ['music menu']);
  assert.equal(sound.state.quiet, false, 'but not on the home screen');
  Object.assign(sound.state, { home: false });
  Object.assign(game, { paused: false, status: 'won' });
  assert.deepEqual(sound.after(game), ['music null']);
  const expedition = newGame({ mission, totalWaves: 12, wave: 8 });
  assert.deepEqual(sound.after(expedition), ['music calm'], 'wave 8 of an expedition stays calm');
  expedition.wave = 12;
  assert.deepEqual(sound.after(expedition), ['music epic'], 'its last wave is epic');
  sound.state.music = false;
  assert.deepEqual(sound.after(expedition), ['music null']);
});

test('while a file is not ready, the little synthesizer plays the signal instead', () => {
  const sound = listen({ music: false, filesReady: false });
  const game = newGame();
  sound.after(game);
  game.effects = [effect('fire')];
  sound.after(game);
  assert.deepEqual(sound.notes, ['220>65 sawtooth at 0.2']);
  game.units.push({ id: 4, kind: 'club' });
  sound.after(game);
  assert.deepEqual(sound.notes, [], 'an ally placed has no synthesizer sound');
  game.status = 'won';
  sound.after(game);
  assert.deepEqual(sound.notes, [
    '523>523 triangle at 0.4',
    '659>659 triangle at 0.55',
    '784>784 triangle at 0.7',
  ]);
  sound.finishAll();
  // Six voices at most: the feast has two notes, the fourth feast is cut short.
  const lure = () => ({ lane: 1, remaining: 3, flavor: 'lure' }) as const;
  const played: number[] = [];
  const feasting = newGame();
  sound.after(feasting);
  for (let i = 0; i < 4; i++) {
    feasting.feast = lure();
    sound.after(feasting);
    played.push(sound.notes.length);
  }
  assert.deepEqual(played, [2, 2, 2, 0]);
  sound.finishAll();
  sound.clock.state = 'suspended';
  feasting.feast = lure();
  sound.after(feasting);
  assert.deepEqual(sound.notes, [], 'nothing while the engine sleeps');
});

test('without the files, the king is announced by two notes, before the wave signal', () => {
  const sound = listen({ music: false });
  sound.engine.samples = undefined;
  const game = newGame();
  sound.after(game);
  game.wave = 2;
  game.enemies.push({ ...king });
  sound.after(game);
  assert.deepEqual(sound.notes, ['130>90 triangle at 0.2', '195>260 triangle at 0.42']);
  sound.after(game);
  assert.deepEqual(sound.notes, [], 'once');
});
