import { setText } from '../i18n/dom.ts';
import { byId, make, narrowScreen } from './dom.ts';

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

/** Gives the keyboard back to the board, without moving the page. */
export const focusBoard = () => byId('game').focus({ preventScroll: true });

/** On a narrow screen the board may be out of view: bring it back for a placement. */
export function revealBoard() {
  if (narrowScreen()) byId('game').scrollIntoView({ block: 'center' });
}
