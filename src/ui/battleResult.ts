import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import './battleResult.css';
import { defeatCopy, earnedStars, endlessCopy, victoryCopy } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';
import { visualSettings } from '../render/visualSettings.ts';
import { byId, dialogOpen, forwardClick, make } from './dom.ts';
import { starRow } from './gameParts.ts';
import { battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/battleScreens.ts';
import { newRecords } from '../endlessRecords.ts';
import * as PAGE from '../texts/fr/page.ts';
import { fill } from '../texts/fill.ts';

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
    // A voyage stage brings its own way on (ui/voyage): neither a mission's nor the classic's.
    if (game.stage) {
      restore(mission);
      restore(classic);
      buttons.restore();
      return;
    }
    if (game.mission) {
      restore(classic);
      if (mission.parentNode !== content) content.append(mission);
      buttons.promote(missionFollowUp());
      return;
    }
    restore(mission);
    buttons.restore();
    if (classic.parentNode !== content) content.append(classic);
    // The same button plays the same kind of adventure again: it says which.
    setDisplayText(classic, game.endless ? PAGE.laventureSansFin : PAGE.rejouerUneAventure);
    const summary = fill(TEXT.nSerpentsRepoussesCristalN, game.kills, Math.ceil(game.base));
    // An endless adventure that beat the player's own best says so; nobody else's counts.
    setDisplayText(
      byId('battle-result-summary'),
      game.endless && newRecords.has(game) ? `${TEXT.nouveauRecord} ${summary}` : summary,
    );
  };
  /** Once per finished battle: back to the top, focus on what comes next. */
  const present = (game: Game) => {
    panel.scrollTop = 0;
    const target = followUp(game, classic);
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

/** A stage won says so even under a caprice; a mission keeps « Bravo ! » or its caprice. */
function victoryTitle(game: Game) {
  if (game.stage) return victoryCopy(game).title;
  return game.mission?.caprice ? TEXT.capriceReussi : TEXT.bravo;
}

function showOutcomeTitle(game: Game) {
  setDisplayText(
    byId('battle-result-title'),
    game.endless
      ? endlessCopy(game).title
      : game.status === 'won'
        ? victoryTitle(game)
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
        earned.maximum === 3 ? starRow(earned.count) : `★ ${earned.count} / ${earned.maximum}`;
      setDisplayText(stars, row);
      if (earned.maximum === 3 && animated !== row) {
        animated = row;
        animate(row);
      }
      setDisplayAttribute(
        stars,
        'aria-label',
        fill(TEXT.nEtoilesGagneesSurN, earned.count, earned.maximum),
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

/**
 * What comes next after a mission: the following one, else a caprice to try, else the same
 * departure again. The caprice button only exists once the missions are bound.
 */
function missionFollowUp(): HTMLElement {
  const shown = ['mission-next', 'mission-caprice-replay']
    .map((id) => document.getElementById(id))
    .find((button) => button && !button.hidden);
  return shown ?? byId('mission-again');
}
/**
 * The button that takes the focus when a battle ends. A voyage stage has one way on, which
 * the voyage adds to the result (ui/voyage); it is asked for only after a stage, so that the
 * result of a mission never looks at it.
 */
function followUp(game: Game, classic: HTMLElement): HTMLElement {
  if (game.stage) return document.getElementById('voyage-continue') ?? classic;
  return game.mission ? missionFollowUp() : classic;
}

/** After a mission, the button that continues comes first; elsewhere the page's order. */
function bindPrimaryButton() {
  const buttons = byId('mission-next').parentElement!;
  // Read at the first move, not at binding, and again if the row has grown since: the
  // missions add their own buttons to this row, and none may be left out of it.
  let pageOrder: ChildNode[] | null = null;
  return {
    promote(primary: HTMLElement) {
      // A button that comes with its sentence moves with it, as one block of the row.
      const block = Array.from(buttons.children).find((child) => child.contains(primary))!;
      if (buttons.firstElementChild === block) return;
      if (pageOrder?.length !== buttons.childNodes.length)
        pageOrder = Array.from(buttons.childNodes);
      buttons.replaceChildren(block, ...pageOrder.filter((node) => node !== block));
    },
    restore() {
      if (!pageOrder) return;
      buttons.replaceChildren(...pageOrder);
      pageOrder = null;
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
