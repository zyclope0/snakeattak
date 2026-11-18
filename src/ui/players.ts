import { PLAYERS_KEY } from '../storageKeys.ts';
import './players.css';
import { createPlayerList, type PlayerListOptions } from './playerList.ts';
import { placePlayerMarks } from './playerMarks.ts';
import { createPlayersDialog } from './playersDialog.ts';
import type { PlayerWindow } from './playerWindow.ts';
import * as TEXT from '../texts/fr/players.ts';

/**
 * The players of this device: the chip of the home header, the window, and its views
 * (« Qui joue ? », the choice of a character, the parents' list: `playerWindow.ts`), a file
 * of its own fetched as the game starts. `playerList.ts` holds the list and writes it.
 */
export function bindPlayers(options: PlayerListOptions) {
  const list = createPlayerList(options);
  const marks = placePlayerMarks();
  const drawOutside = () => marks.draw(list.me(), list.several());
  let loading: Promise<PlayerWindow> | undefined;
  const fetchViews = () =>
    (loading ??= import('./playerWindow.ts').then((module) =>
      module.createPlayerWindow(list, dialog, drawOutside),
    ));
  /**
   * Draws a view once the views are there. When their file cannot be read, the window
   * closes and the game stays as it is, a question left unanswered included: an empty
   * window that cannot be left would hold the child. The next tap tries again.
   */
  const withViews = (draw: (shown: PlayerWindow) => void) =>
    fetchViews().then(draw, () => {
      loading = undefined;
      dialog.require(false);
      dialog.shut();
    });
  const dialog = createPlayersDialog(() => void withViews((shown) => shown.who()), marks.chip);

  function openFrom(opener: HTMLElement, view: 'who' | 'manage') {
    if (!list.sync()) return;
    dialog.openedBy(opener);
    drawOutside();
    void withViews((shown) => shown[view]());
  }
  /** The list changed in another tab: follow it, and redraw the window if it is open. */
  function followOtherTab(event: StorageEvent) {
    if (event.key !== null && event.key !== PLAYERS_KEY) return;
    if (!list.sync()) return;
    drawOutside();
    void loading?.then(
      (shown) => shown.follow(),
      () => undefined,
    );
  }

  // Fetched at once, beside the rest of the page: by the first tap the views are there, and
  // a window drawn a moment late let a finger fall between two of its drawings.
  void fetchViews().catch(() => (loading = undefined));
  marks.chip.onclick = () => openFrom(marks.chip, 'who');
  marks.manage.onclick = () => openFrom(marks.manage, 'manage');
  window.addEventListener('storage', followOtherTab);
  drawOutside();
  if (list.several() && !list.chosenThisSession()) {
    // Someone must say who plays before anything else: the window covers the page at once,
    // and its cards come with the views.
    dialog.require(true);
    dialog.show('who', TEXT.quiJoue, [], dialog.close);
    void withViews((shown) => shown.who());
  }
}
