import { setText } from '../i18n/dom.ts';

/**
 * The element of the page that has this id. The page is assembled from `src/html/` and the
 * build checks it: an id written here is there. One definition for every screen.
 */
export const byId = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

/** A touch screen held upright: the board is hidden and the game asks to turn the device. */
export const portraitPhone = (): MediaQueryList =>
  matchMedia('(pointer: coarse) and (orientation: portrait)');

/** The narrow layout, where the camp panel sits under the board. */
export const narrowScreen = (): boolean => matchMedia('(max-width:800px)').matches;

type Features = {
  id?: string;
  className?: string;
  /** Displayed text, in the player's language (`setText`). */
  text?: string;
};

/**
 * A new element with what most of them need. Nothing else is set: a button keeps the
 * browser's default type, so a form inside a window still closes it as before.
 */
export function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  { id, className, text }: Features = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (id) node.id = id;
  if (className) node.className = className;
  if (text !== undefined) setText(node, text);
  node.append(...children);
  return node;
}
