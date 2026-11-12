/** Fichiers audio du jeu : chargés seulement quand le son est activé, jamais avant. */
const urls = import.meta.glob<string>('../assets/audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});

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
  | 'toggle';
export type Track = 'menu' | 'calm' | 'epic' | 'king';

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
  // Un volume par musique : l'ancienne s'éteint pendant que la nouvelle monte, sans se mélanger.
  const musicBus = context.createGain();
  musicBus.connect(output);
  let voices = 0;
  // Les musiques sont lues en continu par un élément audio : décodées en entier, trois minutes
  // de musique occuperaient plus de 100 Mo de mémoire sur le téléphone.
  let current: { track: Track; player: HTMLAudioElement; gain: GainNode } | undefined;
  let held = false;
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

  function release(player: HTMLAudioElement, gain: GainNode) {
    player.pause();
    player.removeAttribute('src');
    player.load();
    gain.disconnect();
  }
  function stopMusic() {
    if (!current) return;
    const { player, gain } = current;
    current = undefined;
    player.onended = null;
    gain.gain.setTargetAtTime(0, context.currentTime, 0.25);
    setTimeout(() => release(player, gain), 1200);
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
      const player = new Audio(url);
      player.loop = !then;
      player.preload = 'auto';
      const gain = context.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.55, context.currentTime, 0.4);
      context.createMediaElementSource(player).connect(gain);
      gain.connect(musicBus);
      current = { track, player, gain };
      if (then)
        player.onended = () => {
          if (current?.player !== player) return;
          current = undefined;
          release(player, gain);
          wanted = null;
          this.music(then);
        };
      if (!held) void player.play().catch(() => undefined);
    },
    /** Musique demandée en ce moment, même si elle charge encore. */
    track: () => wanted,
    /** L'appli passe en arrière-plan ou en revient : la musique s'arrête puis reprend où elle était. */
    hold(paused: boolean) {
      held = paused;
      if (!current) return;
      if (paused) current.player.pause();
      else void current.player.play().catch(() => undefined);
    },
    duck(quiet: boolean) {
      musicBus.gain.setTargetAtTime(quiet ? 0.22 : 1, context.currentTime, 0.2);
    },
  };
}
