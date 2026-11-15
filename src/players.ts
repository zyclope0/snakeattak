import { kinds } from './data.ts';
import { readFamilyBackup } from './familyBackup.ts';
import {
  CAMP_STORAGE_KEY,
  CAREER_STORAGE_KEY,
  FAMILY_STORAGE_KEY,
  PLAYERS_KEY,
  REMINDER_STORAGE_KEY,
  VOYAGE_STORAGE_KEY,
} from './storageKeys.ts';
import {
  hasControlCharacter,
  isArrayOfLength,
  isOneOf,
  isRecord,
  readBoundedJson,
  withoutControlCharacters,
} from './plainData.ts';

/**
 * Local players of a shared phone or tablet. Nothing leaves the device: a player is a
 * character of the game and an optional nickname, and owns one adventure in the browser's
 * storage. No browser object here; `ui/players.ts` draws the screens.
 */
export const PLAYER_IDS = ['p1', 'p2', 'p3', 'p4'] as const;
export type PlayerId = (typeof PLAYER_IDS)[number];
export const PLAYER_CHARACTERS = [
  'hero',
  'club',
  'archer',
  'ninja',
  'knight',
  'dragon',
  'dino',
  'triceratops',
] as const satisfies readonly (keyof typeof kinds)[];
export type PlayerCharacter = (typeof PLAYER_CHARACTERS)[number];
export type Player = { id: PlayerId; character: PlayerCharacter; name: string | null };
export type Players = { version: 1; activeId: PlayerId; players: Player[] };
export const NICKNAME_LIMIT = 16;
// Four players at most: far more room than their stored list ever needs.
const PLAYERS_LIMIT = 2000;
/**
 * The keys of one adventure. Player 1 keeps them as they always were, so a save from before
 * the players simply is player 1; players 2 to 4 use the same keys with their id as a suffix.
 * Sound, language, light effects and the list of players belong to the device.
 */
export const PLAYER_KEYS: readonly string[] = [
  FAMILY_STORAGE_KEY,
  CAMP_STORAGE_KEY,
  CAREER_STORAGE_KEY,
  REMINDER_STORAGE_KEY,
  VOYAGE_STORAGE_KEY,
];
type ReadPort = Pick<Storage, 'getItem'>;
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const playerId = (value: unknown): value is PlayerId => isOneOf(value, PLAYER_IDS);
const character = (value: unknown): value is PlayerCharacter => isOneOf(value, PLAYER_CHARACTERS);
const copy = (state: Players): Players => ({
  version: 1,
  activeId: state.activeId,
  players: state.players.map((player) => ({ ...player })),
});
const find = (state: Players, id: PlayerId) => state.players.find((player) => player.id === id);

/** A stored nickname: 1 to 16 characters, nothing around it, no control character. */
export const validNickname = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length >= 1 &&
  value.length <= NICKNAME_LIMIT &&
  value === value.trim() &&
  !hasControlCharacter(value);

/** What was typed in the field. Empty means no nickname; the rest is kept as typed. */
export function nicknameFromInput(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let text = withoutControlCharacters(input).trim().slice(0, NICKNAME_LIMIT);
  // Never keep half of a character made of two code units.
  if (/[\ud800-\udbff]$/.test(text)) text = text.slice(0, -1);
  text = text.trim();
  return validNickname(text) ? text : null;
}

/** The very first launch: one player, the Héros, no nickname, no screen to go through. */
export function createPlayers(): Players {
  return { version: 1, activeId: 'p1', players: [{ id: 'p1', character: 'hero', name: null }] };
}

/** One player; `known` holds the players already read: an identifier is used once. */
function readPlayer(entry: unknown, known: readonly Player[]): Player | null {
  if (
    !isRecord(entry) ||
    !playerId(entry.id) ||
    known.some((player) => player.id === entry.id) ||
    !character(entry.character) ||
    (entry.name !== null && !validNickname(entry.name))
  )
    return null;
  return { id: entry.id, character: entry.character, name: entry.name };
}

function readPlayerList(value: unknown): Players | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isArrayOfLength(value.players, 1, PLAYER_IDS.length)
  )
    return null;
  const players: Player[] = [];
  for (const entry of value.players) {
    const player = readPlayer(entry, players);
    if (!player) return null;
    players.push(player);
  }
  if (!playerId(value.activeId) || !players.some((player) => player.id === value.activeId))
    return null;
  return { version: 1, activeId: value.activeId, players };
}

/** Reconstruct bounded plain data; anything unexpected is refused as a whole. */
export function validatePlayers(value: unknown): Players | null {
  try {
    return readPlayerList(value);
  } catch {
    return null;
  }
}

/** Missing or invalid data is the default state: an existing save is then player 1. */
export function readPlayers(raw: unknown): Players {
  return readBoundedJson(raw, PLAYERS_LIMIT, validatePlayers) ?? createPlayers();
}
export function loadPlayers(device?: ReadPort): Players {
  try {
    return readPlayers(device?.getItem(PLAYERS_KEY));
  } catch {
    return createPlayers();
  }
}
/**
 * The players as they are stored now, seen from a page that plays `activeId`. Another tab
 * of the game may have added, edited or removed players since this page loaded: every
 * change starts from here, never from the list the page read at its opening. Null when
 * that player is no longer stored: the page is out of date and must be reloaded.
 */
export function storedPlayersFor(device: ReadPort | undefined, activeId: PlayerId): Players | null {
  const stored = loadPlayers(device);
  return find(stored, activeId) ? { ...stored, activeId } : null;
}
/** False when the device refuses the write: the caller then changes nothing. */
export function savePlayers(device: Pick<Storage, 'setItem'> | undefined, state: Players): boolean {
  const valid = validatePlayers(state);
  if (!device || !valid) return false;
  try {
    device.setItem(PLAYERS_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}

/** Where a key of the adventure lives for a player. Device-wide keys never move. */
export const playerKey = (key: string, id: PlayerId): string =>
  id === 'p1' || !PLAYER_KEYS.includes(key) ? key : `${key}:${id}`;

/**
 * The storage handed to the persistence code: same calls, the active player's keys. Once
 * closed it reads nothing and writes nothing, so the page being left cannot write back the
 * adventure of a player who was just deleted.
 */
export function playerStorage(device: StoragePort, id: PlayerId) {
  let open = true;
  return {
    getItem: (key: string) => (open ? device.getItem(playerKey(key, id)) : null),
    setItem(key: string, value: string) {
      if (open) device.setItem(playerKey(key, id), value);
    },
    removeItem(key: string) {
      if (open) device.removeItem(playerKey(key, id));
    },
    close() {
      open = false;
    },
  };
}

/** Remove one player's adventure and nothing else. False if something is still there. */
export function clearPlayerData(device: StoragePort | undefined, id: PlayerId): boolean {
  if (!device) return false;
  try {
    for (const key of PLAYER_KEYS) device.removeItem(playerKey(key, id));
    return PLAYER_KEYS.every((key) => device.getItem(playerKey(key, id)) === null);
  } catch {
    return false;
  }
}

/** Mission stars of a player, read from that player's own save without switching to it. */
export function playerStars(device: ReadPort | undefined, id: PlayerId): number {
  try {
    const raw = device?.getItem(playerKey(FAMILY_STORAGE_KEY, id));
    const missions = raw ? readFamilyBackup(raw)?.missions : undefined;
    return missions ? Object.values(missions.bestStars).reduce((sum, stars) => sum + stars, 0) : 0;
  } catch {
    return 0;
  }
}

/** The lowest free id; a freed id may serve again, its adventure was removed with it. */
export const freePlayerId = (state: Players): PlayerId | null =>
  PLAYER_IDS.find((id) => !find(state, id)) ?? null;

/** A character nobody has yet, to start the choice; every character stays available. */
export const suggestedCharacter = (state: Players): PlayerCharacter =>
  PLAYER_CHARACTERS.find((kind) => !state.players.some((player) => player.character === kind)) ??
  PLAYER_CHARACTERS[0];

/** A new player becomes the active one. Null when four players already exist. */
export function addPlayer(
  state: Players,
  kind: PlayerCharacter,
  name: string | null,
): Players | null {
  const id = freePlayerId(state);
  if (!id) return null;
  const next = copy(state);
  next.players.push({ id, character: kind, name });
  next.activeId = id;
  return validatePlayers(next);
}
/** Character and nickname only: the adventure and the active player do not change. */
export function editPlayer(
  state: Players,
  id: PlayerId,
  kind: PlayerCharacter,
  name: string | null,
): Players | null {
  const next = copy(state);
  const player = find(next, id);
  if (!player) return null;
  player.character = kind;
  player.name = name;
  return validatePlayers(next);
}
export function selectPlayer(state: Players, id: PlayerId): Players | null {
  if (!find(state, id)) return null;
  return { ...copy(state), activeId: id };
}
/** The last player stays. Removing the active player hands over to the first one left. */
export function removePlayer(state: Players, id: PlayerId): Players | null {
  if (state.players.length < 2 || !find(state, id)) return null;
  const next = copy(state);
  next.players = next.players.filter((player) => player.id !== id);
  if (next.activeId === id) next.activeId = next.players[0].id;
  return validatePlayers(next);
}
