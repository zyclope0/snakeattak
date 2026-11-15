import { setAttribute as setDisplayAttribute, setText as setDisplayText } from '../i18n/dom.ts';
import { byId, dialogOpen } from './dom.ts';
import * as TEXT from '../texts/fr/battleScreens.ts';
/** Layout preference only: simulation and browser zoom remain under their own control. */
export function bindDisplay() {
  const button = byId('display-toggle');
  let expanded = false;
  const toggle = () => {
    expanded = !expanded;
    document.body.classList.toggle('game-expanded', expanded);
    button.setAttribute('aria-pressed', String(expanded));
    setDisplayAttribute(
      button,
      'aria-label',
      expanded ? TEXT.reduireLaVueDeJeu : TEXT.agrandirLaVueDeJeu,
    );
    setDisplayText(button.querySelector('span')!, expanded ? TEXT.reduire : TEXT.agrandir);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };
  button.onclick = toggle;
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && expanded && !dialogOpen()) toggle();
  });
}
