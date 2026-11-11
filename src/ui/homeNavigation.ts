export type HomePage = 'home' | 'missions' | 'classic' | 'parents' | 'favorites';

/** Visibility and focus only; mode and save decisions stay with their controllers. */
export function bindHomeNavigation(): { show(page: HomePage, focus?: boolean): void } {
  // A fixed div outside a native modal is inert and cannot cover the top layer.
  // Host the same notice in the most recently opened modal during portrait,
  // preserving every dialog's open state, focus and pause lease.
  const notice = document.getElementById('orientation-notice')!;
  const noticeParent = notice.parentElement!;
  const portrait = matchMedia('(pointer: coarse) and (orientation: portrait)');
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
  const screen = document.getElementById('home-screen')!;
  const back = document.getElementById('home-back')!;
  let current: HomePage = 'home';
  let returnFocus: HTMLElement | null = null;
  function show(page: HomePage, focus = true) {
    if (current === 'home' && page !== 'home') returnFocus = document.activeElement as HTMLElement;
    const entering = current !== page;
    current = page;
    for (const node of Array.from(screen.querySelectorAll<HTMLElement>('[data-home-page]')))
      node.hidden = node.dataset.homePage !== page;
    back.hidden = page === 'home';
    screen.dataset.page = page;
    if (entering) {
      screen.scrollTop = 0;
      const destination = screen.querySelector<HTMLElement>(`[data-home-page="${page}"]`)!;
      destination.scrollTop = 0;
      // Some pages scroll inside their panel rather than as a whole.
      for (const panel of Array.from(destination.querySelectorAll('.home-disclosure')))
        panel.scrollTop = 0;
    }
    if (focus) {
      const target =
        page === 'home'
          ? returnFocus?.getClientRects().length
            ? returnFocus
            : document.getElementById('home-primary')
          : screen.querySelector<HTMLElement>(
              `[data-home-page="${page}"] h1, [data-home-page="${page}"] h2`,
            );
      target?.focus({ preventScroll: true });
    }
  }
  for (const button of Array.from(screen.querySelectorAll<HTMLElement>('[data-home-target]')))
    button.addEventListener('click', () => show(button.dataset.homeTarget as HomePage));
  back.onclick = () => show('home');
  screen.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && current !== 'home' && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      show('home');
    }
  });
  show('home', false);
  return { show };
}
