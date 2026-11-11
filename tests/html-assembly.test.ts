import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { assembleHtml, readIndexHtml } from '../deploy/assembleHtml.ts';

test('index.html assemble tous les morceaux de src/html, une fois chacun', () => {
  const shell = readFileSync('index.html', 'utf8');
  const included = [...shell.matchAll(/<!-- include: (src\/html\/[\w-]+\.html) -->/g)].map(
    (match) => match[1],
  );
  const files = readdirSync('src/html')
    .filter((name) => name.endsWith('.html'))
    .map((name) => `src/html/${name}`);
  assert.deepEqual([...included].sort(), files.sort());
  assert.equal(new Set(included).size, included.length);
  const page = readIndexHtml();
  assert.ok(!page.includes('<!-- include:'), 'aucune inclusion non résolue');
  for (const id of ['home-screen', 'mission-dialog', 'app', 'help-dialog', 'unit-dialog'])
    assert.equal(page.split(`id="${id}"`).length - 1, 1, id);
});

test('une inclusion ne lit que dans src/html', () => {
  const read = (path: string) => `[${path}]`;
  assert.equal(
    assembleHtml('a\n  <!-- include: src/html/home.html -->\nb', read),
    'a\n[src/html/home.html]\nb',
  );
  for (const line of [
    '<!-- include: ../secret.html -->',
    '<!-- include: src/html/../../package.json -->',
    '<!-- include: src/other/home.html -->',
    'text <!-- include: src/html/home.html -->',
  ])
    assert.equal(assembleHtml(line, read), line);
});
