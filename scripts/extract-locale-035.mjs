import ts from 'typescript';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';

const records = new Map();
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (_, v) =>
    v[0] === '#'
      ? String.fromCodePoint(v[1]?.toLowerCase() === 'x' ? parseInt(v.slice(2), 16) : +v.slice(1))
      : (entities[v] ?? `&${v};`),
  );
}
function human(s) {
  const fixed = s.replace(/\{\d+\}/g, '');
  return (
    (/[A-Za-zÀ-ÿŒœ]{3}/.test(fixed) || fixed === 'et le') &&
    (/[\sÀ-ÿŒœ]/.test(fixed) || /^[A-ZÀ-ÝŒ]/.test(fixed)) &&
    !/^https?:|^\.[^\s]|^#|^--|^[\w.-]+\.(?:ts|js|json|webp|png|woff2|html|txt)$/.test(s) &&
    !/[{}][^\d]|\b(?:display|font-size|background|position|padding):|(?:^|\s)(?:const|return|function)\s|\b(?:aria-|data-)[\w-]+=/i.test(
      fixed,
    ) &&
    ![
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
    ].includes(s)
  );
}
function add(raw, file, line) {
  const text = decode(raw).trim().replace(/\s+/g, ' ');
  if (!human(text)) return;
  const group =
    file === 'index.html' || file.includes('/ui/')
      ? 'ui'
      : file.includes('/render/') || file.includes('/audio/')
        ? 'render'
        : 'model';
  const old = records.get(text);
  if (old) old.sources.push(`${file}:${line}`);
  else records.set(text, { text, group, sources: [`${file}:${line}`] });
}
function collect(raw, file, line) {
  if (!/<[a-z][\s>]/i.test(raw) && !/<[a-z][\w-]*\b[^>]*>/i.test(raw)) return add(raw, file, line);
  const clean = raw.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  for (const token of clean.match(/<[^>]+>|[^<]+/g) ?? []) {
    if (token.startsWith('<')) {
      for (const match of token.matchAll(
        /\b(?:aria-label|title|alt|placeholder)\s*=\s*["']([^"']*)["']/g,
      ))
        add(match[1], file, line);
    } else add(token, file, line);
  }
}
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name !== 'i18n' && entry.name !== 'assets') await walk(file);
    } else if (file.endsWith('.ts')) {
      const source = await readFile(file, 'utf8');
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      function visit(node) {
        const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
          collect(node.text, file, line);
        if (ts.isTemplateExpression(node)) {
          let pattern = node.head.text;
          node.templateSpans.forEach((span, i) => {
            pattern += `{${i}}${span.literal.text}`;
          });
          collect(pattern, file, line);
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
  }
}
await walk('src');
collect(await readFile('index.html', 'utf8'), 'index.html', 1);
const all = [...records.values()].sort((a, b) => a.text.localeCompare(b.text, 'fr'));
const folder = process.env.LOCALE_INVENTORY_FOLDER ?? 'artifacts/locale-035-inventory';
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/all.json`, JSON.stringify(all, null, 2) + '\n');
for (const group of ['model', 'render', 'ui'])
  await writeFile(
    `${folder}/${group}.json`,
    JSON.stringify(
      all.filter((r) => r.group === group),
      null,
      2,
    ) + '\n',
  );
console.log(
  JSON.stringify({
    total: all.length,
    groups: Object.fromEntries(
      ['model', 'render', 'ui'].map((g) => [g, all.filter((r) => r.group === g).length]),
    ),
    folder,
  }),
);
