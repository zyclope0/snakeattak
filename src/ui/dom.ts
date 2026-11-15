import { setText } from '../i18n/dom.ts';
import * as TEXT from '../texts/fr/battleScreens.ts';

/**
 * The element of the page that has this id. The page is assembled from `src/html/`; the build
 * does not check ids, a test does (`tests/dom-ids.test.ts`): it reads every id looked up in
 * `src/` and refuses one that is neither in the assembled page nor given by the code to an
 * element it builds. One definition for every screen.
 */
export const byId = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

/** A touch screen held upright: the board is hidden and the game asks to turn the device. */
export const portraitPhone = (): MediaQueryList => matchMedia(TEXT.pointerCoarseAndOrientation);

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

/** True while a window is open over the page: the board and its shortcuts wait behind it. */
export const dialogOpen = (): boolean => !!document.querySelector('dialog[open]');

/** A second button for an action that already has one: it presses the first. */
export function forwardClick(from: string, to: string) {
  byId(from).onclick = () => byId(to).click();
}

/** Tells assistive technology whether a toggle button is on. */
export const setPressed = (button: Element, on: boolean) =>
  button.setAttribute('aria-pressed', String(on));

/** A picture that only decorates: screen readers skip it. */
export function decoration<K extends keyof HTMLElementTagNameMap>(tag: K, className: string) {
  const node = make(tag, { className });
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/** One more choice in a list. The value comes first: an option without one takes its text. */
export function addOption(select: HTMLSelectElement, value: string, label: string) {
  const option = make('option');
  option.value = value;
  setText(option, label);
  select.append(option);
}

/** Writes a text that is refreshed at every frame only when it changed. */
export function refreshText(node: HTMLElement, value: string) {
  if (node.textContent !== value) setText(node, value);
}
