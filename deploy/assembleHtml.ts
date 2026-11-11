import { readFileSync } from 'node:fs';

const include = /^[ \t]*<!-- include: (src\/html\/[\w-]+\.html) -->[ \t]*$/gm;

/**
 * Replace each `<!-- include: src/html/name.html -->` line of index.html with that file.
 * The page shell stays one document for the browser; only the editable source is split.
 * Paths are limited to src/html so an include can never read outside the project.
 */
export function assembleHtml(
  html: string,
  read: (path: string) => string = (path) => readFileSync(path, 'utf8'),
): string {
  return html.replace(include, (_, path: string) => read(path).replace(/\n$/, ''));
}

/** The complete source page, as tools that inspect the HTML need it. */
export function readIndexHtml(): string {
  return assembleHtml(readFileSync('index.html', 'utf8'));
}
