import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildDictionary, dictionarySource } from '../scripts/build-texts.ts';
import { displayedTexts, literalTexts } from '../scripts/displayed-text.ts';
import { fillTexts, readIndexHtml } from '../deploy/assembleHtml.ts';
import { fill } from '../src/texts/fill.ts';

const placeholders = (text: string) => [...text.matchAll(/\{(\d+)\}/g)].map((match) => match[1]);

test('fill puts each value at its place, once, as a template would', () => {
  assert.equal(fill('Étape {0} sur {1}', 2, 5), 'Étape 2 sur 5');
  assert.equal(fill('{1} puis {0}, et encore {1}', 'a', 'b'), 'b puis a, et encore b');
  assert.equal(fill('{0} étoile{1}', 1, ''), '1 étoile');
  // A value is written as it is: it is never read again as a text to fill.
  assert.equal(fill('{0} et {1}', '{1}', '$&'), '{1} et $&');
  assert.equal(fill('Sans valeur'), 'Sans valeur');
});

test('every French text of the catalogue has its English under the same name', async () => {
  const { dictionary, faults } = await buildDictionary();
  assert.deepEqual(faults, []);
  assert.ok(dictionary.size > 1000);
  // A translation never invents a value the French text does not have.
  for (const [french, english] of dictionary) {
    assert.ok(english.trim(), `Empty English for « ${french} »`);
    const known = placeholders(french);
    for (const id of placeholders(english)) assert.ok(known.includes(id), `${french} → ${english}`);
  }
});

test('the dictionary the game reads is the one built from the catalogue', async () => {
  const { dictionary } = await buildDictionary();
  assert.equal(
    readFileSync('src/i18n/dictionary.en.ts', 'utf8'),
    dictionarySource(dictionary),
    'src/i18n/dictionary.en.ts is not up to date: run `npm run texts:build`.',
  );
});

test('no displayed text is written in the code: every one lives in src/texts', () => {
  // The catalogue itself, the translator and the approved privacy policy hold words; no
  // other TypeScript source may. A new text goes into src/texts/fr and src/texts/en.
  const sources = (readdirSync('src', { recursive: true }) as string[])
    .map((path) => `src/${path}`)
    .filter((file) => file.endsWith('.ts') && !/^src\/(texts|i18n|assets)\//.test(file));
  assert.ok(sources.length > 200);
  const written = sources.flatMap((file) =>
    literalTexts(file, readFileSync(file, 'utf8')).map(
      ({ text, line }) => `${file}:${line} ${text}`,
    ),
  );
  assert.deepEqual(written, []);
});

test('the page templates hold names of texts, never words', () => {
  const templates = [
    'index.html',
    ...readdirSync('src/html')
      .filter((name) => name.endsWith('.html'))
      .map((name) => `src/html/${name}`),
  ];
  assert.ok(templates.length >= 10);
  const written = templates.flatMap((file) =>
    // A name between braces is not a word: what is left must be markup only.
    displayedTexts(readFileSync(file, 'utf8').replace(/\{\{\w+\}\}/g, '')).map(
      (text) => `${file}: ${text}`,
    ),
  );
  assert.deepEqual(written, []);
  // Every name has its text, and the assembled page has no brace left.
  assert.doesNotMatch(readIndexHtml(), /\{\{|\}\}/);
  assert.throws(() => fillTexts('<p>{{noSuchText}}</p>'), /noSuchText/);
  assert.equal(
    fillTexts('<p title="{{a}}">{{b}}</p>', { a: 'x "y"', b: 'A & B' }),
    '<p title="x &quot;y&quot;">A &amp; B</p>',
  );
});
