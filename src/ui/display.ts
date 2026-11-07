/** Layout preference only: simulation and browser zoom remain under their own control. */
export function bindDisplay() {
  const button = document.getElementById('display-toggle')!;
  let expanded = false;
  const toggle = () => {
    expanded = !expanded;
    document.body.classList.toggle('game-expanded', expanded);
    button.setAttribute('aria-pressed', String(expanded));
    button.setAttribute(
      'aria-label',
      expanded ? 'Réduire la vue de jeu' : 'Agrandir la vue de jeu',
    );
    button.querySelector('span')!.textContent = expanded ? 'Réduire' : 'Agrandir';
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };
  button.onclick = toggle;
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && expanded && !document.querySelector('dialog[open]')) toggle();
  });
}
