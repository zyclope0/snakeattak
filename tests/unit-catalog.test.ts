import test from 'node:test';
import assert from 'node:assert/strict';
import { kinds } from '../src/data.ts';
import { RECRUITABLE_KINDS } from '../src/ui/unitCatalog.ts';

test('le catalogue propose chaque allié une fois, sauf le héros', () => {
  const recruitable = Object.keys(kinds)
    .filter((k) => k !== 'hero')
    .sort();
  assert.deepEqual([...RECRUITABLE_KINDS].sort(), recruitable);
  assert.equal(new Set(RECRUITABLE_KINDS).size, RECRUITABLE_KINDS.length);
  // The catalogue shows them all on one screen: five columns of four rows hold twenty.
  assert.ok(RECRUITABLE_KINDS.length <= 20, 'une cinquième rangée ne tient plus sur un téléphone');
});
