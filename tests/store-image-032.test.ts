import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imageMetadata } from '../deploy/imageMetadata.ts';

test('Store image inspector reads dimensions from an existing supplied PNG without changing it', () => {
  const input = readFileSync(
    new URL('../docs/resources-2026-11/maquettes/jeu-812x375.png', import.meta.url),
  );
  const before = Buffer.from(input);
  const info = imageMetadata(input);
  assert.equal(info?.width, 1624);
  assert.equal(info?.height, 750);
  assert.equal(info?.format, 'png');
  assert.equal(info?.bitDepth, 8);
  assert.deepEqual(input, before);
});

test('Truncated, unsupported and corrupt image headers fail closed without throwing', () => {
  for (const input of [
    Buffer.alloc(0),
    Buffer.from('not an image'),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.from([255, 216, 255, 224, 0, 1, 0, 0, 0, 0]),
  ])
    assert.equal(imageMetadata(input), null);
});
