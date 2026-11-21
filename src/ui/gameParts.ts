import { portraitStyle } from '../art.ts';
import type { Kind } from '../data.ts';
import { make } from './dom.ts';
import * as TEXT from '../texts/fr/guide.ts';
import { STARS_MAX } from '../gameConstants.ts';

/** Stars won out of three, as the cards show them: ★★☆. */
export const starRow = (count: number): string => '★'.repeat(count) + '☆'.repeat(STARS_MAX - count);

/** The portrait of an ally: its cell of the sheet, in a `<span class="portrait">`. */
export function portrait(kind: Kind) {
  const node = make('span', { className: 'portrait' });
  node.style.cssText = portraitStyle(kind);
  return node;
}

/**
 * « Règles d’origine », placed after `anchor`: the mark of a departure that keeps the rules
 * it was created with. Whoever shows the departure hides the mark under the current rules.
 */
export function originalRulesLabel(id: string, anchor: HTMLElement) {
  const label = make('small', { id, text: TEXT.reglesDOrigine });
  anchor.after(label);
  return label;
}
