export const SOUND_SETTINGS_KEY = 'conquete-serpents:sound:v1';
type SoundStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Choix de l'appareil : musique et bruitages, coupés tant que personne ne les a activés. */
export function createSoundSettings(storage?: SoundStorage) {
  let music = false;
  let effects = false;
  try {
    const saved = storage?.getItem(SOUND_SETTINGS_KEY) ?? '';
    music = saved[0] === '1';
    effects = saved[1] === '1';
  } catch {
    /* Navigation privée. */
  }
  return {
    get music() {
      return music;
    },
    get effects() {
      return effects;
    },
    set(next: { music?: boolean; effects?: boolean }) {
      music = next.music ?? music;
      effects = next.effects ?? effects;
      try {
        storage?.setItem(SOUND_SETTINGS_KEY, (music ? '1' : '0') + (effects ? '1' : '0'));
      } catch {
        /* La mémoire suffit. */
      }
    },
  };
}
let storage: SoundStorage | undefined;
try {
  if (typeof window !== 'undefined') storage = window.localStorage;
} catch {
  /* Facultatif. */
}
export const soundSettings = createSoundSettings(storage);
