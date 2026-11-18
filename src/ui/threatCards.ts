import { setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import { kinds, type Kind } from '../data.ts';
import { enemyPortraitStyle, portraitStyle } from '../art.ts';
import { make } from './dom.ts';
import { svgNode } from './svg.ts';
import { abilityOf, THREAT_DETAILS, type ThreatKind } from './threatPreview.ts';
import type { BalanceRevision } from '../balanceRevision.ts';
import * as TEXT from '../texts/fr/advice.ts';

/** The line drawing of an ability, by the `symbol` of a threat. */
const paths: Record<string, string> = {
  path: 'M3 18h18M5 14l5-5 4 4 5-8',
  fast: 'm9 3-5 9h8l-3 9 11-13h-8l3-5',
  shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z',
  gear: 'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  confusion: 'M8 7a4 4 0 0 1 8 0c0 3-4 3-4 6m0 4v1',
  shot: 'M3 12h15m-5-5 5 5-5 5M3 6h5M3 18h5',
  burst: 'm12 2 2 6 6-3-3 6 5 2-6 2 1 7-5-5-5 5 1-7-6-2 5-2-3-6 6 3Z',
  fangs: 'M3 5c3 3 15 3 18 0M8 7l1.5 12L11 7m2 0 1.5 12L16 7',
  wing: 'M12 15C10 5 4 3 2 3c0 7 4 13 10 13C18 16 22 10 22 3c-2 0-8 2-10 12ZM7 9l3 5m7-5-3 5',
  heal: 'm8 3-5 5 13 13 5-5ZM8 9l7 7m-4-5 2 2',
  crown: 'm3 5 5 5 4-7 4 7 5-5-2 14H5ZM5 16h14',
};
function capabilityIcon(symbol: string) {
  return svgNode(
    'svg',
    { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    svgNode('path', { d: paths[symbol] ?? paths.path }),
  );
}
/** A portrait drawn by its inline style; decorative, the text beside it says who it is. */
function portrait(className: string, style: string) {
  const node = make('span', { className });
  node.style.cssText = style;
  node.setAttribute('aria-hidden', 'true');
  return node;
}
/** A snake to expect: its portrait with the badge of its ability, its name, what it does. */
function threatCard(kind: ThreatKind, revision?: BalanceRevision) {
  const detail = THREAT_DETAILS[kind];
  const card = make('div', { className: 'threat-card' });
  card.dataset.threat = kind;
  const picture = portrait('enemy-portrait', enemyPortraitStyle(kind));
  picture.append(make('i', {}, capabilityIcon(detail.symbol)));
  const copy = make(
    'div',
    {},
    make('strong', { text: detail.name }),
    make('small', { text: abilityOf(kind, revision) }),
  );
  card.append(picture, copy);
  return card;
}
/** `revision`: the game the snakes are met in; the current one for the index of the snakes. */
export function renderThreatCards(
  host: HTMLElement,
  types: readonly ThreatKind[],
  revision?: BalanceRevision,
) {
  host.replaceChildren(...types.map((kind) => threatCard(kind, revision)));
}
export function renderThreatAdvice(
  host: HTMLElement,
  advice: {
    kind: Kind;
    text: string;
  },
) {
  host.dataset.ally = advice.kind;
  setDisplayAttribute(host, 'aria-label', TEXT.uneIdeeAvec + kinds[advice.kind].name);
  host.replaceChildren(
    portrait('portrait', portraitStyle(advice.kind)),
    make('p', { text: advice.text }),
  );
}
