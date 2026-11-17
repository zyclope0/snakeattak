/**
 * Every key the game writes in the browser's storage, in one place. A key is the address of a
 * child's save: changing a single character here hides what the device already holds. A new
 * meaning takes a new key with the next version number; the old one stays readable.
 * `tests/storage-keys.test.ts` retypes each value so that an edit here cannot pass unseen.
 */
const key = <Name extends string>(name: Name) => `conquete-serpents:${name}:v1` as const;

// One adventure: kept per player (`PLAYER_KEYS` in players.ts).
export const FAMILY_STORAGE_KEY = key('family');
export const CAMP_STORAGE_KEY = key('camp');
export const CAREER_STORAGE_KEY = key('progress');
export const VOYAGE_STORAGE_KEY = key('voyage');
export const REMINDER_STORAGE_KEY = key('recruitment-reminder');

// The device: shared by every player.
export const PLAYERS_KEY = key('players');
/** `sessionStorage` only: the player was chosen since the application was opened. */
export const PLAYER_CHOSEN_KEY = key('player-chosen');
export const LANGUAGE_KEY = key('language');
export const SOUND_SETTINGS_KEY = key('sound');
export const VISUAL_SETTINGS_KEY = key('visual');
/** Present when a parent switched advertising off on the website (ui/webAds). */
export const ADS_OFF_KEY = key('ads-off');
