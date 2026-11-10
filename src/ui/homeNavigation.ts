export type HomePage = 'home' | 'missions' | 'classic' | 'parents' | 'favorites';

/** Visibility and focus only; mode and save decisions stay with their controllers. */
export function bindHomeNavigation(): { show(page: HomePage, focus?: boolean): void } {
  const screen = document.getElementById('home-screen')!;
  const back = document.getElementById('home-back')!;
  let current: HomePage = 'home';
  let returnFocus: HTMLElement | null = null;
  function show(page: HomePage, focus = true) {
    if (current === 'home' && page !== 'home') returnFocus = document.activeElement as HTMLElement;
    current = page;
    for (const node of Array.from(screen.querySelectorAll<HTMLElement>('[data-home-page]')))
      node.hidden = node.dataset.homePage !== page;
    back.hidden = page === 'home';
    screen.dataset.page = page;
    screen.scrollTop = 0;
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
