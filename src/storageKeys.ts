/**
 * Every key the game writes in the browser's storage, in one place. A key is the address of a
 * child's save: changing a single character here hides what the device already holds. A new
 * meaning takes a new key with the next version number; the old one stays readable.
 * `tests/storage-keys.test.ts` retypes each value so that an edit here cannot pass unseen.
 */
const key = <Name extends string>(name: Name) => `conquete-serpents:${name}:v1` as const;

// One adventure: kept per player (`PLAYER_KEYS` in players.ts).
export const FAMILY_STORAGE_KEY = key('family');
/**
 * The text of a family save this version could not read, put aside before the new game
 * takes its place: never read by the game, kept so that nothing is destroyed.
 */
export const FAMILY_REFUSED_KEY = key('family-refused');
/**
 * The family save as the game found it when it last started, or, for as long as stars or
 * stickers are missing, the one that had the most: a save that is valid but wrong no longer
 * replaces the only copy. Never read by the game; a parent looks at it in the family window.
 */
export const FAMILY_PREVIOUS_KEY = key('family-previous');
/**
 * The adventure a family file replaced at the last import, as the export would have given it
 * just before: an import made by mistake can be undone. Written only by an import; never read
 * by the game; a parent looks at it in the family window.
 */
export const FAMILY_BEFORE_IMPORT_KEY = key('family-before-import');
export const CAMP_STORAGE_KEY = key('camp');
export const CAREER_STORAGE_KEY = key('progress');
export const VOYAGE_STORAGE_KEY = key('voyage');
export const REMINDER_STORAGE_KEY = key('recruitment-reminder');
/** The mark of the mission camp the child has won: the home does not offer to resume it. */
export const MISSION_DONE_KEY = key('mission-done');
/** The best endless adventures of a player: its own records, never compared with another's. */
export const ENDLESS_RECORDS_KEY = key('endless-records');
/** « La Grande Expédition » of a player: the one under way, and its record. */
export const EXPEDITION_STORAGE_KEY = key('expedition');
/** The apples a player has found, towards the hidden boss (decision of 26 November 2026). */
export const APPLES_STORAGE_KEY = key('apples');

// The device: shared by every player.
export const PLAYERS_KEY = key('players');
/** `sessionStorage` only: the player was chosen since the application was opened. */
export const PLAYER_CHOSEN_KEY = key('player-chosen');
export const LANGUAGE_KEY = key('language');
export const SOUND_SETTINGS_KEY = key('sound');
export const VISUAL_SETTINGS_KEY = key('visual');
/** Present when a parent switched advertising off on the website (ui/webAds). */
export const ADS_OFF_KEY = key('ads-off');
