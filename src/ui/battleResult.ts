import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import './battleResult.css';
import { defeatCopy, earnedStars } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';
/** Reuse the existing actions: only their presentation moves after a match. */
export function bindBattleResult(session: Session) {
  const el = (id: string) => document.getElementById(id)!;
  const app = el('app'),
    panel = el('battle-result'),
    content = el('battle-result-content');
  const stars = document.createElement('p');
  stars.id = 'battle-result-stars';
  stars.setAttribute('role', 'img');
  stars.hidden = true;
  el('battle-result-title').after(stars);
  const mission = el('mission-battle-actions'),
    classic = el('end-restart');
  const homes = [mission, classic].map((node) => ({
    node,
    parent: node.parentNode!,
    next: node.nextSibling,
  }));
  const restore = (node: HTMLElement) => {
    const home = homes.find((slot) => slot.node === node)!;
    if (node.parentNode !== home.parent) home.parent.insertBefore(node, home.next);
  };
  const buttons = el('mission-next').parentElement!;
  const buttonOrder = Array.from(buttons.childNodes);
  let reordered = false;
  const restoreOrder = () => {
    if (reordered) {
      buttons.replaceChildren(...buttonOrder);
      reordered = false;
    }
  };
  let observed: Game | null = null;
  el('end-home').onclick = () => el('menu-home').click();
  el('result-allies').onclick = () => el('reinforcements-toggle').click();
  return () => {
    const g = session.game;
    const ended = session.screen === 'battle' && (g.status === 'won' || g.status === 'lost');
    panel.hidden = !ended;
    app.classList.toggle('showing-result', ended);
    if (!ended) {
      restore(mission);
      restore(classic);
      restoreOrder();
      observed = null;
      return;
    }
    setDisplayText(
      el('battle-result-title'),
      g.status === 'won'
        ? g.mission?.caprice
          ? 'Caprice réussi !'
          : 'Bravo !'
        : defeatCopy(g).title,
    );
    const earned = earnedStars(g);
    stars.hidden = !earned;
    if (earned) {
      setDisplayText(
        stars,
        earned.maximum === 3
          ? '★'.repeat(earned.count) + '☆'.repeat(3 - earned.count)
          : `★ ${earned.count} / ${earned.maximum}`,
      );
      setDisplayAttribute(
        stars,
        'aria-label',
        `${earned.count} étoiles gagnées sur ${earned.maximum}`,
      );
    }
    el('end-home').hidden = !!g.mission;
    el('battle-result-summary').hidden = !!g.mission;
    if (g.mission) {
      restore(classic);
      if (mission.parentNode !== content) content.append(mission);
      const primary = !el('mission-next').hidden ? el('mission-next') : el('mission-again');
      if (buttons.firstElementChild !== primary) {
        buttons.prepend(primary);
        reordered = true;
      }
    } else {
      restore(mission);
      restoreOrder();
      if (classic.parentNode !== content) content.append(classic);
      setDisplayText(
        el('battle-result-summary'),
        `${g.kills} serpents repoussés · cristal ${Math.ceil(g.base)} %`,
      );
    }
    if (observed !== g) {
      observed = g;
      panel.scrollTop = 0;
      // Show the outcome once; the player can reopen Allies to inspect the army.
      if (app.classList.contains('reinforcements-open')) el('reinforcements-close').click();
      const next = el('mission-next');
      const target = !g.mission ? classic : !next.hidden ? next : el('mission-again');
      requestAnimationFrame(() => {
        if (
          session.game === g &&
          !panel.hidden &&
          !app.hidden &&
          !document.hidden &&
          !document.querySelector('dialog[open]') &&
          panel.getClientRects().length &&
          !el('orientation-notice').getClientRects().length
        ) {
          target.focus({ preventScroll: true });
          const area = panel.getBoundingClientRect(),
            button = target.getBoundingClientRect();
          if (button.bottom > area.bottom - 4) panel.scrollTop += button.bottom - area.bottom + 4;
          else if (button.top < area.top + 4) panel.scrollTop -= area.top + 4 - button.top;
        }
      });
    }
  };
}
