import type { Samples } from './samples.ts';
import type { Note, Signal } from './signals.ts';
import type { SoundSettings } from './soundSettings.ts';

/**
 * The audio engine, empty until the player's first gesture: the browser refuses sound before.
 * Each part may be missing, also when the browser failed half-way through the start.
 */
export type SoundEngine = {
  context?: AudioContext;
  /** Where the synthesizer's notes go. */
  synthOutput?: GainNode;
  samples?: Samples;
};

const MAX_SYNTH_VOICES = 6;
/** A note rises to its peak in a few milliseconds, then dies away: no click at either end. */
const NOTE_PEAK = 0.16;
const NOTE_FLOOR = 0.001;
const NOTE_ATTACK = 0.008;
/** The oscillator runs a little past the note, so that the fade is never cut. */
const NOTE_TAIL = 0.02;
/** An exponential glide cannot reach zero: pitches stop at the edge of hearing. */
const LOWEST_PITCH = 20;

/** Plays a signal from its file, or on the little synthesizer while the file is not ready. */
export function createSignalPlayer(engine: SoundEngine, settings: Pick<SoundSettings, 'effects'>) {
  let voices = 0;

  function playNote([from, to, seconds, wave = 'sine', delay = 0]: Note) {
    const { context, synthOutput } = engine;
    if (!context || !synthOutput || !settings.effects) return;
    if (context.state !== 'running' || voices >= MAX_SYNTH_VOICES) return;
    const start = context.currentTime + delay;
    const end = start + seconds;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    voices++;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(LOWEST_PITCH, to), end);
    envelope.gain.setValueAtTime(NOTE_FLOOR, start);
    envelope.gain.linearRampToValueAtTime(NOTE_PEAK, start + NOTE_ATTACK);
    envelope.gain.exponentialRampToValueAtTime(NOTE_FLOOR, end);
    oscillator.connect(envelope);
    envelope.connect(synthOutput);
    oscillator.start(start);
    oscillator.stop(end + NOTE_TAIL);
    oscillator.onended = () => {
      voices--;
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  return (signal: Signal) => {
    if (signal.cue && engine.samples?.play(signal.cue, signal.volume)) return;
    for (const note of signal.notes) playNote(note);
  };
}
