import { setText, setAttribute } from '../i18n/dom.ts';

/** Presentation pagination receives the controller's already-filtered cards. */
export function bindCatalogPages(onChange: () => void) {
  const nav = document.createElement('nav');
  nav.className = 'catalog-pagination';
  setAttribute(nav, 'aria-label', 'Pages des alliés');
  const previous = document.createElement('button');
  previous.id = 'catalog-previous';
  setText(previous, '← Précédents');
  const status = document.createElement('span');
  status.id = 'catalog-page';
  status.setAttribute('role', 'status');
  const next = document.createElement('button');
  next.id = 'catalog-next';
  setText(next, 'Suivants →');
  nav.append(previous, status, next);
  document.getElementById('shop')!.before(nav);
  let page = 0;
  previous.onclick = () => {
    page = Math.max(0, page - 1);
    onChange();
  };
  next.onclick = () => {
    page++;
    onChange();
  };
  return {
    reset() {
      page = 0;
    },
    refresh(cards: HTMLButtonElement[]) {
      const total = Math.max(1, Math.ceil(cards.length / 6));
      page = Math.min(page, total - 1);
      cards.forEach((card, index) => {
        card.hidden = Math.floor(index / 6) !== page;
      });
      status.textContent = `${page + 1} / ${total}`;
      previous.disabled = page === 0;
      next.disabled = page === total - 1;
    },
  };
}
