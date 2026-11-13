export const SOUND_SETTINGS_KEY = 'conquete-serpents:sound:v1';
type SoundStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Choix de l'appareil : musique et bruitages, activés au départ comme dans les jeux mobiles.
 * Le volume et le mode silencieux du téléphone s'appliquent ; chacun se coupe dans Réglages.
 */
export function createSoundSettings(storage?: SoundStorage) {
  let music = true;
  let effects = true;
  try {
    const saved = storage?.getItem(SOUND_SETTINGS_KEY) ?? '';
    // Seul un choix enregistré par ce jeu (« 10 », « 01 »…) remplace le réglage de départ.
    if (/^[01]{2}$/.test(saved)) {
      music = saved[0] === '1';
      effects = saved[1] === '1';
    }
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
export type SoundSettings = ReturnType<typeof createSoundSettings>;
let storage: SoundStorage | undefined;
try {
  if (typeof window !== 'undefined') storage = window.localStorage;
} catch {
  /* Facultatif. */
}
export const soundSettings = createSoundSettings(storage);
