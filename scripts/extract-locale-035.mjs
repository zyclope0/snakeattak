// The inventory of every text the game shows: the French catalogue (src/texts/fr) and the
// page (src/html). The English dictionary must have an entry for each of them.
import { readIndexHtml } from '../deploy/assembleHtml.ts';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { displayedTexts, literalTexts } from './displayed-text.ts';

const records = new Map();
function add(text, file, line) {
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
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      // The English catalogue mirrors the French one: only the French texts are inventoried.
      if (entry.name !== 'i18n' && entry.name !== 'assets' && file !== 'src/texts/en')
        await walk(file);
    } else if (file.endsWith('.ts')) {
      for (const { text, line } of literalTexts(file, await readFile(file, 'utf8')))
        add(text, file, line);
    }
  }
}
await walk('src');
// The page is assembled from src/html: read it whole, under its usual name.
for (const text of displayedTexts(readIndexHtml())) add(text, 'index.html', 1);
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
