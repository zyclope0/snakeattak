import { setAttribute } from '../../i18n/dom.ts';
import type { RewardId } from '../../rewards.ts';
import { make } from '../dom.ts';
import { bonusPicture } from './voyageBag.ts';
import { bonusWords } from './voyageWords.ts';
import * as TEXT from '../../texts/fr/voyageScreens.ts';

/** One of the three cards: the whole card is the button. */
function bonusCard(id: RewardId, coins: number, choose: (id: RewardId) => void) {
  const words = bonusWords(id, coins);
  const card = make(
    'button',
    { className: 'bonus-card' },
    bonusPicture(id),
    make('strong', { text: words.title }),
    make('span', { className: 'bonus-detail', text: words.detail }),
    make('small', { text: TEXT.choisirCeBonus }),
  );
  card.type = 'button';
  card.dataset.bonus = id;
  setAttribute(card, 'aria-label', `${words.title}. ${words.detail}`);
  card.onclick = () => choose(id);
  return card;
}

/**
 * Between two stages: three large cards, one to keep. There is no way to pass: the voyage
 * goes on with one of them. `offer` comes from the voyage, never from here.
 */
export function bonusChoice(
  offer: readonly RewardId[],
  coins: number,
  choose: (id: RewardId) => void,
): HTMLElement[] {
  return [
    make('h2', { text: TEXT.choisisUnBonusPourLaSuiteDuVoyage }),
    make('div', { className: 'bonus-cards' }, ...offer.map((id) => bonusCard(id, coins, choose))),
  ];
}

/** Beside the bag, in a child's words: a card chosen now counts until the voyage ends. */
export const bonusRule = () =>
  make('p', {
    className: 'bonus-rule',
    text: TEXT.tuLeGardesDansTonSacJusquALaFinDu,
  });
