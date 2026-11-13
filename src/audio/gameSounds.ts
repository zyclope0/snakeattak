import type { Effect, Game } from '../game.ts';
import type { Samples } from './samples.ts';
import type { SoundEngine } from './signalPlayer.ts';
import { EFFECT_SIGNALS, HIT_SIGNALS, MOMENT_SIGNALS, type Signal } from './signals.ts';
import type { SoundSettings } from './soundSettings.ts';

/** In the adventure the music turns epic from this wave on. */
const EPIC_FROM_WAVE = 8;
/** Effects come in bursts: one sound at most in this many seconds. */
const EFFECT_GAP = 0.09;
/** The healing sound lasts close to three seconds: never two at once. */
const HEAL_GAP = 3;

/** How the game looked at the last frame: a sound marks a change, never a state. */
type Memory = {
  game: Game;
  wave: number;
  hatched: number;
  allies: number;
  status: Game['status'];
  feast: Game['feast'];
  kingSeen: boolean;
  /** Effects of the frames already listened to, whether they sounded or not. */
  heard: WeakSet<Effect>;
};
/** When the last effect and the last healing sounded, on the audio clock. */
type LastSounds = { effectAt: number; healAt: number };

export type SoundDesk = {
  engine: SoundEngine;
  settings: Pick<SoundSettings, 'music' | 'effects'>;
  play: (signal: Signal) => void;
  /** The home screen is in front: the game behind it is not being played. */
  atHome: () => boolean;
};

/**
 * Returns the listener called with the game on every frame. It decides what is heard: which
 * music, and at most one signal. It only reads the game: no rule and no random draw depends
 * on it.
 */
export function createGameSounds({ engine, settings, play, atHome }: SoundDesk) {
  let memory: Memory | undefined;
  // Kept from one game to the next: only what is compared with the game starts afresh.
  const last: LastSounds = { effectAt: -1, healAt: -10 };

  return (game: Game) => {
    if (memory?.game !== game) memory = firstLook(game);
    const king = game.enemies.some((enemy) => enemy.boss && enemy.hp > 0);
    const kingArrives = king && !memory.kingSeen;
    const home = atHome();
    const { samples } = engine;
    if (!settings.music) samples?.music(null);
    else if (samples) {
      chooseMusic(samples, game, home, king, kingArrives);
      samples.duck(game.paused && !home);
    }
    if (settings.effects && !game.paused) {
      const signal =
        momentSignal(game, memory, kingArrives && !samples) ??
        freshEffectSignal(game, memory.heard, engine.context, last);
      if (signal) play(signal);
    }
    remember(memory, game, king);
  };
}

function firstLook(game: Game): Memory {
  return {
    game,
    wave: game.wave,
    hatched: game.hatched,
    allies: game.units.length,
    status: game.status,
    feast: game.feast,
    kingSeen: false,
    heard: new WeakSet(),
  };
}

function remember(memory: Memory, game: Game, king: boolean) {
  for (const effect of game.effects) memory.heard.add(effect);
  memory.kingSeen = king;
  memory.wave = game.wave;
  memory.allies = game.units.length;
  memory.hatched = game.hatched;
  memory.status = game.status;
  memory.feast = game.feast;
}

/**
 * Menus: the home music. In a game: the calm music, or the epic one on the last wave, from
 * wave 8 of the adventure, and as soon as the three-headed king arrives.
 */
function chooseMusic(
  samples: Samples,
  game: Game,
  home: boolean,
  king: boolean,
  kingArrives: boolean,
) {
  if (home) return samples.music('menu');
  if (game.status === 'won' || game.status === 'lost') return samples.music(null);
  if (!isEpic(game, king)) return samples.music('calm');
  if (kingArrives) return samples.music('king', 'epic');
  // The king's music leads into the epic one by itself: neither is started again.
  const playing = samples.track();
  if (playing !== 'king' && playing !== 'epic') samples.music('epic');
}

function isEpic(game: Game, king: boolean) {
  if (game.status !== 'fighting') return false;
  return king || game.wave >= game.totalWaves || (!game.mission && game.wave >= EPIC_FROM_WAVE);
}

/**
 * What just changed in the game, the most important first: one signal per frame. A moment
 * found here silences the effects of that frame, even when its own file is not ready.
 */
function momentSignal(game: Game, before: Memory, kingWithoutFiles: boolean): Signal | undefined {
  if (game.status === 'won' && before.status !== 'won') return MOMENT_SIGNALS.won;
  if (game.status === 'lost' && before.status !== 'lost') return MOMENT_SIGNALS.lost;
  if (kingWithoutFiles) return MOMENT_SIGNALS.king;
  if (game.status === 'preparing' && before.status === 'fighting') return MOMENT_SIGNALS.waveEnd;
  if (game.wave !== before.wave) return MOMENT_SIGNALS.waveStart;
  if (game.units.length > before.allies) return MOMENT_SIGNALS.place;
  if (game.hatched > before.hatched) return MOMENT_SIGNALS.hatch;
  if (game.feast && game.feast !== before.feast) return MOMENT_SIGNALS.feast;
  return undefined;
}

/** The first effect not listened to yet. The others of the same frame stay silent for good. */
function freshEffectSignal(
  game: Game,
  heard: WeakSet<Effect>,
  context: AudioContext | undefined,
  last: LastSounds,
): Signal | undefined {
  if (!context) return undefined;
  const now = context.currentTime;
  if (now - last.effectAt <= EFFECT_GAP) return undefined;
  const fresh = game.effects.find((effect) => !heard.has(effect));
  if (!fresh) return undefined;
  last.effectAt = now;
  if (fresh.kind !== 'heal') return effectSignal(game, fresh);
  // A healing kept silent still counts as the effect of this moment.
  if (now - last.healAt <= HEAL_GAP) return undefined;
  last.healAt = now;
  return EFFECT_SIGNALS.heal;
}

function effectSignal(game: Game, effect: Effect): Signal {
  if (effect.kind !== 'hit') return EFFECT_SIGNALS[effect.kind];
  const striker = game.units.find((unit) => unit.id === effect.sourceId)?.kind;
  if (striker === 'dino') return HIT_SIGNALS.dino;
  if (striker === 'hero') return HIT_SIGNALS.hero;
  if (game.enemies.some((enemy) => enemy.id === effect.sourceId)) return HIT_SIGNALS.snake;
  return HIT_SIGNALS.other;
}
