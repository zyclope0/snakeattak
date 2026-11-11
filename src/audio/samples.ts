/** Fichiers audio du jeu : chargés seulement quand le son est activé, jamais avant. */
const urls = import.meta.glob<string>('../assets/audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});

export type Cue =
  | 'hit'
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
  | 'toggle';
export type Track = 'epic' | 'king';

/** `hit-2.mp3` est la deuxième variante du signal `hit` ; `music-epic.mp3` est une musique. */
function catalogue() {
  const cues = new Map<string, string[]>();
  const tracks = new Map<string, string>();
  for (const [path, url] of Object.entries(urls)) {
    const name = path.slice(path.lastIndexOf('/') + 1, -4);
    if (name.startsWith('music-')) tracks.set(name.slice(6), url);
    else {
      const cue = name.replace(/-\d+$/, '');
      cues.set(cue, [...(cues.get(cue) ?? []), url]);
    }
  }
  return { cues, tracks };
}

export function createSamples(context: AudioContext, output: AudioNode) {
  const { cues, tracks } = catalogue();
  const buffers = new Map<string, AudioBuffer>();
  const pending = new Map<string, Promise<AudioBuffer | undefined>>();
  const musicGain = context.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(output);
  let voices = 0;
  let current: { track: Track; source: AudioBufferSourceNode } | undefined;
  let wanted: Track | null = null;

  function load(url: string) {
    let job = pending.get(url);
    if (!job) {
      job = fetch(url)
        .then((response) => response.arrayBuffer())
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
          buffers.set(url, buffer);
          return buffer;
        })
        .catch(() => undefined);
      pending.set(url, job);
    }
    return job;
  }
  // Les bruitages sont petits : tous prêts dès l'activation. Les musiques attendent leur tour.
  for (const list of cues.values()) for (const url of list) void load(url);

  function stopMusic() {
    if (!current) return;
    const { source } = current;
    current = undefined;
    musicGain.gain.setTargetAtTime(0, context.currentTime, 0.25);
    source.onended = null;
    source.stop(context.currentTime + 1.2);
  }

  return {
    /** Faux si le fichier manque ou n'est pas encore décodé : l'appelant garde son repli. */
    play(cue: Cue, volume = 1) {
      const list = cues.get(cue);
      if (!list || voices >= 8) return false;
      const buffer = buffers.get(list[Math.floor(Math.random() * list.length)]!);
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
    },
    /** `then` enchaîne une musique en boucle après une introduction jouée une fois. */
    music(track: Track | null, then?: Track) {
      if (track === wanted) return;
      wanted = track;
      stopMusic();
      const url = track && tracks.get(track);
      if (!track || !url) return;
      void load(url).then((buffer) => {
        if (!buffer || wanted !== track || current) return;
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = !then;
        source.connect(musicGain);
        musicGain.gain.cancelScheduledValues(context.currentTime);
        musicGain.gain.setTargetAtTime(0.55, context.currentTime, 0.4);
        source.start();
        current = { track, source };
        if (then)
          source.onended = () => {
            if (wanted !== track) return;
            current = undefined;
            wanted = null;
            this.music(then);
          };
      });
    },
    /** Musique demandée en ce moment, même si elle charge encore. */
    track: () => wanted,
    duck(quiet: boolean) {
      if (current) musicGain.gain.setTargetAtTime(quiet ? 0.12 : 0.55, context.currentTime, 0.2);
    },
  };
}
