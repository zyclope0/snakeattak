import test from 'node:test';
import assert from 'node:assert/strict';
import { addApple, createAppleBook, readApples, writeApples } from '../src/appleBook.ts';
import { APPLES_TO_UNLOCK } from '../src/apples.ts';
import { APPLES_STORAGE_KEY } from '../src/storageKeys.ts';

function memory(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  let refused = false;
  return {
    values,
    set refuse(value: boolean) {
      refused = value;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (refused) throw Error('quota');
      values.set(key, value);
    },
  };
}
const twelve = Array.from({ length: 12 }, (_, i) => `${1000 + i}:${3 * (i + 1)}`);

test('le carnet des pommes se relit tel qu’il a été écrit', () => {
  assert.equal(
    writeApples(['7:3', '4294967295:12']),
    '{"version":1,"found":["7:3","4294967295:12"]}',
  );
  assert.deepEqual(readApples(writeApples(['7:3', '4294967295:12'])), ['7:3', '4294967295:12']);
  assert.deepEqual(readApples(writeApples([])), []);
  assert.deepEqual(readApples(writeApples(twelve)), twelve);
  // The endless adventure counts on: a wave far beyond the twelfth is an apple too.
  assert.deepEqual(readApples(writeApples(['9:12003'])), ['9:12003']);
});

test('un carnet douteux se lit vide, en entier', () => {
  const refused = (raw: string | null, why: string) => assert.deepEqual(readApples(raw), [], why);
  refused(null, 'nothing stored');
  refused('', 'empty');
  refused('{', 'not JSON');
  refused('[]', 'not a book');
  refused('{"version":2,"found":["7:3"]}', 'a version of the future');
  refused('{"version":1}', 'no list');
  refused('{"version":1,"found":"7:3"}', 'not a list');
  refused('{"version":1,"found":[7]}', 'a number for a name');
  refused('{"version":1,"found":["7:3","7:3"]}', 'the same apple twice');
  refused('{"version":1,"found":["7:4"]}', 'a wave without an apple');
  refused('{"version":1,"found":["7:0"]}', 'before the first wave');
  refused('{"version":1,"found":["07:3"]}', 'not written as the game writes it');
  refused('{"version":1,"found":["7:03"]}', 'not written as the game writes it, again');
  refused('{"version":1,"found":["-7:3"]}', 'a negative seed');
  refused('{"version":1,"found":["4294967296:3"]}', 'a seed beyond 32 bits');
  refused('{"version":1,"found":["7:12015"]}', 'beyond the last king of the endless adventure');
  refused('{"version":1,"found":["7:3 "]}', 'a space');
  refused('{"version":1,"found":["7:3x"]}', 'something more');
  refused(writeApples([...twelve, '9999:3']), 'more than the twelve that open the boss');
  refused(`{"version":1,"found":["7:3"],"pad":"${'x'.repeat(600)}"}`, 'too long');
});

test('une pomme ne compte qu’une fois, et le carnet s’arrête à douze', () => {
  assert.equal(APPLES_TO_UNLOCK, 12);
  let found = readApples(null);
  ({ found } = addApple(found, '33:3'));
  assert.deepEqual(found, ['33:3']);
  assert.deepEqual(addApple(found, '33:3'), { found, added: false }, 'the same seed and wave');
  assert.deepEqual(addApple(found, '33:4'), { found, added: false }, 'not an apple');
  assert.equal(addApple(found, '33:6').added, true);
  assert.deepEqual(addApple(twelve, '1:3'), { found: twelve, added: false }, 'beyond twelve');
});

test('le carnet du joueur : il garde, il réessaie ce que l’appareil refuse', () => {
  const device = memory();
  const book = createAppleBook(device);
  assert.equal(book.has('33:3'), false);
  assert.deepEqual(book.add('33:3'), { count: 1, added: true });
  assert.equal(device.values.get(APPLES_STORAGE_KEY), '{"version":1,"found":["33:3"]}');
  assert.equal(book.has('33:3'), true);
  // Reloading the camp: the same apple again counts for nothing.
  assert.deepEqual(createAppleBook(device).add('33:3'), { count: 1, added: false });
  // The device refuses: the apple is the child's all the same, and written at the next try.
  device.refuse = true;
  assert.deepEqual(book.add('34:3'), { count: 2, added: true });
  assert.equal(book.unkept, true);
  assert.equal(book.has('34:3'), true);
  assert.equal(book.retry(), false);
  device.refuse = false;
  assert.equal(book.retry(), true);
  assert.equal(book.unkept, false);
  assert.deepEqual(readApples(device.values.get(APPLES_STORAGE_KEY)!), ['33:3', '34:3']);
  // An import wrote its own book: what waited is forgotten.
  device.refuse = true;
  book.add('35:3');
  book.forget();
  device.refuse = false;
  assert.equal(book.retry(), true);
  assert.deepEqual(book.read(), ['33:3', '34:3']);
  // Twelve found: the next ones are a joy, not a line.
  const full = memory({ [APPLES_STORAGE_KEY]: writeApples(twelve) });
  assert.deepEqual(createAppleBook(full).add('1:3'), { count: 12, added: false });
  assert.deepEqual(readApples(full.values.get(APPLES_STORAGE_KEY)!), twelve);
  // A storage that refuses to be read holds nothing; no storage at all keeps nothing.
  const blocked = {
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {},
  };
  assert.deepEqual(createAppleBook(blocked).read(), []);
  assert.deepEqual(createAppleBook().add('33:3'), { count: 1, added: true });
});
