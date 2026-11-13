import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { enemyPortraitStyle, portraitStyle } from '../art.ts';
import { THREAT_DETAILS } from './threatPreview.ts';
import type { ThreatKind } from './threatPreview.ts';
const paths: Record<string, string> = {
  path: 'M3 18h18M5 14l5-5 4 4 5-8',
  fast: 'm9 3-5 9h8l-3 9 11-13h-8l3-5',
  shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z',
  gear: 'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  confusion: 'M8 7a4 4 0 0 1 8 0c0 3-4 3-4 6m0 4v1',
  shot: 'M3 12h15m-5-5 5 5-5 5M3 6h5M3 18h5',
  burst: 'm12 2 2 6 6-3-3 6 5 2-6 2 1 7-5-5-5 5 1-7-6-2 5-2-3-6 6 3Z',
  wing: 'M12 15C10 5 4 3 2 3c0 7 4 13 10 13C18 16 22 10 22 3c-2 0-8 2-10 12ZM7 9l3 5m7-5-3 5',
  heal: 'm8 3-5 5 13 13 5-5ZM8 9l7 7m-4-5 2 2',
  crown: 'm3 5 5 5 4-7 4 7 5-5-2 14H5ZM5 16h14',
};
function capabilityIcon(symbol: string) {
  const ns = 'http://www.w3.org/2000/svg',
    svg = document.createElementNS(ns, 'svg'),
    path = document.createElementNS(ns, 'path');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  path.setAttribute('d', paths[symbol] ?? paths.path);
  svg.append(path);
  return svg;
}
export function renderThreatCards(host: HTMLElement, types: readonly ThreatKind[]) {
  host.replaceChildren();
  for (const kind of types) {
    const detail = THREAT_DETAILS[kind],
      card = document.createElement('div'),
      portrait = document.createElement('span'),
      badge = document.createElement('i'),
      copy = document.createElement('div'),
      name = document.createElement('strong'),
      ability = document.createElement('small');
    card.className = 'threat-card';
    card.dataset.threat = kind;
    portrait.className = 'enemy-portrait';
    portrait.style.cssText = enemyPortraitStyle(kind);
    portrait.setAttribute('aria-hidden', 'true');
    badge.append(capabilityIcon(detail.symbol));
    portrait.append(badge);
    setDisplayText(name, detail.name);
    setDisplayText(ability, detail.ability);
    copy.append(name, ability);
    card.append(portrait, copy);
    host.append(card);
  }
}
export function renderThreatAdvice(
  host: HTMLElement,
  advice: {
    kind: Kind;
    text: string;
  },
) {
  const portrait = document.createElement('span'),
    copy = document.createElement('p');
  portrait.className = 'portrait';
  portrait.style.cssText = portraitStyle(advice.kind);
  portrait.setAttribute('aria-hidden', 'true');
  host.dataset.ally = advice.kind;
  setDisplayAttribute(host, 'aria-label', 'Une idée avec ' + kinds[advice.kind].name);
  setDisplayText(copy, advice.text);
  host.replaceChildren(portrait, copy);
}
