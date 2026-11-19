/** Plays the game's audio files: short cues decoded in memory, music streamed. */

export type Cue =
  | 'hit'
  | 'sword'
  | 'place'
  | 'bite'
  | 'stomp'
  | 'block'
  | 'shell'
  | 'arrow'
  | 'fire'
  | 'poison'
  | 'heal'
  | 'honey'
  | 'gold'
  | 'hatch'
  | 'feast'
  | 'wave-start'
  | 'wave-end'
  | 'won'
  | 'lost'
  | 'toggle'
  | 'blink'
  | 'leap'
  | 'splash';
export type Track = 'menu' | 'calm' | 'epic' | 'king';

export type AudioCatalogue = {
  /** Every variant of a cue: one is drawn at random each time. */
  cues: Map<string, string[]>;
  tracks: Map<string, string>;
};
export type Samples = ReturnType<typeof createSamples>;

const MAX_CUE_VOICES = 8;
const MUSIC_VOLUME = 0.55;
/** All music is turned down to this share of its volume while the game is paused. */
const PAUSED_MUSIC_SHARE = 0.22;
/** Time constants of the fades, in seconds. */
const FADE_IN = 0.4;
const FADE_OUT = 0.25;
const PAUSE_FADE = 0.2;
/** A faded-out music is freed after this delay, once it can no longer be heard. */
const RELEASE_DELAY_MS = 1200;

/** `hit-2.mp3` is the second variant of the `hit` cue; `music-epic.mp3` is a music. */
export function catalogueOf(urlsByPath: Record<string, string>): AudioCatalogue {
  const cues = new Map<string, string[]>();
  const tracks = new Map<string, string>();
  for (const [path, url] of Object.entries(urlsByPath)) {
    const name = path.slice(path.lastIndexOf('/') + 1, -4);
    if (name.startsWith('music-')) {
      tracks.set(name.slice(6), url);
      continue;
    }
    const cue = name.replace(/-\d+$/, '');
    cues.set(cue, [...(cues.get(cue) ?? []), url]);
  }
  return { cues, tracks };
}

export function createSamples(context: AudioContext, output: AudioNode, files: AudioCatalogue) {
  const music = createMusicPlayer(context, output, files.tracks);
  const play = createCuePlayer(context, output, files.cues);
  return { play, ...music };
}

function createCuePlayer(context: AudioContext, output: AudioNode, cues: Map<string, string[]>) {
  const buffers = new Map<string, AudioBuffer>();
  let voices = 0;

  /** A file that cannot be fetched or decoded never becomes ready: the caller keeps its fallback. */
  function load(url: string) {
    return fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        buffers.set(url, buffer);
      })
      .catch(() => undefined);
  }
  // Cues are small: all of them are fetched as soon as the sound is on, each address once.
  for (const url of new Set([...cues.values()].flat())) void load(url);

  /** False when the file is missing or not decoded yet: the caller keeps its fallback. */
  return function play(cue: Cue, volume = 1) {
    const variants = cues.get(cue);
    if (!variants || voices >= MAX_CUE_VOICES) return false;
    const buffer = buffers.get(variants[Math.floor(Math.random() * variants.length)]!);
    if (!buffer) return false;
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(output);
    voices++;
    source.onended = () => {
      voices--;
      source.disconnect();
      gain.disconnect();
    };
    source.start();
    return true;
  };
}

function createMusicPlayer(context: AudioContext, output: AudioNode, tracks: Map<string, string>) {
  // One volume per music: the old one fades out while the new one rises, without mixing.
  const bus = context.createGain();
  bus.connect(output);
  // Music is streamed by an audio element: fully decoded, three minutes of music would take
  // more than 100 MB of memory on the phone.
  let current: { player: HTMLAudioElement; gain: GainNode } | undefined;
  let held = false;
  let wanted: Track | null = null;

  function stop() {
    if (!current) return;
    const { player, gain } = current;
    current = undefined;
    player.onended = null;
    gain.gain.setTargetAtTime(0, context.currentTime, FADE_OUT);
    setTimeout(() => release(player, gain), RELEASE_DELAY_MS);
  }
  /** `then` follows, looping, after an introduction played once. */
  function music(track: Track | null, then?: Track) {
    if (track === wanted) return;
    wanted = track;
    stop();
    const url = track && tracks.get(track);
    if (!url) return;
    const player = new Audio(url);
    player.loop = !then;
    player.preload = 'auto';
    const gain = fadeIn(context, player, bus);
    current = { player, gain };
    if (then) player.onended = () => playNext(player, gain, then);
    if (!held) void player.play().catch(() => undefined);
  }
  /** The introduction is over: unless another music took its place, the loop starts. */
  function playNext(player: HTMLAudioElement, gain: GainNode, next: Track) {
    if (current?.player !== player) return;
    current = undefined;
    release(player, gain);
    wanted = null;
    music(next);
  }

  return {
    music,
    /** The music asked for right now, even if it is still loading. */
    track: () => wanted,
    /** The app goes to the background or comes back: the music stops, then resumes where it was. */
    hold(paused: boolean) {
      held = paused;
      if (!current) return;
      if (paused) current.player.pause();
      else void current.player.play().catch(() => undefined);
    },
    duck(quiet: boolean) {
      bus.gain.setTargetAtTime(quiet ? PAUSED_MUSIC_SHARE : 1, context.currentTime, PAUSE_FADE);
    },
  };
}

/** Routes a music player to the bus through its own volume, rising from silence. */
function fadeIn(context: AudioContext, player: HTMLAudioElement, bus: AudioNode) {
  const gain = context.createGain();
  gain.gain.value = 0;
  gain.gain.setTargetAtTime(MUSIC_VOLUME, context.currentTime, FADE_IN);
  context.createMediaElementSource(player).connect(gain);
  gain.connect(bus);
  return gain;
}

/** Stops the stream and lets the browser free it. */
function release(player: HTMLAudioElement, gain: GainNode) {
  player.pause();
  player.removeAttribute('src');
  player.load();
  gain.disconnect();
}
