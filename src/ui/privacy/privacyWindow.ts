import './privacy.css';
import { getLanguage, onLanguageChange } from '../../i18n/language.ts';
import type { Language } from '../../i18n/language.ts';
import { PRIVACY_POLICY } from '../../i18n/privacyPolicy.ts';
import type { PolicyPart } from '../../i18n/privacyPolicy.ts';
import { PUBLIC_PRIVACY_URL } from '../../site.ts';
import { make } from '../dom.ts';

/**
 * The words of the policy are written as they are: each language has its own approved text,
 * which the translator of the interface must not touch. These nodes are plain nodes inside
 * an element marked `data-copy-raw`.
 */
function plain<K extends keyof HTMLElementTagNameMap>(tag: K, words: string, className = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = words;
  return node;
}

/** A link that leaves the game, opened only by the reader's own touch, in the browser. */
function outside(words: string, address: string) {
  const link = plain('a', words);
  link.href = address;
  link.target = '_blank';
  link.relList.add('noopener', 'noreferrer');
  return link;
}

function run(part: PolicyPart): Node {
  if (typeof part === 'string') return document.createTextNode(part);
  return 'b' in part ? plain('strong', part.b) : outside(part.a, part.href);
}
function paragraph(parts: PolicyPart[]) {
  const node = document.createElement('p');
  node.append(...parts.map(run));
  return node;
}

/** The whole policy in one language, then the way to the public page. */
function policy(language: Language): HTMLElement {
  const words = PRIVACY_POLICY[language];
  const article = document.createElement('article');
  article.lang = language;
  article.dataset.copyRaw = '';
  const publicPage = document.createElement('p');
  publicPage.className = 'privacy-public';
  publicPage.append(outside(words.publicLink, PUBLIC_PRIVACY_URL));
  article.append(
    plain('h3', words.title),
    paragraph(words.scope),
    plain('p', words.updated, 'privacy-updated'),
    ...words.sections.flatMap((section) => [
      plain('h4', section.heading),
      ...section.paragraphs.map(paragraph),
    ]),
    publicPage,
  );
  return article;
}

/**
 * The window of the policy, built on first use. Its heading and its button stay in place
 * while the words scroll under them; it follows the language of the game, even changed
 * while it is open. Returns the function that opens it at the top of the text.
 */
export function privacyWindow(): () => void {
  const heading = make('h2', { id: 'privacy-title', text: 'Confidentialité' });
  const close = make('button', { id: 'privacy-close', className: 'secondary', text: 'Fermer' });
  close.type = 'button';
  const body = make('div', { id: 'privacy-body' });
  // A reader with a keyboard scrolls the words with the arrow keys.
  body.tabIndex = 0;
  body.setAttribute('role', 'region');
  body.setAttribute('aria-labelledby', heading.id);
  const dialog = make('dialog', { id: 'privacy-dialog' }, make('header', {}, heading, close), body);
  dialog.setAttribute('aria-labelledby', heading.id);
  document.body.append(dialog);
  close.onclick = () => dialog.close();
  const write = () => body.replaceChildren(policy(getLanguage()));
  onLanguageChange(write);
  return () => {
    write();
    dialog.showModal();
    body.scrollTop = 0;
  };
}
