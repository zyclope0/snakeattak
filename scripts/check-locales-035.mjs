import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { english } from '../src/i18n/english.ts';

const inventory = JSON.parse(await readFile('artifacts/locale-035-inventory/all.json', 'utf8'));
const missing = inventory.filter(({ text }) => english[text] === undefined).map(({ text }) => text);
const placeholders = (value) => [...value.matchAll(/\{(\d+)\}/g)].map((match) => match[1]);
const added = [],
  omissions = [];
for (const [source, target] of Object.entries(english)) {
  assert.ok(target.trim(), `Empty English copy: ${source}`);
  const a = placeholders(source),
    b = placeholders(target);
  for (const id of b) if (!a.includes(id)) added.push({ source, target, id });
  const omitted = a.filter((id) => !b.includes(id));
  if (omitted.length) omissions.push({ source, target, omitted });
}
assert.deepEqual(missing, [], 'Every inventoried phrase needs a reviewed English entry');
assert.deepEqual(added, [], 'A translation must never invent a missing parameter');
// The omissions are French agreement suffixes; keep the exact reviewed set explicit.
const approved = new Set([
  '{0} bonus choisi{1} pour cette aventure',
  '{0} détour{1}',
  '{0} étoile{1} sur 3',
  '{0} étoile{1} sur 3 {2}. Cristal : {3} · actuellement {4}/100 PV. {5} allié{6} présent{7}. {8} serpent{9} vaincu{10} depuis le début de l’aventure.',
  '{0} œuf{1} · {2} éclosions',
  '{0} utilisé{1} · revient à la prochaine vague',
  'conservée{0}',
  'Voie{0} attaquée{1} : {2}. « — » : paisible.',
]);
assert.deepEqual(
  omissions.filter((entry) => !approved.has(entry.source)),
  [],
  'Unreviewed lost parameter',
);
await mkdir('artifacts/locale-035-inventory', { recursive: true });
const report = {
  inventory: inventory.length,
  englishEntries: Object.keys(english).length,
  missing,
  added,
  omissions,
};
await writeFile(
  'artifacts/locale-035-inventory/coverage.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    inventory: report.inventory,
    englishEntries: report.englishEntries,
    missing: 0,
    addedParameters: 0,
    reviewedAgreementTemplates: omissions.length,
  }),
);
