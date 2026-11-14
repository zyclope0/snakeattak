import { byId, dialogOpen, portraitPhone } from './dom.ts';
export type HomePage = 'home' | 'missions' | 'classic' | 'parents' | 'favorites' | 'voyage';

/**
 * A fixed div outside a native modal is inert and cannot cover the top layer.
 * Host the same notice in the most recently opened modal during portrait,
 * preserving every dialog's open state, focus and pause lease.
 */
function hostOrientationNotice() {
  const notice = byId('orientation-notice');
  const noticeParent = notice.parentElement!;
  const portrait = portraitPhone();
  const modals: HTMLDialogElement[] = [];
  const positionNotice = () => {
    const parent = portrait.matches ? (modals.at(-1) ?? noticeParent) : noticeParent;
    if (notice.parentElement !== parent) parent.append(notice);
  };
  new MutationObserver((records) => {
    for (const record of records) {
      const dialog = record.target as HTMLDialogElement;
      const index = modals.indexOf(dialog);
      if (index !== -1) modals.splice(index, 1);
      if (dialog.matches('dialog:modal')) modals.push(dialog);
    }
    positionNotice();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  portrait.addEventListener('change', positionNotice);
  positionNotice();
}

/** A page that is entered starts at its top, whatever was scrolled before. */
function rewind(screen: HTMLElement, page: HomePage) {
  screen.scrollTop = 0;
  const destination = screen.querySelector<HTMLElement>(`[data-home-page="${page}"]`)!;
  destination.scrollTop = 0;
  // Some pages scroll inside their panel rather than as a whole.
  for (const panel of Array.from(destination.querySelectorAll('.home-disclosure')))
    panel.scrollTop = 0;
}

/** Visibility and focus only; mode and save decisions stay with their controllers. */
export function bindHomeNavigation(): { show(page: HomePage, focus?: boolean): void } {
  hostOrientationNotice();
  const screen = byId('home-screen');
  const back = byId('home-back');
  let current: HomePage = 'home';
  let returnFocus: HTMLElement | null = null;
  /** The heading of a page; back home, what opened the page, or else the main button. */
  function focusTarget(page: HomePage) {
    if (page !== 'home')
      return screen.querySelector<HTMLElement>(
        `[data-home-page="${page}"] h1, [data-home-page="${page}"] h2`,
      );
    return returnFocus?.getClientRects().length
      ? returnFocus
      : document.getElementById('home-primary');
  }
  function show(page: HomePage, focus = true) {
    if (current === 'home' && page !== 'home') returnFocus = document.activeElement as HTMLElement;
    const entering = current !== page;
    current = page;
    for (const node of Array.from(screen.querySelectorAll<HTMLElement>('[data-home-page]')))
      node.hidden = node.dataset.homePage !== page;
    back.hidden = page === 'home';
    screen.dataset.page = page;
    if (entering) rewind(screen, page);
    if (focus) focusTarget(page)?.focus({ preventScroll: true });
  }
  for (const button of Array.from(screen.querySelectorAll<HTMLElement>('[data-home-target]')))
    button.addEventListener('click', () => show(button.dataset.homeTarget as HomePage));
  back.onclick = () => show('home');
  screen.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && current !== 'home' && !dialogOpen()) {
      event.preventDefault();
      show('home');
    }
  });
  show('home', false);
  return { show };
}
