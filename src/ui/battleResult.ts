import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import './battleResult.css';
import { defeatCopy, earnedStars } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';
import { visualSettings } from '../render/visualSettings.ts';
import { byId } from './dom.ts';
/** Reuse the existing actions: only their presentation moves after a match. */
export function bindBattleResult(session: Session) {
  const app = byId('app'),
    panel = byId('battle-result'),
    content = byId('battle-result-content');
  const stars = document.createElement('p');
  stars.id = 'battle-result-stars';
  stars.setAttribute('role', 'img');
  stars.hidden = true;
  byId('battle-result-title').after(stars);
  const mission = byId('mission-battle-actions'),
    classic = byId('end-restart');
  const homes = [mission, classic].map((node) => ({
    node,
    parent: node.parentNode!,
    next: node.nextSibling,
  }));
  const restore = (node: HTMLElement) => {
    const home = homes.find((slot) => slot.node === node)!;
    if (node.parentNode !== home.parent) home.parent.insertBefore(node, home.next);
  };
  const buttons = byId('mission-next').parentElement!;
  const buttonOrder = Array.from(buttons.childNodes);
  let reordered = false;
  const restoreOrder = () => {
    if (reordered) {
      buttons.replaceChildren(...buttonOrder);
      reordered = false;
    }
  };
  let observed: Game | null = null;
  let starred = '';
  const motion = window.matchMedia('(prefers-reduced-motion:reduce)');
  byId('end-home').onclick = () => byId('menu-home').click();
  byId('result-allies').onclick = () => byId('reinforcements-toggle').click();
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
      starred = '';
      return;
    }
    setDisplayText(
      byId('battle-result-title'),
      g.status === 'won'
        ? g.mission?.caprice
          ? 'Caprice réussi !'
          : 'Bravo !'
        : defeatCopy(g).title,
    );
    // The caprice summary repeats this heading verbatim. Keep its sticker and
    // actions, and keep the original French announcement on defeat.
    byId('mission-result').hidden = g.status === 'won' && !!g.mission?.caprice;
    const earned = earnedStars(g);
    stars.hidden = !earned;
    if (earned) {
      const row =
        earned.maximum === 3
          ? '★'.repeat(earned.count) + '☆'.repeat(3 - earned.count)
          : `★ ${earned.count} / ${earned.maximum}`;
      setDisplayText(stars, row);
      // Same characters, one element each: earned stars land one after the other.
      // « Effets légers » and the system preference keep them still.
      if (earned.maximum === 3 && starred !== row) {
        starred = row;
        const still = visualSettings.reduced(motion.matches);
        stars.replaceChildren(
          ...Array.from(row, (character, i) => {
            const star = document.createElement('span');
            star.textContent = character;
            if (!still && character === '★') {
              star.className = 'star-pop';
              star.style.animationDelay = `${0.3 + i * 0.3}s`;
            }
            return star;
          }),
        );
      }
      setDisplayAttribute(
        stars,
        'aria-label',
        `${earned.count} étoiles gagnées sur ${earned.maximum}`,
      );
    }
    byId('end-home').hidden = !!g.mission;
    byId('battle-result-summary').hidden = !!g.mission;
    if (g.mission) {
      restore(classic);
      if (mission.parentNode !== content) content.append(mission);
      const primary = !byId('mission-next').hidden ? byId('mission-next') : byId('mission-again');
      if (buttons.firstElementChild !== primary) {
        buttons.prepend(primary);
        reordered = true;
      }
    } else {
      restore(mission);
      restoreOrder();
      if (classic.parentNode !== content) content.append(classic);
      setDisplayText(
        byId('battle-result-summary'),
        `${g.kills} serpents repoussés · cristal ${Math.ceil(g.base)} %`,
      );
    }
    if (observed !== g) {
      observed = g;
      panel.scrollTop = 0;
      // Show the outcome once; the player can reopen Allies to inspect the army.
      if (app.classList.contains('reinforcements-open')) byId('reinforcements-close').click();
      const next = byId('mission-next');
      const target = !g.mission ? classic : !next.hidden ? next : byId('mission-again');
      requestAnimationFrame(() => {
        if (
          session.game === g &&
          !panel.hidden &&
          !app.hidden &&
          !document.hidden &&
          !document.querySelector('dialog[open]') &&
          panel.getClientRects().length &&
          !byId('orientation-notice').getClientRects().length
        ) {
          const area = panel.getBoundingClientRect(),
            button = target.getBoundingClientRect();
          if (button.bottom > area.bottom - 4) {
            // A compact result can put Retry below the fold. Announce the outcome
            // first instead of scrolling its sole heading and stars out of view;
            // native Tab still reaches the album and every result action.
            const heading = byId('battle-result-title');
            heading.tabIndex = -1;
            heading.focus({ preventScroll: true });
          } else target.focus({ preventScroll: true });
        }
      });
    }
  };
}
