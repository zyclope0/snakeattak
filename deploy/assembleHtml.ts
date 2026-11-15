import { readFileSync } from 'node:fs';
import * as PAGE from '../src/texts/fr/page.ts';

const include = /^[ \t]*<!-- include: (src\/html\/[\w-]+\.html) -->[ \t]*$/gm;
const named = /\{\{(\w+)\}\}/g;

const escape = (words: string) =>
  words.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Writes the texts of the page in place of their names. The templates of `index.html` and
 * `src/html/` hold no words: `{{allerAuPlateau}}` names a text of `src/texts/fr/page.ts`.
 * The page the browser receives is in French, as before; a name without a text stops the
 * build rather than showing braces to a child.
 */
export function fillTexts(html: string, texts: Readonly<Record<string, string>> = PAGE): string {
  return html.replace(named, (_, name: string) => {
    const words = texts[name];
    if (words === undefined) throw new Error(`No text named « ${name} » in src/texts/fr/page.ts`);
    return escape(words);
  });
}

/**
 * Replace each `<!-- include: src/html/name.html -->` line of index.html with that file, then
 * write the texts of the page. The page shell stays one document for the browser; only the
 * editable source is split. Paths are limited to src/html so an include can never read
 * outside the project.
 */
export function assembleHtml(
  html: string,
  read: (path: string) => string = (path) => readFileSync(path, 'utf8'),
): string {
  return fillTexts(html.replace(include, (_, path: string) => read(path).replace(/\n$/, '')));
}

/** The complete source page, as tools that inspect the HTML need it. */
export function readIndexHtml(): string {
  return assembleHtml(readFileSync('index.html', 'utf8'));
}
