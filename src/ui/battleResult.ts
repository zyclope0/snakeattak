import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import './battleResult.css';
import { defeatCopy, earnedStars } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';
import { visualSettings } from '../render/visualSettings.ts';
import { byId, make } from './dom.ts';
import { dialogOpen, forwardClick } from './battleDom.ts';
import { battleOver } from './battleState.ts';

/** Reuse the existing actions: only their presentation moves after a match. */
export function bindBattleResult(session: Session) {
  const app = byId('app'),
    panel = byId('battle-result'),
    content = byId('battle-result-content');
  const stars = bindResultStars();
  const mission = byId('mission-battle-actions'),
    classic = byId('end-restart');
  const restore = rememberPlaces([mission, classic]);
  const buttons = bindPrimaryButton();
  let observed: Game | null = null;
  forwardClick('end-home', 'menu-home');
  forwardClick('result-allies', 'reinforcements-toggle');
  /** The actions of the mode that was played move into the result; the others go home. */
  const gatherActions = (game: Game) => {
    if (game.mission) {
      restore(classic);
      if (mission.parentNode !== content) content.append(mission);
      buttons.promote(!byId('mission-next').hidden ? byId('mission-next') : byId('mission-again'));
      return;
    }
    restore(mission);
    buttons.restore();
    if (classic.parentNode !== content) content.append(classic);
    setDisplayText(
      byId('battle-result-summary'),
      `${game.kills} serpents repoussés · cristal ${Math.ceil(game.base)} %`,
    );
  };
  /** Once per finished battle: back to the top, focus on what comes next. */
  const present = (game: Game) => {
    panel.scrollTop = 0;
    const next = byId('mission-next');
    const target = !game.mission ? classic : !next.hidden ? next : byId('mission-again');
    requestAnimationFrame(() => {
      if (session.game === game && resultOnScreen(panel, app)) focusOutcome(panel, target);
    });
  };
  return () => {
    const game = session.game;
    const ended = session.screen === 'battle' && battleOver(game);
    panel.hidden = !ended;
    app.classList.toggle('showing-result', ended);
    if (!ended) {
      restore(mission);
      restore(classic);
      buttons.restore();
      observed = null;
      stars.forget();
      return;
    }
    showOutcomeTitle(game);
    stars.show(game);
    byId('end-home').hidden = !!game.mission;
    byId('battle-result-summary').hidden = !!game.mission;
    gatherActions(game);
    if (observed === game) return;
    observed = game;
    present(game);
  };
}

function showOutcomeTitle(game: Game) {
  setDisplayText(
    byId('battle-result-title'),
    game.status === 'won'
      ? game.mission?.caprice
        ? 'Caprice réussi !'
        : 'Bravo !'
      : defeatCopy(game).title,
  );
  // The caprice summary repeats this heading verbatim. Keep its sticker and
  // actions, and keep the original French announcement on defeat.
  byId('mission-result').hidden = game.status === 'won' && !!game.mission?.caprice;
}

/** The row of stars under the title, shown after a victory only. */
function bindResultStars() {
  const stars = make('p', { id: 'battle-result-stars' });
  stars.setAttribute('role', 'img');
  stars.hidden = true;
  byId('battle-result-title').after(stars);
  const motion = window.matchMedia('(prefers-reduced-motion:reduce)');
  let animated = '';
  /**
   * Same characters, one element each: earned stars land one after the other.
   * « Effets légers » and the system preference keep them still.
   */
  const animate = (row: string) => {
    const still = visualSettings.reduced(motion.matches);
    stars.replaceChildren(
      ...Array.from(row, (character, i) => {
        const star = make('span');
        star.textContent = character;
        if (!still && character === '★') {
          star.className = 'star-pop';
          star.style.animationDelay = `${0.3 + i * 0.3}s`;
        }
        return star;
      }),
    );
  };
  return {
    show(game: Game) {
      const earned = earnedStars(game);
      stars.hidden = !earned;
      if (!earned) return;
      const row =
        earned.maximum === 3
          ? '★'.repeat(earned.count) + '☆'.repeat(3 - earned.count)
          : `★ ${earned.count} / ${earned.maximum}`;
      setDisplayText(stars, row);
      if (earned.maximum === 3 && animated !== row) {
        animated = row;
        animate(row);
      }
      setDisplayAttribute(
        stars,
        'aria-label',
        `${earned.count} étoiles gagnées sur ${earned.maximum}`,
      );
    },
    /** The next result animates its stars again. */
    forget() {
      animated = '';
    },
  };
}

/** Remembers where each node lives in the page; the returned function puts one back. */
function rememberPlaces(nodes: HTMLElement[]) {
  const homes = nodes.map((node) => ({
    node,
    parent: node.parentNode!,
    next: node.nextSibling,
  }));
  return (node: HTMLElement) => {
    const home = homes.find((slot) => slot.node === node)!;
    if (node.parentNode !== home.parent) home.parent.insertBefore(node, home.next);
  };
}

/** After a mission, the button that continues comes first; elsewhere the page's order. */
function bindPrimaryButton() {
  const buttons = byId('mission-next').parentElement!;
  const pageOrder = Array.from(buttons.childNodes);
  let reordered = false;
  return {
    promote(primary: HTMLElement) {
      if (buttons.firstElementChild === primary) return;
      buttons.prepend(primary);
      reordered = true;
    },
    restore() {
      if (!reordered) return;
      buttons.replaceChildren(...pageOrder);
      reordered = false;
    },
  };
}

/** The result can take the focus: shown, in front, on a screen that displays the board. */
const resultOnScreen = (panel: HTMLElement, app: HTMLElement): boolean =>
  !panel.hidden &&
  !app.hidden &&
  !document.hidden &&
  !dialogOpen() &&
  panel.getClientRects().length > 0 &&
  !byId('orientation-notice').getClientRects().length;

function focusOutcome(panel: HTMLElement, target: HTMLElement) {
  const area = panel.getBoundingClientRect(),
    button = target.getBoundingClientRect();
  if (button.bottom <= area.bottom - 4) {
    target.focus({ preventScroll: true });
    return;
  }
  // A compact result can put Retry below the fold. Announce the outcome
  // first instead of scrolling its sole heading and stars out of view;
  // native Tab still reaches the album and every result action.
  const heading = byId('battle-result-title');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}
