import type { Effect } from '../game.ts';
import type { Cue } from './samples.ts';

/** One synthesizer note, gliding from one pitch to another (Hz); `delay` in seconds. */
export type Note = readonly [
  from: number,
  to: number,
  seconds: number,
  wave?: OscillatorType,
  delay?: number,
];
/**
 * The sound of one moment of the game: which file, how loud, and the notes the little
 * synthesizer plays instead while the file is not ready. This module is data only: when a
 * signal sounds is decided in `gameSounds.ts`.
 */
export type Signal = {
  /** Without a file, only the notes are played. */
  readonly cue?: Cue;
  /** Share of the file's own volume; whole when left out. */
  readonly volume?: number;
  /** No note: silence rather than a beep while the file is not ready. */
  readonly notes: readonly Note[];
};

/** The short dull blow shared by every strike that has no sound of its own. */
const THUD: Note = [160, 65, 0.07, 'triangle'];

export const MOMENT_SIGNALS = {
  won: {
    cue: 'won',
    notes: [
      [523, 523, 0.22, 'triangle'],
      [659, 659, 0.22, 'triangle', 0.15],
      [784, 784, 0.22, 'triangle', 0.3],
    ],
  },
  lost: { cue: 'lost', notes: [[240, 90, 0.6, 'triangle']] },
  /** Only without the files: with them, the king is announced by his own music. */
  king: {
    notes: [
      [130, 90, 0.45, 'triangle'],
      [195, 260, 0.4, 'triangle', 0.22],
    ],
  },
  waveEnd: { cue: 'wave-end', notes: [[520, 780, 0.2, 'triangle']] },
  waveStart: {
    cue: 'wave-start',
    notes: [
      [390, 520, 0.16, 'triangle'],
      [520, 650, 0.2, 'triangle', 0.15],
    ],
  },
  place: { cue: 'place', volume: 0.7, notes: [] },
  hatch: { cue: 'hatch', notes: [[260, 90, 0.15, 'square']] },
  feast: {
    cue: 'feast',
    notes: [
      [600, 950, 0.15],
      [950, 750, 0.13, 'sine', 0.12],
    ],
  },
} satisfies Record<string, Signal>;

/** A blow sounds like the one who strikes. */
export const HIT_SIGNALS = {
  dino: { cue: 'stomp', volume: 0.8, notes: [[120, 55, 0.22, 'triangle']] },
  hero: { cue: 'sword', volume: 0.6, notes: [THUD] },
  snake: { cue: 'bite', volume: 0.6, notes: [THUD] },
  other: { cue: 'hit', volume: 0.5, notes: [THUD] },
} satisfies Record<string, Signal>;

export const EFFECT_SIGNALS: Record<Exclude<Effect['kind'], 'hit'>, Signal> = {
  block: { cue: 'block', volume: 0.6, notes: [[530, 340, 0.09, 'triangle']] },
  honey: { cue: 'honey', notes: [[700, 1000, 0.1]] },
  shell: { cue: 'shell', notes: [[95, 30, 0.25, 'triangle']] },
  heal: { cue: 'heal', volume: 0.6, notes: [[720, 980, 0.13]] },
  fire: { cue: 'fire', volume: 0.7, notes: [[220, 65, 0.2, 'sawtooth']] },
  arrow: { cue: 'arrow', volume: 0.6, notes: [[440, 180, 0.08, 'triangle']] },
  gold: { cue: 'gold', volume: 0.7, notes: [[980, 1180, 0.08]] },
  poison: { cue: 'poison', volume: 0.6, notes: [THUD] },
  // The ninja snake vanishes and comes back behind an ally. No file carries this cue: the
  // two quick rising notes are its own sound, unlike any blow.
  blink: {
    cue: 'blink',
    volume: 0.7,
    notes: [
      [380, 1500, 0.09, 'sine'],
      [900, 1900, 0.08, 'sine', 0.1],
    ],
  },
  // The grasshopper snake leaps over the line: one note rising then falling, like a hop.
  leap: {
    cue: 'leap',
    volume: 0.6,
    notes: [
      [300, 900, 0.12, 'triangle'],
      [900, 420, 0.14, 'triangle', 0.12],
    ],
  },
  // The spinosaurus dives into the river or climbs out of it: a falling « plouf ». No file
  // carries this cue either.
  splash: {
    cue: 'splash',
    volume: 0.7,
    notes: [
      [620, 140, 0.14, 'sine'],
      [320, 90, 0.18, 'triangle', 0.08],
    ],
  },
  // The spinosaurus bites and sweeps its sail: the heavy blow of the dinosaurs.
  sail: { cue: 'stomp', volume: 0.8, notes: [[120, 55, 0.22, 'triangle']] },
};

/** The player changed a sound setting and effects are on. */
export const SETTING_CHANGED: Signal = { cue: 'toggle', notes: [[520, 720, 0.12]] };
/** Any other button of the page. */
export const BUTTON_PRESSED: Signal = { cue: 'toggle', volume: 0.5, notes: [] };
