import test from 'node:test';
import assert from 'node:assert/strict';
import type Phaser from 'phaser';
import {
  BOARD_TEXT_MIN_PX,
  BOARD_WIDTH,
  readableBoardSize,
} from '../src/render/boardResolution.ts';
import { eggLabelPositions } from '../src/render/encounterReadout.ts';

/** A scene whose canvas is `canvas` pixels wide and shown `css` CSS pixels wide. */
const scene = (canvas: number, css: number) =>
  ({ scale: { width: canvas, displayScale: { x: canvas / css } } }) as unknown as Phaser.Scene;
/** What a text of `size` board units measures on that screen, in CSS pixels. */
const shown = (size: number, canvas: number, css: number) =>
  (size * (canvas / BOARD_WIDTH)) / (canvas / css);

test('a text of the board keeps the size it was drawn for where the board keeps its size', () => {
  for (const drawn of [11, 12, 15, 17, 18])
    assert.equal(readableBoardSize(scene(BOARD_WIDTH, BOARD_WIDTH), drawn), drawn);
  // A sharp screen changes nothing: twice the pixels, the same size for the eye.
  assert.equal(readableBoardSize(scene(BOARD_WIDTH * 2, BOARD_WIDTH), 15), 15);
});

test('on a phone, where the board is drawn at half size, the text grows to be read', () => {
  // A phone in landscape: the board is about 553 CSS px wide, on a screen of two pixels each.
  for (const [canvas, css] of [
    [1106, 553],
    [553, 553],
    [1100, 420],
  ]) {
    for (const drawn of [11, 12, 15, 17]) {
      const size = readableBoardSize(scene(canvas, css), drawn);
      assert.ok(size >= drawn);
      assert.ok(shown(size, canvas, css) >= BOARD_TEXT_MIN_PX, `${drawn} → ${size} at ${css}`);
      // No larger than needed: one board unit less would fall under the floor.
      if (size > drawn) assert.ok(shown(size - 1, canvas, css) < BOARD_TEXT_MIN_PX);
    }
  }
  assert.equal(BOARD_TEXT_MIN_PX, 11);
  // The sentence of the end of a game keeps its own, larger floor.
  assert.ok(shown(readableBoardSize(scene(1106, 553), 18, 13.5), 1106, 553) >= 13.5);
});

test('a scene that knows no size yet keeps the drawn size', () => {
  const blank = { scale: { width: 0, displayScale: { x: 0 } } } as unknown as Phaser.Scene;
  assert.equal(readableBoardSize(blank, 15), 15);
});

test('larger plaques stay apart and on the board', () => {
  const eggs = Array.from({ length: 4 }, () => ({ x: 1000, y: 468 }));
  for (const scale of [1, 1.47]) {
    const labels = eggLabelPositions(eggs, scale);
    const half = 77 * scale;
    for (const [i, label] of labels.entries()) {
      assert.ok(label.x - half >= -0.01 && label.x + half <= BOARD_WIDTH + 0.01, 'on the board');
      if (i) assert.ok(label.x - labels[i - 1].x >= 146 * scale, 'no plaque over another');
    }
  }
  // Six eggs on one row are too many for the larger plaques: they share the width of the
  // board instead of leaving it.
  const crowd = eggLabelPositions(
    Array.from({ length: 6 }, () => ({ x: 1000, y: 468 })),
    1.47,
  );
  for (const label of crowd)
    assert.ok(label.x - 77 * 1.47 >= -0.01 && label.x + 77 * 1.47 <= BOARD_WIDTH + 0.01);
  assert.equal(new Set(crowd.map((label) => Math.round(label.x))).size, 6);
  // Drawn as before where nothing grows.
  assert.deepEqual(eggLabelPositions(eggs), eggLabelPositions(eggs, 1));
});
