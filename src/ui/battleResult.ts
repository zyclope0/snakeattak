import './battleResult.css';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';

/** Reuse the existing actions: only their presentation moves after a match. */
export function bindBattleResult(session: Session) {
  const el = (id: string) => document.getElementById(id)!;
  const app = el('app'),
    panel = el('battle-result'),
    content = el('battle-result-content');
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
  let observed: Game | null = null;
  el('end-home').onclick = () => el('menu-home').click();
  return () => {
    const g = session.game;
    const ended = session.screen === 'battle' && (g.status === 'won' || g.status === 'lost');
    panel.hidden = !ended;
    app.classList.toggle('showing-result', ended);
    if (!ended) {
      restore(mission);
      restore(classic);
      observed = null;
      return;
    }
    el('battle-result-title').textContent = g.status === 'won' ? 'Bravo !' : 'On réessaie ?';
    el('end-home').hidden = !!g.mission;
    el('battle-result-summary').hidden = !!g.mission;
    if (g.mission) {
      restore(classic);
      if (mission.parentNode !== content) content.append(mission);
    } else {
      restore(mission);
      if (classic.parentNode !== content) content.append(classic);
      el('battle-result-summary').textContent =
        `${g.kills} serpents repoussés · cristal ${Math.ceil(g.base)} %`;
    }
    if (observed !== g) {
      observed = g;
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
          !el('orientation-notice').getClientRects().length
        )
          target.focus({ preventScroll: true });
      });
    }
  };
}
