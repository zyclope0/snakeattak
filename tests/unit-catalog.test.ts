import test from 'node:test';
import assert from 'node:assert/strict';
import { kinds } from '../src/data.ts';
import { CATALOGUE_COLUMNS, CATALOGUE_ROWS, RECRUITABLE_KINDS } from '../src/ui/unitCatalog.ts';

test('le catalogue propose chaque allié une fois, sauf le héros', () => {
  const recruitable = Object.keys(kinds)
    .filter((k) => k !== 'hero')
    .sort();
  assert.deepEqual([...RECRUITABLE_KINDS].sort(), recruitable);
  assert.equal(new Set(RECRUITABLE_KINDS).size, RECRUITABLE_KINDS.length);
  // The catalogue shows them all on one screen: five columns of five rows, under the title row
  // that holds the tabs since the spinosaurus. A sixth row no longer fits on a phone.
  assert.ok(
    RECRUITABLE_KINDS.length <= CATALOGUE_ROWS * CATALOGUE_COLUMNS,
    'une sixième rangée ne tient plus sur un téléphone',
  );
});
