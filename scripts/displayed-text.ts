// What counts as a displayed text, for the inventory of texts (extract-locale-035.mjs) and for
// the test that keeps texts out of the code (tests/texts-catalogue.test.ts).
import ts from 'typescript';

const entities: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};
function decode(s: string) {
  return s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (_, v: string) =>
    v[0] === '#'
      ? String.fromCodePoint(v[1]?.toLowerCase() === 'x' ? parseInt(v.slice(2), 16) : +v.slice(1))
      : (entities[v] ?? `&${v};`),
  );
}
/** Key names, browser words and other strings that look like words but are never shown. */
const NOT_SHOWN = new Set([
  'Escape',
  'Enter',
  'Space',
  'Tab',
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  'Battle',
  'ResizeObserver',
  'PerformanceObserver',
  'Unknown',
  'AbortError',
]);
/** Words a player may read: letters, with a space, an accent or a capital to start. */
function human(s: string) {
  const fixed = s.replace(/\{\d+\}/g, '');
  return (
    (/[A-Za-zÀ-ÿŒœ]{3}/.test(fixed) || fixed === 'et le') &&
    (/[\sÀ-ÿŒœ]/.test(fixed) || /^[A-ZÀ-ÝŒ]/.test(fixed)) &&
    !/^https?:|^\.[^\s]|^#|^--|^[\w.-]+\.(?:ts|js|json|webp|png|woff2|html|txt)$/.test(s) &&
    !/[{}][^\d]|\b(?:display|font-size|background|position|padding):|(?:^|\s)(?:const|return|function)\s|\b(?:aria-|data-)[\w-]+=/i.test(
      fixed,
    ) &&
    !NOT_SHOWN.has(s)
  );
}

/**
 * The displayed texts inside one string: the string itself, or, when it is markup, each run
 * of words between its tags and each of its spoken attributes. Single-spaced, as displayed.
 */
export function displayedTexts(raw: string): string[] {
  const texts: string[] = [];
  const add = (piece: string) => {
    const text = decode(piece).trim().replace(/\s+/g, ' ');
    if (human(text)) texts.push(text);
  };
  if (!/<[a-z][\s>]/i.test(raw) && !/<[a-z][\w-]*\b[^>]*>/i.test(raw)) add(raw);
  else {
    const clean = raw.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    for (const token of clean.match(/<[^>]+>|[^<]+/g) ?? []) {
      if (token.startsWith('<')) {
        for (const match of token.matchAll(
          /\b(?:aria-label|title|alt|placeholder)\s*=\s*["']([^"']*)["']/g,
        ))
          add(match[1]);
      } else add(token);
    }
  }
  return texts;
}

/** Every displayed text written as a literal in a TypeScript source: `{ text, line }`. */
export function literalTexts(file: string, source: string): { text: string; line: number }[] {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const found: { text: string; line: number }[] = [];
  const visit = (node: ts.Node) => {
    let raw: string | null = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) raw = node.text;
    else if (ts.isTemplateExpression(node)) {
      raw = node.head.text;
      node.templateSpans.forEach((span, i) => {
        raw += `{${i}}${span.literal.text}`;
      });
    }
    if (raw !== null) {
      const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
      for (const text of displayedTexts(raw)) found.push({ text, line });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return found;
}
