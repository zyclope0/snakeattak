import test from 'node:test';
import assert from 'node:assert/strict';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { matchesUnitFamily, RECRUITABLE_KINDS } from '../src/ui/unitCatalog.ts';

test('les filtres de famille couvrent tous les recrutables sans perdre un allié', () => {
  const recruitable = Object.keys(kinds)
    .filter((k) => k !== 'hero')
    .sort();
  assert.deepEqual([...RECRUITABLE_KINDS].sort(), recruitable);
  const grouped = ['humans', 'creatures', 'mutants', 'defenses'].flatMap((family) =>
    RECRUITABLE_KINDS.filter((kind) => matchesUnitFamily(kind, family)),
  );
  assert.deepEqual(grouped.sort(), recruitable);
  assert.ok(RECRUITABLE_KINDS.every((kind) => matchesUnitFamily(kind, 'all')));
});

test('le petit dino et le bébé dragon sont visibles avec leurs nouveaux alliés dinosaures', () => {
  for (const kind of ['dino', 'dragon', 'raptor', 'triceratops', 'stegosaurus', 'trex'] as Kind[])
    assert.ok(matchesUnitFamily(kind, 'creatures'), kind);
  assert.ok(matchesUnitFamily('mutantRock', 'mutants'));
  assert.ok(matchesUnitFamily('mutantStretch', 'mutants'));
  assert.ok(matchesUnitFamily('wall', 'defenses'));
  assert.equal(matchesUnitFamily('ninja', 'mutants'), false);
  assert.equal(matchesUnitFamily('raptor', 'humans'), false);
});
