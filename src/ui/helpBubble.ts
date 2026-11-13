import { setAttribute, setText } from '../i18n/dom.ts';
import { make } from './dom.ts';
import { HELP_CLOSE, HELP_TOPICS, type HelpTopicId } from './helpTopics.ts';
import './helpBubble.css';

let dialog: HTMLDialogElement | undefined;
let opener: HTMLElement | null = null;
let waiting = false;
let closed: () => void = () => {};

/**
 * Once the bubble is closed, the focus returns to the "?" that opened it and the screen below
 * is drawn again. Escape closes the window and then fires `close`; the button comes here at
 * once, and the event that follows it does not count a second time.
 */
function settle(bubble: HTMLDialogElement) {
  if (bubble.open || !waiting) return;
  waiting = false;
  const back = opener;
  opener = null;
  if (back?.isConnected) back.focus({ preventScroll: true });
  closed();
}

/**
 * The help bubble: a small window built here, so that the start page stays light. There is
 * only one; it opens over the window that is already open (the mission preparation, for
 * instance) without closing it, and it never touches the pause of the game.
 */
function helpBubble() {
  if (dialog) return dialog;
  const made = make('dialog', { id: 'help-bubble', className: 'help-bubble' });
  made.setAttribute('aria-labelledby', 'help-bubble-title');
  made.setAttribute('aria-describedby', 'help-bubble-text');
  const title = make('h2', { id: 'help-bubble-title' });
  const text = make('div', { id: 'help-bubble-text' });
  // Its `type` sits between the id and the class, as the page has always written this button.
  const close = make('button', { id: 'help-bubble-close' });
  close.type = 'button';
  close.className = 'primary';
  setText(close, HELP_CLOSE);
  close.onclick = () => {
    made.close();
    settle(made);
  };
  made.addEventListener('close', () => settle(made));
  made.append(title, text, close);
  document.body.append(made);
  dialog = made;
  return made;
}

/** Opens the bubble on a topic; when it closes, the focus returns to the "?" that was touched. */
function openHelp(topic: HelpTopicId, from: HTMLElement | null = null) {
  const panel = helpBubble();
  const help = HELP_TOPICS[topic];
  panel.dataset.help = topic;
  setText(panel.querySelector('#help-bubble-title')!, help.title);
  // Only the text container is emptied: the "turn your phone" notice may sit in this window.
  panel
    .querySelector('#help-bubble-text')!
    .replaceChildren(...help.text.map((paragraph) => make('p', { text: paragraph })));
  // A single bubble: already open, it changes topic and keeps its first "?".
  if (panel.open) return;
  opener = from;
  waiting = true;
  panel.showModal();
}

/** A small round "?" to touch: a 48 px target, with a name a screen reader can say. */
export function helpPoint(topic: HelpTopicId) {
  const button = make('button');
  button.type = 'button';
  button.className = 'help-point';
  button.dataset.help = topic;
  button.setAttribute('aria-haspopup', 'dialog');
  setAttribute(button, 'aria-label', HELP_TOPICS[topic].label);
  const mark = make('span');
  mark.setAttribute('aria-hidden', 'true');
  // A sign, not a word: it is written as it is, outside the translated copy.
  mark.textContent = '?';
  button.append(mark);
  button.onclick = () => openHelp(topic, button);
  return button;
}

/** Like the settings: when the bubble closes, the screen below is drawn again. */
export function bindHelpBubble(refresh: () => void) {
  closed = refresh;
}
