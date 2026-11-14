import { setAttribute } from '../../i18n/dom.ts';
import type { RewardId } from '../../rewards.ts';
import { decoration, make } from '../dom.ts';
import { bagLabel } from './voyageWords.ts';

/**
 * The picture of a bonus card. The style sheet chooses it from the name of the card: a
 * small image of the ally or of the honey pot, the refuge in a blue disc for the crystal,
 * three clay coins drawn in the page for the purse.
 */
export function bonusPicture(id: RewardId) {
  const picture = decoration('span', 'bonus-picture');
  picture.dataset.bonus = id;
  if (id === 'pieces') picture.append(make('i'), make('i'), make('i'));
  return picture;
}

/**
 * « Ton sac de voyage » : the cards kept so far, in order, then one empty place for each
 * card still to choose.
 */
export function bagRow(bag: readonly RewardId[], places: number) {
  const row = make('div', { className: 'voyage-bag' });
  row.setAttribute('role', 'img');
  setAttribute(row, 'aria-label', bagLabel(bag.length, places));
  const title = make('span', { className: 'bag-title', text: 'Ton sac de voyage' });
  row.append(title);
  for (let place = 0; place < places; place++) {
    const id = bag[place];
    const slot = make('span', { className: id ? 'bag-card' : 'bag-empty' });
    if (id) slot.append(bonusPicture(id));
    row.append(slot);
  }
  return row;
}
