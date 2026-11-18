import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANNOUNCEMENT_SETTLE_MS,
  placeAnnouncement,
  type AnnouncementPlace,
} from '../src/ui/battleNotices.ts';
import * as FR from '../src/texts/fr/board.ts';
import * as EN from '../src/texts/en/board.ts';
import { fill } from '../src/texts/fill.ts';

const frame = 1000 / 60;
/** Plays frames one after the other and returns where the announcement sat at each. */
function play(frames: { changed?: boolean; plaques: boolean }[]) {
  let place: AnnouncementPlace = { raised: false, clear: 0 };
  return frames.map((f) => {
    place = placeAnnouncement(place, { changed: !!f.changed, plaques: f.plaques, deltaMs: frame });
    return place.raised;
  });
}
const repeat = (n: number, plaques: boolean) => Array.from({ length: n }, () => ({ plaques }));

test('the announcement goes above the plaque of courage, and comes back down once', () => {
  // An announcement appears while courage is written under it: raised at once.
  const during = play([{ changed: true, plaques: true }, ...repeat(60, true)]);
  assert.ok(during.every(Boolean));
  // Courage ends: it stays above for a second, then comes back down and stays down.
  const frames = Math.ceil(ANNOUNCEMENT_SETTLE_MS / frame);
  const after = play([
    { changed: true, plaques: true },
    ...repeat(frames - 2, false),
    ...repeat(120, false),
  ]);
  assert.equal(after[frames - 2], true, 'still above just before the second is over');
  assert.equal(after.at(-1), false, 'down for good afterwards');
  assert.equal(after.filter((up, i) => i > 0 && up !== after[i - 1]).length, 1, 'one move only');
});

test('a plaque that blinks does not make the announcement jump', () => {
  // On for half a second, off for half a second, four times: never long enough to settle.
  const blink = [...repeat(30, true), ...repeat(30, false)];
  const seen = play([{ changed: true, plaques: true }, ...blink, ...blink, ...blink, ...blink]);
  assert.ok(seen.every(Boolean), 'it stays above the whole time');
});

test('without a plaque the announcement stays at the bottom edge', () => {
  assert.ok(play([{ changed: true, plaques: false }, ...repeat(200, false)]).every((up) => !up));
  // A new announcement after courage starts from the bottom edge again.
  const next = play([
    { changed: true, plaques: true },
    ...repeat(10, false),
    { changed: true, plaques: false },
  ]);
  assert.equal(next.at(-1), false);
});

test('the words of the refuge on two lines never leave a sign alone on a line', () => {
  for (const [text, percent] of [
    [FR.refugeSurDeuxLignesN, ' %'],
    [EN.refugeSurDeuxLignesN, '%'],
  ] as const) {
    for (const base of [0, 7, 82, 100]) {
      const lines = fill(text, base).split('\n');
      assert.deepEqual(lines, ['REFUGE', `${base}${percent}`]);
    }
  }
  // On one line, as on a screen where the board keeps its size.
  assert.equal(fill(FR.refugeN, 100), 'REFUGE · 100 %');
});
