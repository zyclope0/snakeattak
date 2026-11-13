import {
  createTextNode as copyTextNode,
  setText as setDisplayText,
  setAttribute as setDisplayAttribute,
  setTitle as setDisplayTitle,
} from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import { LANE_NAMES } from '../ai.ts';
import { byId } from './dom.ts';
/** Presentation observes the engine's mask; it neither advances nor rerolls it. */
export function bindTutorialLanes() {
  const panel = byId('tutorial-lanes');
  const accessible = document.createElement('span');
  accessible.className = 'sr-only';
  const chips = LANE_NAMES.map((name) => {
    const chip = document.createElement('span'),
      icon = document.createElement('b');
    chip.className = 'tutorial-lane';
    chip.setAttribute('aria-hidden', 'true');
    chip.append(icon, copyTextNode(name));
    return { chip, icon };
  });
  panel.append(accessible, ...chips.map((c) => c.chip));
  let previous = '';
  return (game: Game) => {
    panel.hidden = game.mission?.rules !== 2 || game.status === 'won' || game.status === 'lost';
    if (panel.hidden) return;
    const wave = Math.min(game.totalWaves, game.wave + (game.status === 'preparing' ? 1 : 0));
    const lanes = game.enemyLanes,
      key = `${wave}:${lanes.join(',')}`;
    if (key === previous) return;
    previous = key;
    const label = `Vague ${wave} : ${lanes.map((l) => LANE_NAMES[l]).join(' et ')}. ${lanes.length < 3 ? 'Les autres voies restent paisibles.' : 'Les trois voies sont attaquées.'}`;
    setDisplayText(accessible, label);
    setDisplayAttribute(panel, 'aria-label', label);
    for (const [lane, { chip, icon }] of chips.entries()) {
      const active = lanes.includes(lane);
      chip.dataset.active = String(active);
      setDisplayTitle(
        chip,
        `${LANE_NAMES[lane]} : ${active ? 'attaquée' : 'paisible pour cette vague'}`,
      );
      setDisplayText(icon, active ? '▲' : '—');
    }
  };
}
