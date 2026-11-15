import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NARROW_SCREEN_WIDTH } from '../src/ui/dom.ts';

// The code asks « is the page one column? » to bring the board or a reward back into view.
// The styles decide when the page is one column. For a long time the code said 800 px and
// the styles 920 px: a phone 812 px wide was treated unlike one 780 px wide.
test('le code et les styles s’accordent sur la largeur d’une page en une colonne', () => {
  const styles = readFileSync('src/styles/06-responsive.css', 'utf8');
  const rule =
    /@media \(max-width: (\d+)px\) \{(?:(?!\n\}\n)[\s\S])*?\.play-layout \{\s*grid-template-columns: minmax\(0, 1fr\);/.exec(
      styles,
    );
  assert.ok(rule, 'la règle qui met la page en une colonne a changé de forme');
  assert.equal(Number(rule[1]), NARROW_SCREEN_WIDTH);
  assert.equal(NARROW_SCREEN_WIDTH, 920);
  // The layouts that start where the single column ends say so with the next pixel.
  for (const file of ['src/styles/06-responsive.css', 'src/styles/12-camp-details.css'])
    for (const [, width] of readFileSync(file, 'utf8').matchAll(/@media \(min-width: (9\d\d)px\)/g))
      assert.equal(Number(width), NARROW_SCREEN_WIDTH + 1, file);
});
