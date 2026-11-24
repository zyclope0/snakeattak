import type { CapriceAlbums } from '../capriceAlbums.ts';
import { MISSIONS, type MissionDefinition } from '../missions.ts';
import { capricesForMission, CAPRICE_SET_NAMES, type CapriceDefinition } from '../caprices.ts';
import { setText, setAttribute, createTextNode } from '../i18n/dom.ts';
import { frenchLeaf } from './capriceCopy.ts';
import { stickerGraphic } from './capriceIcons.ts';
import { albumChoiceShown, albumOptions, type AlbumsController } from './capriceAlbums.ts';
import { make } from './dom.ts';
import * as TEXT from '../texts/fr/capriceScreens.ts';

/**
 * The window of the sticker book: its pages, its stickers, the arrows that turn them. A file of
 * its own, asked for as the game starts (`bindCapriceAlbums`): only the button of the home and
 * the note of a result are loaded with the game.
 */

type StickerSlot = { node: HTMLElement; id: string; status: HTMLElement };
export type AlbumBook = ReturnType<typeof albumBook>;

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
export function albumBook(albums: AlbumsController) {
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
