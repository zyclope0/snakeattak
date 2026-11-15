import test from 'node:test';
import assert from 'node:assert/strict';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { snakeEntries } from '../src/ui/snakeIndex/snakeEntries.ts';
import { THREAT_DETAILS } from '../src/ui/threatPreview.ts';
import { english } from '../src/i18n/english.ts';
import * as TEXT from '../src/texts/fr/snakeIndex.ts';

test('l’index montre chaque serpent une fois, dans l’ordre où l’aventure les amène', () => {
  const entries = snakeEntries();
  assert.deepEqual(
    entries.map((entry) => entry.kind).sort(),
    Object.keys(THREAT_DETAILS).sort(),
    'chaque serpent du jeu a sa fiche',
  );
  assert.equal(entries[0].kind, 'normal');
  assert.equal(entries[0].firstWave, 1);
  assert.equal(entries.at(-1)!.kind, 'king');
  assert.equal(entries.at(-1)!.firstWave, TOTAL_WAVES);
  for (const [index, entry] of entries.entries()) {
    assert.ok(entry.firstWave >= 1 && entry.firstWave <= TOTAL_WAVES, entry.kind);
    if (index) assert.ok(entries[index - 1].firstWave <= entry.firstWave, entry.kind);
  }
});

test('les mots de l’index se lisent en anglais', () => {
  for (const french of Object.values(TEXT)) assert.ok(english[french], french);
});
