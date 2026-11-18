import './snakeIndex.css';
import { enemyPortraitStyle } from '../../art.ts';
import { TOTAL_WAVES } from '../../gameConstants.ts';
import { make } from '../dom.ts';
import { renderThreatCards } from '../threatCards.ts';
import { abilityOf, type ThreatKind } from '../threatPreview.ts';
import { setText } from '../../i18n/dom.ts';
import type { BalanceRevision } from '../../balanceRevision.ts';
import { snakeEntries } from './snakeEntries.ts';
import type { SnakeEntry } from './snakeEntries.ts';
import * as TEXT from '../../texts/fr/snakeIndex.ts';
import { fill } from '../../texts/fill.ts';

/** When a child first meets this snake in the great adventure. */
const arrival = (entry: SnakeEntry) =>
  entry.firstWave === TOTAL_WAVES ? TEXT.aLaDerniereVague : fill(TEXT.desLaVagueN, entry.firstWave);

/** One snake: the card of the dangers (portrait, name, what it does) and when it arrives. */
function snakeCard(entry: SnakeEntry): HTMLElement {
  const item = make('li', { className: 'snake-entry' });
  renderThreatCards(item, [entry.kind]);
  const copy = item.querySelector('.threat-card > div')!;
  if (entry.kind === 'king') copy.append(make('small', { text: TEXT.cEstLeChefDesSerpents }));
  copy.append(make('em', { text: arrival(entry) }));
  return item;
}

/** The egg is not a snake yet, but it is where many of them come from. */
function eggCard(): HTMLElement {
  const picture = make('span', { className: 'enemy-portrait' });
  picture.style.cssText = enemyPortraitStyle('egg');
  picture.setAttribute('aria-hidden', 'true');
  const copy = make(
    'div',
    {},
    make('strong', { text: TEXT.oeufDeSerpent }),
    make('small', { text: TEXT.deuxSerpentsSortentDeLOeufPendantLaBataille }),
    make('em', { text: TEXT.dansToutesLesVagues }),
  );
  return make(
    'li',
    { className: 'snake-entry' },
    make('div', { className: 'threat-card' }, picture, copy),
  );
}

/**
 * The index of the snakes, built on first use: every snake of the game, what it does and when
 * it arrives. Its title and its button stay in place while the cards scroll under them.
 * Returns the function that opens it at the first snake.
 */
export function snakeIndexWindow(): (revision?: BalanceRevision) => void {
  const heading = make('h2', { id: 'snake-index-title', text: TEXT.tousLesSerpents });
  const close = make('button', {
    id: 'snake-index-close',
    className: 'secondary',
    text: TEXT.fermer,
  });
  close.type = 'button';
  const list = make('ul', { id: 'snake-index-list' }, ...snakeEntries().map(snakeCard), eggCard());
  const body = make('div', { id: 'snake-index-body' }, list);
  // A reader with a keyboard scrolls the cards with the arrow keys.
  body.tabIndex = 0;
  body.setAttribute('role', 'region');
  body.setAttribute('aria-labelledby', heading.id);
  const dialog = make(
    'dialog',
    { id: 'snake-index-dialog' },
    make('header', {}, heading, close),
    body,
  );
  dialog.setAttribute('aria-labelledby', heading.id);
  document.body.append(dialog);
  close.onclick = () => dialog.close();
  return (revision?: BalanceRevision) => {
    // The cards say what each snake does in the game the index is opened from: the ninja
    // snake of an older game only dodges.
    for (const card of Array.from(
      list.querySelectorAll<HTMLElement>('.threat-card[data-threat]'),
    )) {
      const kind = card.dataset.threat as ThreatKind;
      setText(card.querySelector('small')!, abilityOf(kind, revision));
    }
    dialog.showModal();
    body.scrollTop = 0;
  };
}
