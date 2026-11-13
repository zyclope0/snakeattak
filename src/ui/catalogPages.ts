import { setAttribute } from '../i18n/dom.ts';
import { make } from './dom.ts';

const CARDS_PER_PAGE = 6;

/** Presentation pagination receives the controller's already-filtered cards. */
export function bindCatalogPages(onChange: () => void) {
  const previous = make('button', { id: 'catalog-previous', text: '← Précédents' });
  const status = make('span', { id: 'catalog-page' });
  status.setAttribute('role', 'status');
  const next = make('button', { id: 'catalog-next', text: 'Suivants →' });
  const nav = make('nav', { className: 'catalog-pagination' }, previous, status, next);
  setAttribute(nav, 'aria-label', 'Pages des alliés');
  const body = document.querySelector<HTMLElement>('#reinforcements .catalog-body')!;
  body.before(nav);
  let page = 0;
  let revealResults = false;
  previous.onclick = () => {
    page = Math.max(0, page - 1);
    revealResults = true;
    onChange();
  };
  next.onclick = () => {
    page++;
    revealResults = true;
    onChange();
  };
  return {
    reset() {
      page = 0;
      revealResults = true;
    },
    refresh(cards: HTMLButtonElement[]) {
      const total = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
      page = Math.min(page, total - 1);
      cards.forEach((card, index) => {
        card.hidden = Math.floor(index / CARDS_PER_PAGE) !== page;
      });
      status.textContent = `${page + 1} / ${total}`;
      previous.disabled = page === 0;
      next.disabled = page === total - 1;
      if (revealResults) {
        body.scrollTop = 0;
        revealResults = false;
      }
    },
  };
}
