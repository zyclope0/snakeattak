import type { Game } from '../../game.ts';
import type { LastingBoon } from '../../boons.ts';
import { BOON_SIGNS, stars } from '../boonCopy.ts';
import { honeySheetUrl } from '../feastControls.ts';
import { decoration, make } from '../dom.ts';

/** A gift held, as the rules keep it. */
export type Held = { id: LastingBoon; level: number };
/** One place: the sign of the gift and its stars, or a dotted empty place. */
export type Place = { node: HTMLElement; sign: HTMLElement; level: HTMLElement };

export function place(): Place {
  const sign = decoration('span', 'boon-sign');
  const level = decoration('small', 'boon-stars');
  return { node: make('span', { className: 'boon-case' }, sign, level), sign, level };
}

/** Paints a place only when what it shows changes: the shelf is refreshed often. */
export function paint(place: Place, held: Held | undefined) {
  const key = held ? `${held.id}${held.level}` : '';
  if (place.node.dataset.key === key) return;
  place.node.dataset.key = key;
  place.node.dataset.boon = held?.id ?? '';
  place.sign.textContent = held ? BOON_SIGNS[held.id] : '';
  // The honey keeps its pot, as on its card.
  place.sign.style.backgroundImage = held?.id === 'miel' ? `url("${honeySheetUrl()}")` : '';
  place.level.textContent = held ? stars(held.level) : '';
}

/** The places of a game in a row (`.boon-places`), as many as its rules give, the gifts first. */
export function placesRow() {
  const places: Place[] = [];
  const row = make('span', { className: 'boon-places' });
  return {
    row,
    show(game: Game) {
      const count = game.boonRules.places;
      while (places.length < count) row.append(places[places.push(place()) - 1].node);
      places.forEach((p, i) => {
        p.node.hidden = i >= count;
        paint(p, game.boons[i]);
      });
    },
  };
}
