import type { createCapriceAlbumsController } from '../capriceAlbums.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { MISSIONS } from '../missions.ts';
import { stickerResultNote } from './capriceResultNote.ts';
import { pauseForDialog } from './dialogs.ts';
import { make } from './dom.ts';
import type { AlbumBook } from './capriceBook.ts';
import * as TEXT from '../texts/fr/capriceScreens.ts';

export type AlbumsController = ReturnType<typeof createCapriceAlbumsController>;

/** Choosing a sticker book only makes sense when the family already has several. */
export const albumChoiceShown = (count: number) => count > 1;

/** The family's books in a list, rebuilt only when a book appears or changes its name. */
export function albumOptions(select: HTMLSelectElement, albums: AlbumsController) {
  const state = albums.state;
  const signature = JSON.stringify(state.children.map((c) => [c.id, c.name]));
  if (select.dataset.options !== signature) {
    select.replaceChildren(
      ...state.children.map((child) => {
        const option = make('option');
        option.value = child.id;
        // A book's name is the family's own word: it is never translated.
        option.dataset.copyRaw = '';
        option.textContent = child.name;
        return option;
      }),
    );
    select.dataset.options = signature;
  }
  select.value = state.activeId;
}

export function bindCapriceAlbums(
  session: Session,
  albums: AlbumsController,
  refresh: () => void,
  status: () => string,
  award: (game: Game) => boolean | undefined = () => undefined,
) {
  const home = make('button', { id: 'home-caprice-album', text: TEXT.monCarnetDeCaprices });
  document.getElementById('home-expeditions')?.after(home);
  const result = stickerResultNote(albums, award);
  let returnFocus: HTMLElement | null = null;
  // The book looked at: the one of the game just played, else the family's active one.
  let viewed: string | null = null;
  let signature = '';
  /** The window of the book, once its file has arrived; nothing is drawn in it before. */
  let book: AlbumBook | undefined;
  let modal: ReturnType<typeof pauseForDialog> | undefined;
  const restoreFocus = () => returnFocus?.focus({ preventScroll: true });
  /** The window, put in the page once: its file is asked for as the game starts. */
  function place(module: typeof import('./capriceBook.ts')) {
    const made = module.albumBook(albums);
    document.body.append(made.dialog);
    modal = pauseForDialog(made.dialog, session, refresh);
    made.close.onclick = () => {
      modal!.close();
      restoreFocus();
    };
    made.dialog.addEventListener('close', restoreFocus);
    made.select.onchange = () => {
      albums.select(made.select.value);
      viewed = null;
      refresh();
      update(true);
    };
    book = made;
  }
  let loading: Promise<void> | undefined;
  const load = () => (loading ??= import('./capriceBook.ts').then(place));
  function open(owner?: string | null) {
    load().then(
      () => {
        // Two taps while the file arrived open the book once.
        if (book!.dialog.open) return;
        viewed = owner ?? null;
        if (owner && session.game.mission) {
          const index = MISSIONS.findIndex((m) => m.id === session.game.mission!.missionId);
          if (index >= 0) book!.pager.aim(index);
        }
        returnFocus = document.activeElement as HTMLElement;
        update(true);
        modal!.open();
        book!.close.focus();
      },
      // The file did not arrive (a web page that lost its network): nothing opens and the game
      // stays as it is. The next tap asks again, but the browser keeps the failure: the book
      // stays closed until the page is reloaded (see `lateDoor`).
      () => (loading = undefined),
    );
  }
  home.onclick = () => open();
  result.button.onclick = () => open(albums.state.campProfileId);
  function update(force = false) {
    const state = albums.state;
    result.show(session.game, state.campProfileId ?? state.activeId);
    if (!book || (!book.dialog.open && !force)) return;
    // Redrawn only when the books, the one looked at or the save status have changed.
    const saveStatus = status();
    const next = JSON.stringify([state, viewed, saveStatus]);
    if (next === signature) return;
    signature = next;
    book.show(state, viewed ?? state.activeId, saveStatus);
  }
  void load().catch(() => (loading = undefined));
  return { refresh: () => update(), open };
}
