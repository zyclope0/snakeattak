export const VISUAL_SETTINGS_KEY = 'conquete-serpents:visual:v1';
type VisualStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Device preference, independent of campaign, economy and family exports. */
export function createVisualSettings(storage?: VisualStorage) {
  let light = false;
  try {
    light = storage?.getItem(VISUAL_SETTINGS_KEY) === '1';
  } catch {
    /* Private browsing. */
  }
  return {
    get light() {
      return light;
    },
    setLight(value: boolean) {
      light = value;
      try {
        storage?.setItem(VISUAL_SETTINGS_KEY, light ? '1' : '0');
      } catch {
        /* Memory works. */
      }
    },
    reduced(systemReduced: boolean) {
      return light || systemReduced;
    },
  };
}
let storage: VisualStorage | undefined;
try {
  if (typeof window !== 'undefined') storage = window.localStorage;
} catch {
  /* Optional. */
}
export const visualSettings = createVisualSettings(storage);
