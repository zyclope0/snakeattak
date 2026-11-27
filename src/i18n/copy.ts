import { getCatalogue, getLanguage, onLanguageChange } from './language.ts';

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** `joins`: a template with no word of its own, two texts and a mark between (« {0} ! {1} »). */
type Pattern = { re: RegExp; prefix?: RegExp; ids: number[]; target: string; joins: boolean };
let source: Readonly<Record<string, string>> | undefined;
let exact = new Map<string, string>(),
  lower = new Map<string, string>();
let patterns: Pattern[] = [],
  phrases: [string, string][] = [];
const cache = new Map<string, string>();
const unknown = new Set<string>();
onLanguageChange(() => {
  cache.clear();
  unknown.clear();
});
function prepare() {
  const next = getCatalogue();
  if (next === source) return;
  source = next;
  exact = new Map();
  lower = new Map();
  patterns = [];
  phrases = [];
  for (const [raw, target] of Object.entries(next)) {
    const key = normalize(raw),
      tokens = [...key.matchAll(/\{(\d+)\}/g)],
      // No word of its own: a template kept only for a mark between texts, never a bare space.
      joins = !/[A-Za-zÀ-ÿ]{2}/.test(key.replace(/\{\d+\}/g, ''));
    if (!tokens.length) {
      exact.set(key, target);
      if (/^[A-ZÀ-ÝŒ]/.test(key))
        lower.set(key.toLocaleLowerCase('fr'), target.toLocaleLowerCase('en'));
      if (key.length > 10) phrases.push([key, target]);
    } else if (tokens.length <= 12 && (!joins || /[!?]/.test(key))) {
      const ids: number[] = [];
      let re = '^',
        at = 0;
      for (const match of tokens) {
        re += escape(key.slice(at, match.index)) + '(.*?)';
        ids.push(+match[1]);
        at = match.index! + match[0].length;
      }
      re += escape(key.slice(at)) + '$';
      patterns.push({
        re: new RegExp(re),
        prefix: !joins && /[.!?]$/.test(key) ? new RegExp(re.slice(0, -1) + '(?=\\s)') : undefined,
        ids,
        target,
        joins,
      });
    }
  }
  // Prefer the most specific canonical shape; no free-standing word replacements.
  patterns.sort((a, b) => b.re.source.length - a.re.source.length);
  phrases.sort((a, b) => b[0].length - a[0].length);
}
/** A text the dictionary holds whole, as `render` looks it up first. */
function known(value: string) {
  const key = normalize(value);
  return exact.has(key) || lower.has(key);
}
function render(value: string, depth: number): string {
  const key = normalize(value);
  const direct = exact.get(key) ?? lower.get(key);
  if (direct !== undefined) return direct;
  if (/^-?\d+(?:[\u202f\u00a0 ]\d{3})*(?:,\d+)?$/.test(key))
    return Number(key.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.')).toLocaleString('en-US', {
      maximumFractionDigits: 12,
    });
  if (depth < 6) {
    const format = (pattern: Pattern, match: RegExpExecArray) => {
      const values = new Map(pattern.ids.map((id, i) => [id, match[i + 1]]));
      return pattern.target.replace(/\{(\d+)\}/g, (_, id) =>
        inner(values.get(+id) ?? '', depth + 1),
      );
    };
    for (const pattern of patterns) {
      const match = pattern.re.exec(key);
      if (!match) continue;
      // A join is trusted between known texts only: it never cuts a sentence it does not know.
      if (pattern.joins && !match.slice(1).every(known)) continue;
      return format(pattern, match);
    }
    // A mark before a text, or the stars of a gift's level (« ★★ Tes alliés… »): kept as is.
    const symbol = /^(🔒|✓|➜|○|★+)\s+(.+)$/.exec(key);
    if (symbol) return symbol[1] + ' ' + inner(symbol[2], depth + 1);
    if (key.endsWith(' KO')) return inner(key.slice(0, -3), depth + 1) + ' KO';
    for (const pattern of patterns) {
      const match = pattern.prefix?.exec(key);
      if (match)
        return (
          format(pattern, match) + ' ' + inner(key.slice(match[0].length).trimStart(), depth + 1)
        );
    }
    for (const [phrase, target] of phrases) {
      if (/[.!?]$/.test(phrase) && key.startsWith(phrase + ' '))
        return target + ' ' + inner(key.slice(phrase.length + 1), depth + 1);
      if (!/[.!?]$/.test(phrase) && key.startsWith(phrase + '. '))
        return target + '. ' + inner(key.slice(phrase.length + 2), depth + 1);
    }
    const sentences = key.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý+0-9])/u);
    if (sentences.length > 1) return sentences.map((part) => inner(part, depth + 1)).join(' ');
    if (/[.!?]$/.test(key)) return inner(key.slice(0, -1), depth + 1) + key.at(-1);
    for (const separator of [' · ', ' / ', ' • ', ' × ', ', ', ' : ', ' et ', ' ! ']) {
      if (key.includes(separator))
        return key
          .split(separator)
          .map((part) => inner(part, depth + 1))
          .join(
            separator === ' ! '
              ? '! '
              : separator === ' et '
                ? ' and '
                : separator === ' : '
                  ? ': '
                  : separator,
          );
    }
  }
  if (
    /[éèêëàâùûçœ]|\b(?:et le|le mamba noir retire|ton|tes|alliés|vague|pièces|soins|cristal|départ|sauvegarde)\b/i.test(
      key,
    )
  )
    unknown.add(key);
  return key;
}
function inner(value: string, depth: number) {
  if (!value.trim() || value.length > 2048) return value;
  const start = value.match(/^\s*/)?.[0] ?? '',
    end = value.match(/\s*$/)?.[0] ?? '';
  return start + render(value, depth) + end;
}
/** Canonical values stay untouched. Only explicit DOM/canvas sinks call this. */
export function copy(value: string): string {
  if (getLanguage() === 'fr' || !value || value.length > 2048) return value;
  prepare();
  const cached = cache.get(value);
  if (cached !== undefined) return cached;
  const translated = inner(value, 0);
  if (cache.size >= 1024) cache.clear();
  cache.set(value, translated);
  return translated;
}
export function untranslatedCopy() {
  return [...unknown].sort();
}
