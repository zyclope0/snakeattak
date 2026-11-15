import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createdIds, lookedUpIds, missingIds, pageIds, parse } from '../scripts/dom-ids.ts';
import { readIndexHtml } from '../deploy/assembleHtml.ts';

const one = (code: string, file = 'src/ui/sample.ts') => [parse(file, code)];

test('every id the code looks up is in the page or given by the code to what it builds', () => {
  const sources = (readdirSync('src', { recursive: true }) as string[])
    .filter((path) => path.endsWith('.ts'))
    .map((path) => `src/${path}`)
    .map((file) => parse(file, readFileSync(file, 'utf8')));
  assert.ok(sources.length > 200);
  const page = readIndexHtml();
  const { ids, unread } = lookedUpIds(sources);
  // The inventory is not empty by accident: the reader does see the lookups and the page.
  assert.ok(new Set(ids.map(({ id }) => id)).size >= 200);
  assert.ok(new Set(pageIds(page)).size >= 200);
  assert.ok(createdIds(sources).length >= 80);
  // An id belongs to one element.
  assert.deepEqual(
    pageIds(page).filter((id, index, all) => all.indexOf(id) !== index),
    [],
  );
  // `file:line id` of each lookup that would find nothing.
  assert.deepEqual(missingIds(sources, page), []);
  // A lookup whose id is neither written at the call nor given by the callers escapes this
  // test: write the id, or pass the id of an element the code holds (`field.id`).
  assert.deepEqual(unread, []);
});

test('a lookup of an id that is nowhere is named with its file and its line', () => {
  const page = '<main id="app"><button id="start"></button><p id="chapter-1"></p></main>';
  assert.deepEqual(missingIds(one("byId('start');\nbyId<HTMLElement>('strat');"), page), [
    'src/ui/sample.ts:2 strat',
  ]);
  assert.deepEqual(
    missingIds(
      one("document.getElementById('app')?.remove();\ndocument.getElementById('ap');"),
      page,
    ),
    ['src/ui/sample.ts:2 ap'],
  );
  // Both ends of a forwarded click, and both sides of a choice.
  assert.deepEqual(
    missingIds(one("forwardClick('start', 'stop');\nbyId(on ? 'start' : 'pause');"), page),
    ['src/ui/sample.ts:1 stop', 'src/ui/sample.ts:2 pause'],
  );
  // A computed id needs one id of its shape; the computed part is one word, not `focus-1`.
  assert.deepEqual(missingIds(one('byId(`chapter-${i}`);'), page), []);
  assert.deepEqual(missingIds(one("byId(`step-${i}`);\nbyId('row-' + name);"), page), [
    'src/ui/sample.ts:1 step-${…}',
    'src/ui/sample.ts:2 row-${…}',
  ]);
  assert.deepEqual(missingIds(one('byId(`chapter-${i}`);'), '<p id="chapter-focus-1"></p>'), [
    'src/ui/sample.ts:1 chapter-${…}',
  ]);
  // Words that are not lookups are not read: a class, a comment, a text.
  assert.deepEqual(missingIds(one("// byId('gone')\nnode.className = 'gone';"), page), []);
});

test('an id the code gives to an element it builds counts as there', () => {
  const built = [
    "make('button', { id: 'made' });",
    "node.id = 'assigned';",
    "node.setAttribute('id', 'attribute');",
    'box.innerHTML = `<p class="x" id="markup">${words}</p>`;',
    'name.id = `player-name-${player.id}`;',
    "function toggle(id: string) { return make('button', { id }); }",
    "toggle('through');",
  ].join('\n');
  const lookups = ['made', 'assigned', 'attribute', 'markup', 'player-name-7', 'through']
    .map((id) => `byId('${id}');`)
    .join('\n');
  assert.deepEqual(missingIds(one(`${built}\n${lookups}`), ''), []);
  // The id of a unit, of a mission or of a player is not the id of an element.
  assert.deepEqual(missingIds(one("const unit = { id: 'ninja' };\nbyId('ninja');"), ''), [
    'src/ui/sample.ts:2 ninja',
  ]);
});

test('an id given through a function is read at the calls of that function', () => {
  const page = '<p id="gold"></p><p id="wave"></p><p id="code"></p>';
  const hud = [
    'const show = (id: string, value: string) => refreshText(byId(id), value);',
    "show('gold', '3');",
    "show('wavee', '2');",
    "for (const id of ['wave', 'crystal'] as const) byId(id);",
    "['gold', 'eggs'].map((id) => document.getElementById(id));",
  ].join('\n');
  assert.deepEqual(missingIds(one(hud), page), [
    'src/ui/sample.ts:3 wavee',
    'src/ui/sample.ts:4 crystal',
    'src/ui/sample.ts:5 eggs',
  ]);
  // Another file is read too, when it imports the function; the fault is where the id is written.
  const copy = parse(
    'src/ui/copy.ts',
    'export function bindCopy(fieldId: string) { byId(fieldId); }',
  );
  const user = parse(
    'src/ui/user.ts',
    "import { bindCopy } from './copy.ts';\nbindCopy('code');\nbindCopy('cod');\nbindCopy(field.id);",
  );
  assert.deepEqual(missingIds([copy, user], page), ['src/ui/user.ts:3 cod']);
  // Nothing says what this id is: the lookup is reported rather than skipped.
  const { ids, unread } = lookedUpIds(one('byId(somewhere());'));
  assert.deepEqual(ids, []);
  assert.deepEqual(unread, [{ file: 'src/ui/sample.ts', line: 1, code: 'byId(somewhere())' }]);
});
