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

test('no displayed text is written in the code: every one lives in src/texts', async () => {
  // The catalogue itself, the translator and the approved privacy policy hold words; no
  // other TypeScript source may. A new text goes into src/texts/fr and src/texts/en.
  const sources = (readdirSync('src', { recursive: true }) as string[])
    .map((path) => `src/${path}`)
    .filter((file) => file.endsWith('.ts') && !/^src\/(texts|i18n|assets)\//.test(file));
  assert.ok(sources.length > 200);
  // A literal that is a French text of the catalogue is refused too, even a word in small
  // letters (« offert ») that would pass for a name of the code.
  const known = new Set((await buildDictionary()).dictionary.keys());
  const written = sources.flatMap((file) =>
    literalTexts(file, readFileSync(file, 'utf8'), known).map(
      ({ text, line }) => `${file}:${line} ${text}`,
    ),
  );
  assert.deepEqual(written, []);
});

test('a value written for the browser is not a text, a sentence beside it still is', () => {
  // What the browser reads in its own grammar stays next to its use, out of src/texts.
  for (const value of [
    'linear-gradient(135deg, #486d58, #e6dcad)',
    'linear-gradient(135deg, var(--forest), rgba(23, 62, 55, 0.4)), radial-gradient(#fff, #000)',
    '(pointer: coarse) and (orientation: portrait)',
    'screen and (max-width: 800px)',
    'translate(512 0) scale(-1 1)',
    'translate({0} 0) rotate(90)',
    'xMidYMid slice',
    'button, select, input, textarea, summary, a, [contenteditable]',
    'NFD',
    'Fredoka',
    'Nunito Sans',
  ])
    assert.deepEqual(displayedTexts(value), [], value);
  // Words a child could read are refused, even when they look a little like the above.
  for (const text of [
    'Le roi arrive (avec ses invités) !',
    '(Touche ici) and (attends)',
    'Tourne ton écran (orientation: portrait)',
    'Dégradé : linear-gradient(135deg, #486d58, #e6dcad)',
    'linear-gradient(Le roi arrive !)',
    'translate(vers la droite)',
    'Déplace (512 0) puis tourne',
    'xMidYMid slice de gâteau',
    'Choisis un bouton, une liste, un champ',
    'button, select, input',
    'Police Fredoka',
    'Nunito Sans Bold',
    '{0} must be boolean',
  ])
    assert.deepEqual(displayedTexts(text), [text], text);
  // In a source, the guard names the sentence and lets the browser values through.
  const source = [
    "const PORTRAIT = '(pointer: coarse) and (orientation: portrait)';",
    "const PLACEHOLDER = 'linear-gradient(135deg, #486d58, #e6dcad)';",
    'const flipped = `translate(${width} 0) scale(-1 1)`;',
    "const title = 'Tourne ton téléphone';",
  ].join('\n');
  assert.deepEqual(literalTexts('src/ui/sample.ts', source), [
    { text: 'Tourne ton téléphone', line: 4 },
  ]);
  // A word of the catalogue in small letters looks like a name of the code: only the catalogue
  // tells it apart. A join of values with no letter is not a text.
  const words = [
    "const price = cost === 0 ? 'offert' : 'shield';",
    'const mode = `IA : ${cunning}`;',
    'const pair = `${name} ${stars}`;',
  ].join('\n');
  const known = new Set(['offert', 'IA : {0}', '{0} {1}', 'Shield']);
  assert.deepEqual(literalTexts('src/ui/sample.ts', words), []);
  assert.deepEqual(literalTexts('src/ui/sample.ts', words, known), [
    { text: 'offert', line: 1 },
    { text: 'IA : {0}', line: 2 },
  ]);
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
