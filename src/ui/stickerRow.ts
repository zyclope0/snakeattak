import { setAttribute } from '../i18n/dom.ts';
import { stickerUrl } from './capriceIcons.ts';
import { make } from './dom.ts';
import { stickerCountLabel } from './stickerGoals.ts';
import type { StickerTally } from './stickerGoals.ts';

/**
 * The six stickers of a mission in one small row, as a mission card and the result of a
 * mission show them: one place per caprice, in the order of the book's page, filled once
 * the caprice is won. The picture of a sticker is the background of its place: the gold disc
 * under it shows while the picture loads, and for a caprice that has none.
 */
export function stickerRow() {
  const row = make('span', { className: 'sticker-row' });
  row.setAttribute('role', 'img');
  const places = Array.from({ length: 6 }, () => make('span'));
  row.append(...places);
  return {
    row,
    show(tally: StickerTally) {
      for (const [index, slot] of tally.slots.entries()) {
        const place = places[index]!;
        const url = slot.earned ? stickerUrl(slot.caprice.id) : undefined;
        place.dataset.earned = String(slot.earned);
        place.style.backgroundImage = url ? `url("${url}")` : '';
      }
      setAttribute(row, 'aria-label', stickerCountLabel(tally));
    },
  };
}
