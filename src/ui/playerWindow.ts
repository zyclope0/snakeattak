import { nicknameFromInput, suggestedCharacter } from '../players.ts';
import type { Player, PlayerCharacter, PlayerId } from '../players.ts';
import type { createPlayerList } from './playerList.ts';
import type { createPlayersDialog } from './playersDialog.ts';
import { confirmView, manageView, pickView, whoView } from './playerViews.ts';
import * as TEXT from '../texts/fr/players.ts';

type Gestures = {
  play: (id: PlayerId) => void;
  savePick: (player: Player | undefined, kind: PlayerCharacter, nickname: string) => void;
  erase: (id: PlayerId) => void;
};
const faceOf = (id: PlayerId) => `[data-player="${id}"] .player-face`;
const toolOf = (id: PlayerId) => `[data-player="${id}"] .player-tool`;

/** The views of the window: what each one shows, where the focus goes, where it leads. */
function playerScreens(
  list: ReturnType<typeof createPlayerList>,
  dialog: ReturnType<typeof createPlayersDialog>,
  on: Gestures,
) {
  function who(focus = faceOf(list.state.activeId)) {
    const { cards, note } = whoView(list.state, list.stars, on.play, pick, () => pick(null));
    const target = cards.querySelector<HTMLElement>(focus);
    const first = cards.querySelector<HTMLElement>('.player-face')!;
    dialog.show('who', TEXT.quiJoue, [cards, note], target ?? first);
  }
  function pick(editing: PlayerId | null) {
    const player = list.find(editing);
    const view = pickView(
      player,
      player?.character ?? suggestedCharacter(list.state),
      (kind, nickname) => on.savePick(player, kind, nickname),
      () => who(player ? toolOf(player.id) : '#player-new'),
    );
    dialog.show('pick', TEXT.choisisTonPersonnage, view.content, view.focus);
  }
  function manage(focus?: PlayerId) {
    const cards = manageView(list.state, list.stars, confirm);
    const tool = focus && cards.querySelector<HTMLElement>(toolOf(focus));
    dialog.show('manage', TEXT.joueurs, [cards], tool || dialog.close);
  }
  function confirm(id: PlayerId) {
    const player = list.find(id);
    if (!player || !list.several()) return;
    const view = confirmView(
      player,
      () => on.erase(id),
      () => manage(id),
    );
    dialog.show('confirm', TEXT.supprimerCeJoueur, view.content, view.focus);
  }
  return { who, manage };
}

/**
 * The views of the window of the players: « Qui joue ? », the choice of a character and the
 * parents' list. Loaded the first time the window opens: most families have one player and
 * never see it. The window itself (`playersDialog.ts`) is made at once, so that it covers
 * the page from the first instant when someone must say who plays.
 */
export function createPlayerWindow(
  list: ReturnType<typeof createPlayerList>,
  dialog: ReturnType<typeof createPlayersDialog>,
  drawOutside: () => void,
) {
  const screens = playerScreens(list, dialog, { play, savePick, erase });

  function savePick(player: Player | undefined, kind: PlayerCharacter, nickname: string) {
    if (!list.sync()) return;
    const name = nicknameFromInput(nickname);
    const saved = player ? list.edit(player.id, kind, name) : list.join(kind, name);
    if (!saved) return dialog.fail();
    // A new player: the page is reloading on that player's keys.
    if (!player) return;
    drawOutside();
    screens.who(toolOf(player.id));
  }
  function play(id: PlayerId) {
    if (!list.sync()) return;
    if (id !== list.state.activeId) {
      if (!list.switchTo(id)) dialog.fail();
      return;
    }
    list.stay();
    dialog.require(false);
    dialog.shut();
  }
  function erase(id: PlayerId) {
    if (!list.sync()) return;
    const outcome = list.remove(id);
    if (outcome === 'failed') return dialog.fail();
    if (outcome === 'leaving') return;
    drawOutside();
    if (list.several()) screens.manage();
    else dialog.shut();
  }
  return {
    who: () => screens.who(),
    manage: () => screens.manage(),
    /** The list changed in another tab: redraw the list this window is showing. */
    follow() {
      const view = dialog.shown();
      if (view === 'who') screens.who();
      else if (view === 'manage' && list.several()) screens.manage();
      else if (view === 'manage') dialog.shut();
    },
  };
}
export type PlayerWindow = ReturnType<typeof createPlayerWindow>;
