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
  // Exact values, each with what it is. A new one is added here, not as a broader rule.
  'NFD', // the Unicode form given to `String.normalize`
  'Fredoka', // the font family of the titles (src/render/fonts.ts)
  'Nunito Sans', // the font family of the texts (src/render/fonts.ts)
  'Filesystem', // the name the Android side gives a Capacitor plugin (src/ui/download.ts)
  'App', // the same, for the plugin that hands « retour » over (src/ui/backButton.ts)
  'Share', // the name the Android side gives a Capacitor plugin (src/ui/download.ts)
]);

const numbers = String.raw`\(\s*-?[\d.]+(?:[\s,]+-?[\d.]+)*\s*\)`;
const transform = `(?:translate|scale|rotate|skewX|skewY|matrix)${numbers}`;
const feature = String.raw`\(\s*[a-z-]+(?:\s*:\s*[\w.%/-]+)?\s*\)`;
const cssCall = String.raw`(?:(?:repeating-)?(?:linear|radial|conic)-gradient|rgba?|hsla?|var|calc)\([\w\s#%.,+*/-]*(?:\([\w\s#%.,+*/-]*\)[\w\s#%.,+*/-]*)*\)`;
const selector = String.raw`(?:[a-z][a-z0-9-]*)?(?:[.#][\w-]+|\[[a-z-]+(?:[~|^$*]?=[^\]\s]+)?\])*`;
/**
 * Values written for the browser, in its own grammar: they hold words and spaces and are
 * never read by a player. Each rule takes the whole string and nothing looser.
 */
const BROWSER_VALUES: [shape: RegExp, mark: RegExp][] = [
  // A CSS value made of function calls only: `linear-gradient(135deg, #486d58, #e6dcad)`.
  [new RegExp(`^${cssCall}(?:[\\s,]+${cssCall})*$`), /\(/],
  // A media query, one `(feature: value)` at least: `(pointer: coarse) and (hover: none)`.
  [
    new RegExp(
      `^(?:(?:not|only)\\s+)?(?:(?:all|screen|print)\\s+and\\s+)?${feature}(?:\\s*(?:and|or|,)\\s*(?:not\\s+)?${feature})*$`,
    ),
    /\(\s*[a-z-]+\s*:/,
  ],
  // An SVG transform list, numbers only: `translate(512 0) scale(-1 1)`.
  [new RegExp(`^${transform}(?:[\\s,]+${transform})*$`), /\(/],
  // The keywords of the SVG `preserveAspectRatio`: `xMidYMid slice`.
  [/^x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?$/, /^x/],
  // A list of CSS selectors, one an attribute at least: `button, input, [contenteditable]`.
  [new RegExp(`^${selector}(?:\\s*,\\s*${selector})+$`), /\[[a-z-]+(?:[~|^$*]?=[^\]\s]+)?\]/],
];
function browserValue(s: string) {
  // A computed part of such a value is a number: `translate(${x} 0)`.
  const value = s.replace(/\{\d+\}/g, '0');
  return BROWSER_VALUES.some(([shape, mark]) => shape.test(value) && mark.test(value));
}
/** Words a player may read: letters, with a space, an accent or a capital to start. */
function human(s: string) {
  const fixed = s.replace(/\{\d+\}/g, '');
  return (
    (/[A-Za-zÀ-ÿŒœ]{3}/.test(fixed) || fixed === 'et') &&
    (/[\sÀ-ÿŒœ]/.test(fixed) || /^[A-ZÀ-ÝŒ]/.test(fixed)) &&
    !/^https?:|^\.[^\s]|^#|^--|^[\w.-]+\.(?:ts|js|json|webp|png|woff2|html|txt)$/.test(s) &&
    !/[{}][^\d]|\b(?:display|font-size|background|position|padding):|(?:^|\s)(?:const|return|function)\s|\b(?:aria-|data-)[\w-]+=/i.test(
      fixed,
    ) &&
    !NOT_SHOWN.has(s) &&
    !browserValue(s)
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

/**
 * Every displayed text written as a literal in a TypeScript source: `{ text, line }`. `known`,
 * when given, holds the French texts of the catalogue, single-spaced: a literal that is one of
 * them is a displayed text too, even a word in small letters that looks like a name of the code
 * (« offert », « IA : {0} »). A text with no letter (« {0} {1} ») only joins values.
 */
export function literalTexts(
  file: string,
  source: string,
  known?: ReadonlySet<string>,
): { text: string; line: number }[] {
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
      const texts = displayedTexts(raw);
      const words = raw.trim().replace(/\s+/g, ' ');
      const lettered = /[A-Za-zÀ-ÿŒœ]/.test(words.replace(/\{\d+\}/g, ''));
      if (known?.has(words) && lettered && !texts.includes(words)) texts.push(words);
      for (const text of texts) found.push({ text, line });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return found;
}
