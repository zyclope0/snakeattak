import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasControlCharacter,
  isArrayOfLength,
  isOneOf,
  isUint32,
  readBoundedJson,
  withoutControlCharacters,
} from '../src/plainData.ts';

test('isUint32 : une graine est un entier de 0 à 4 294 967 295, rien d’autre', () => {
  for (const seed of [0, 1, 42, 0xffffffff]) assert.equal(isUint32(seed), true);
  for (const value of [-1, 0x100000000, 1.5, NaN, Infinity, '42', null, undefined, [], {}])
    assert.equal(isUint32(value), false);
});

test('isArrayOfLength : un tableau dont la taille tient entre deux bornes incluses', () => {
  assert.equal(isArrayOfLength([], 0, 2), true);
  assert.equal(isArrayOfLength([1, 2], 0, 2), true);
  assert.equal(isArrayOfLength([1, 2, 3], 0, 2), false);
  assert.equal(isArrayOfLength([], 1, 8), false);
  assert.equal(isArrayOfLength([1, 2, 3], 3, 3), true);
  for (const value of ['abc', { length: 2 }, null, undefined, 3])
    assert.equal(isArrayOfLength(value, 0, 9), false);
});

test('isOneOf : aucune conversion entre un nombre et son écriture', () => {
  assert.equal(isOneOf('force', ['none', 'force', 'guard']), true);
  assert.equal(isOneOf('Force', ['none', 'force', 'guard']), false);
  assert.equal(isOneOf(2, [0, 1, 2]), true);
  assert.equal(isOneOf('2', [0, 1, 2]), false);
  assert.equal(isOneOf(undefined, [0, 1, 2]), false);
  assert.equal(isOneOf(['none'], ['none', 'force', 'guard']), false);
});

test('caractères de contrôle : repérés et retirés, le reste du texte ne bouge pas', () => {
  assert.equal(hasControlCharacter('Léo'), false);
  assert.equal(hasControlCharacter('Zoé et Tom'), false);
  for (const text of ['a\u0000b', 'a\nb', 'a\u001fb', 'a\u007fb', 'a\u009fb'])
    assert.equal(hasControlCharacter(text), true);
  assert.equal(withoutControlCharacters('a\u0000b\n\u009fc'), 'abc');
  assert.equal(withoutControlCharacters('Léo 🐍'), 'Léo 🐍');
  // The two functions keep no state from one call to the next.
  assert.equal(hasControlCharacter('\u0007'), true);
  assert.equal(hasControlCharacter('\u0007'), true);
});

test('readBoundedJson : texte trop long, texte abîmé ou lecteur qui échoue donnent null', () => {
  const read = (value: unknown) => (typeof value === 'number' ? value * 2 : null);
  assert.equal(readBoundedJson('21', 10, read), 42);
  assert.equal(readBoundedJson(' 21 ', 4, read), 42);
  assert.equal(readBoundedJson(' 21 ', 3, read), null);
  assert.equal(readBoundedJson('"x"', 10, read), null);
  assert.equal(readBoundedJson('{', 10, read), null);
  assert.equal(readBoundedJson(21, 10, read), null);
  assert.equal(readBoundedJson(null, 10, read), null);
  assert.equal(
    readBoundedJson('21', 10, () => {
      throw new Error('reader');
    }),
    null,
  );
});
