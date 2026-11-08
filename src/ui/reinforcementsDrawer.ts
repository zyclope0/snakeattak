/** An on-demand catalogue at every screen size; recruitment remains owned by the existing controls. */
export function bindReinforcementsDrawer() {
  const app = document.getElementById('app')!;
  const panel = document.getElementById('reinforcements')!;
  const toggle = document.getElementById('reinforcements-toggle')!;
  const close = document.getElementById('reinforcements-close')!;
  const backdrop = document.getElementById('reinforcements-backdrop')!;
  const compact = matchMedia(
    '(max-width: 1100px) and (max-height: 520px) and (orientation: landscape)',
  );
  let open = false;
  let trigger: HTMLElement = toggle;
  const show = (value: boolean, focus = false) => {
    if (value && !open && document.activeElement instanceof HTMLElement)
      trigger = document.activeElement;
    open = value;
    app.classList.toggle('reinforcements-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    panel.inert = !open;
    if (focus) (open ? close : trigger).focus({ preventScroll: true });
  };
  toggle.onclick = () => show(!open, true);
  close.onclick = () => show(false, true);
  backdrop.onclick = () => show(false, true);
  for (const control of [
    document.getElementById('mobile-home'),
    document.getElementById('menu-home'),
    document.querySelector('#app .brand'),
  ])
    control?.addEventListener('click', () => show(false));
  compact.addEventListener('change', () => show(false, open));
  panel.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      '[data-kind], [data-quick-kind]',
    );
    if (button && !button.disabled && open) {
      show(false);
      document.getElementById('game')!.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) show(false, true);
    // The catalogue now sits beside the board. Keep the HUD reachable by keyboard.
  });
  show(false);
}
