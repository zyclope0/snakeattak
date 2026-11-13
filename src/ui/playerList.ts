import {
  PLAYER_CHOSEN_KEY,
  addPlayer,
  clearPlayerData,
  editPlayer,
  playerStars,
  removePlayer,
  savePlayers,
  selectPlayer,
  storedPlayersFor,
} from '../players.ts';
import type { PlayerCharacter, PlayerId, Players } from '../players.ts';

export type PlayerListOptions = {
  /** The device's storage, undefined when the browser refuses it. */
  device: Storage | undefined;
  players: Players;
  /** Write the adventure in progress: the page is about to be left for another player. */
  save: () => void;
  /** Stop every later write of this page: its player is being deleted. */
  silence: () => void;
};

/** Whether someone said who plays since the game was opened; kept for the session only. */
function chosenThisSession() {
  try {
    return sessionStorage.getItem(PLAYER_CHOSEN_KEY) === '1';
  } catch {
    return false;
  }
}
function rememberChoice(value: boolean) {
  try {
    if (value) sessionStorage.setItem(PLAYER_CHOSEN_KEY, '1');
    else sessionStorage.removeItem(PLAYER_CHOSEN_KEY);
  } catch {
    /* The question is then simply asked again. */
  }
}

/**
 * This page's copy of the players of the device, and every write of that list. Changing
 * player writes the choice and reloads the page: every controller is then rebuilt on that
 * player's keys.
 */
export function createPlayerList({ device, players, save, silence }: PlayerListOptions) {
  let state = players;
  const written = (next: Players | null): next is Players => !!next && savePlayers(device, next);

  /** The new choice is written: rebuild the whole page on that player's keys. */
  function leave() {
    rememberChoice(true);
    save();
    window.location.reload();
  }
  /**
   * Another tab may have changed the players: start again from what is stored. False when
   * this page's own player was deleted elsewhere; the page then reloads without writing
   * that adventure back.
   */
  function sync(): boolean {
    const stored = storedPlayersFor(device, state.activeId);
    if (!stored) {
      silence();
      window.location.reload();
      return false;
    }
    state = stored;
    return true;
  }
  /**
   * Deletes a player and that player's adventure. `'leaving'`: it was this page's own
   * player, the page is already reloading and nothing more is to be drawn.
   */
  function remove(id: PlayerId): 'removed' | 'leaving' | 'failed' {
    const next = removePlayer(state, id);
    if (!next || !device) return 'failed';
    if (id === state.activeId) {
      // This page still holds the deleted adventure: it must not write it back while leaving.
      silence();
      if (clearPlayerData(device, id) && savePlayers(device, next)) rememberChoice(false);
      window.location.reload();
      return 'leaving';
    }
    if (!clearPlayerData(device, id) || !savePlayers(device, next)) return 'failed';
    state = next;
    return 'removed';
  }

  return {
    get state() {
      return state;
    },
    me: () => state.players.find((player) => player.id === state.activeId)!,
    several: () => state.players.length > 1,
    find: (id: PlayerId | null) => state.players.find((player) => player.id === id),
    stars: (id: PlayerId) => playerStars(device, id),
    chosenThisSession,
    sync,
    /** This page's player plays on: « Qui joue ? » is not asked again in this session. */
    stay: () => rememberChoice(true),
    /** Another player plays: false when nothing could be written, else the page reloads. */
    switchTo(id: PlayerId): boolean {
      if (!written(selectPlayer(state, id))) return false;
      leave();
      return true;
    },
    /** A new player, who plays at once: false when nothing could be written. */
    join(character: PlayerCharacter, name: string | null): boolean {
      if (!written(addPlayer(state, character, name))) return false;
      leave();
      return true;
    },
    /** A character or a nickname changes; the page stays. */
    edit(id: PlayerId, character: PlayerCharacter, name: string | null): boolean {
      const next = editPlayer(state, id, character, name);
      if (!written(next)) return false;
      state = next;
      return true;
    },
    remove,
  };
}
