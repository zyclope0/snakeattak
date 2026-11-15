import type { CapriceAlbums, createCapriceAlbumsController } from '../capriceAlbums.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { MISSIONS, type MissionDefinition } from '../missions.ts';
import { capricesForMission, CAPRICE_SET_NAMES, type CapriceDefinition } from '../caprices.ts';
import { setText, setAttribute, createTextNode } from '../i18n/dom.ts';
import { frenchLeaf } from './capriceCopy.ts';
import { stickerGraphic } from './capriceIcons.ts';
import { stickerResultNote } from './capriceResultNote.ts';
import { pauseForDialog } from './dialogs.ts';
import { make } from './dom.ts';
import * as TEXT from '../texts/fr/capriceScreens.ts';

export type AlbumsController = ReturnType<typeof createCapriceAlbumsController>;
type StickerSlot = { node: HTMLElement; id: string; status: HTMLElement };

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

/** A sticker's place in the book: the clay vignette of the caprice, with no reward attached. */
function stickerSlot(caprice: CapriceDefinition): StickerSlot {
  const node = make('div', { className: 'caprice-sticker' });
  node.dataset.sticker = caprice.id;
  const status = make('small');
  node.append(stickerGraphic(caprice), frenchLeaf('span', caprice.name), status);
  return { node, id: caprice.id, status };
}

/** A page of the book: one mission and its two rows of three stickers. */
function missionPage(mission: MissionDefinition, shown: boolean) {
  const node = make('section');
  node.dataset.albumMission = mission.id;
  node.hidden = !shown;
  const heading = make('h3', { id: `album-mission-${mission.id}`, text: mission.name });
  node.setAttribute('aria-labelledby', heading.id);
  node.append(heading);
  const stickers: StickerSlot[] = [];
  for (const set of ['serpents', 'createur'] as const) {
    const row = capricesForMission(mission.id, set).map(stickerSlot);
    node.append(
      frenchLeaf('h4', CAPRICE_SET_NAMES[set]),
      make('div', { className: 'caprice-album-grid' }, ...row.map((slot) => slot.node)),
    );
    stickers.push(...row);
  }
  return { node, stickers };
}

/** The two arrows that turn the pages, one mission at a time, and the page they are on. */
function albumPager(pages: readonly HTMLElement[], scroller: HTMLElement) {
  let current = 0;
  const previous = make('button', { id: 'caprice-album-previous', text: TEXT.pagePrecedente });
  const next = make('button', { id: 'caprice-album-next', text: TEXT.pageSuivante });
  const position = make('span', { id: 'caprice-album-page' });
  position.setAttribute('role', 'status');
  const nav = make('nav', { className: 'caprice-album-pagination' });
  setAttribute(nav, 'aria-label', TEXT.missionsDuCarnet);
  nav.append(previous, position, next);
  const show = () => {
    pages.forEach((page, index) => {
      page.hidden = index !== current;
    });
    previous.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    setText(position, `${current + 1} / ${pages.length}`);
    scroller.scrollTop = 0;
  };
  previous.onclick = () => {
    if (current > 0) current--;
    show();
  };
  next.onclick = () => {
    if (current < pages.length - 1) current++;
    show();
  };
  return {
    nav,
    show,
    /** The page the next `show` displays; nothing moves until then. */
    aim(index: number) {
      current = index;
    },
  };
}

/** The window of the book, not yet in the page: heading, choice of book, pages, save status. */
function albumBook(albums: AlbumsController) {
  const dialog = make('dialog', { id: 'caprice-album-dialog', className: 'caprice-album-dialog' });
  dialog.setAttribute('aria-labelledby', 'caprice-album-title');
  const title = make('h2', { id: 'caprice-album-title', text: TEXT.monCarnetDeCaprices });
  const close = make('button', { id: 'caprice-album-close', text: TEXT.fermer });
  // A child's word under the title: what this book is for.
  const hint = make('p', {
    id: 'caprice-album-hint',
    className: 'caprice-album-hint',
    text: TEXT.reussisUnCapricePourGagnerSon,
  });
  dialog.setAttribute('aria-describedby', hint.id);
  const heading = make('div', { className: 'caprice-album-heading' }, title, hint);
  // No book is created or renamed here any more. A save that already holds several keeps this
  // choice to go from one to the other; with a single book there is nothing to choose.
  const select = make('select', { id: 'caprice-album-profile' });
  const tools = make(
    'div',
    { className: 'caprice-profile-tools' },
    make('label', {}, createTextNode(TEXT.carnetChoisi), select),
  );
  tools.hidden = !albumChoiceShown(albums.state.children.length);
  const status = make('p', { id: 'caprice-album-status' });
  const pages = MISSIONS.map((mission, index) => missionPage(mission, index === 0));
  const pageNodes = pages.map((page) => page.node);
  const slots = make('div', { className: 'caprice-album-slots' }, ...pageNodes);
  const pager = albumPager(pageNodes, slots);
  const header = make('header', { className: 'caprice-album-header' }, heading, close);
  dialog.append(header, tools, pager.nav, slots, status);
  const stickers = pages.flatMap((page) => page.stickers);
  return {
    dialog,
    close,
    select,
    pager,
    /** The book `bookId` of the family: its stickers earned or still to discover. */
    show(state: CapriceAlbums, bookId: string, saveStatus: string) {
      albumOptions(select, albums);
      tools.hidden = !albumChoiceShown(state.children.length);
      select.value = bookId;
      const child = state.children.find((c) => c.id === bookId)!;
      for (const slot of stickers) {
        const earned = child.completed.includes(slot.id);
        slot.node.dataset.earned = String(earned);
        setText(slot.status, earned ? TEXT.autocollantGagne : TEXT.aDecouvrir);
      }
      pager.show();
      setText(status, saveStatus);
    },
  };
}

export function bindCapriceAlbums(
  session: Session,
  albums: AlbumsController,
  refresh: () => void,
  status: () => string,
  award: (game: Game) => boolean | undefined = () => undefined,
) {
  const book = albumBook(albums);
  document.body.append(book.dialog);
  const modal = pauseForDialog(book.dialog, session, refresh);
  const home = make('button', { id: 'home-caprice-album', text: TEXT.monCarnetDeCaprices });
  document.getElementById('home-expeditions')?.after(home);
  const result = stickerResultNote(albums, award);
  let returnFocus: HTMLElement | null = null;
  // The book looked at: the one of the game just played, else the family's active one.
  let viewed: string | null = null;
  let signature = '';
  const restoreFocus = () => returnFocus?.focus({ preventScroll: true });
  function open(owner?: string | null) {
    viewed = owner ?? null;
    if (owner && session.game.mission) {
      const index = MISSIONS.findIndex((m) => m.id === session.game.mission!.missionId);
      if (index >= 0) book.pager.aim(index);
    }
    returnFocus = document.activeElement as HTMLElement;
    update(true);
    modal.open();
    book.close.focus();
  }
  home.onclick = () => open();
  result.button.onclick = () => open(albums.state.campProfileId);
  book.close.onclick = () => {
    modal.close();
    restoreFocus();
  };
  book.dialog.addEventListener('close', restoreFocus);
  book.select.onchange = () => {
    albums.select(book.select.value);
    viewed = null;
    refresh();
    update(true);
  };
  function update(force = false) {
    const state = albums.state;
    result.show(session.game, state.campProfileId ?? state.activeId);
    if (!book.dialog.open && !force) return;
    // Redrawn only when the books, the one looked at or the save status have changed.
    const saveStatus = status();
    const next = JSON.stringify([state, viewed, saveStatus]);
    if (next === signature) return;
    signature = next;
    book.show(state, viewed ?? state.activeId, saveStatus);
  }
  return { refresh: () => update(), open };
}
