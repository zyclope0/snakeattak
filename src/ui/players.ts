import { PLAYERS_KEY } from '../storageKeys.ts';
import './players.css';
import { createPlayerList, type PlayerListOptions } from './playerList.ts';
import { placePlayerMarks } from './playerMarks.ts';
import { createPlayersDialog } from './playersDialog.ts';
import type { PlayerWindow } from './playerWindow.ts';
import * as TEXT from '../texts/fr/players.ts';

/**
 * The players of this device: the chip of the home header, the window, and its views
 * (« Qui joue ? », the choice of a character, the parents' list: `playerWindow.ts`), loaded
 * the first time the window opens. `playerList.ts` holds the list and writes it.
 */
export function bindPlayers(options: PlayerListOptions) {
  const list = createPlayerList(options);
  const marks = placePlayerMarks();
  const drawOutside = () => marks.draw(list.me(), list.several());
  let loading: Promise<PlayerWindow> | undefined;
  const views = () =>
    (loading ??= import('./playerWindow.ts').then((module) =>
      module.createPlayerWindow(list, dialog, drawOutside),
    ));
  const dialog = createPlayersDialog(() => void views().then((shown) => shown.who()), marks.chip);

  function openFrom(opener: HTMLElement, view: 'who' | 'manage') {
    if (!list.sync()) return;
    dialog.openedBy(opener);
    drawOutside();
    void views().then((shown) => shown[view]());
  }
  /** The list changed in another tab: follow it, and redraw the window if it is open. */
  function followOtherTab(event: StorageEvent) {
    if (event.key !== null && event.key !== PLAYERS_KEY) return;
    if (!list.sync()) return;
    drawOutside();
    void loading?.then((shown) => shown.follow());
  }

  // Fetched at once, beside the rest of the page: by the first tap the views are there, and
  // a window drawn a moment late let a finger fall between two of its drawings.
  void views();
  marks.chip.onclick = () => openFrom(marks.chip, 'who');
  marks.manage.onclick = () => openFrom(marks.manage, 'manage');
  window.addEventListener('storage', followOtherTab);
  drawOutside();
  if (list.several() && !list.chosenThisSession()) {
    // Someone must say who plays before anything else: the window covers the page at once,
    // and its cards come with the views.
    dialog.require(true);
    dialog.show('who', TEXT.quiJoue, [], dialog.close);
    void views().then((shown) => shown.who());
  }
}
