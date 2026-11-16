import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  planAdPlacement,
  rectGap,
  type AdMeasurement,
  type AdRect,
} from '../src/ui/webAds/layout.ts';
import { PREPARED_DISPLAY_ATTRIBUTES, WEB_AD_DELIVERY } from '../src/ui/webAds/contract.ts';

type Fixture = {
  name: string;
  measurement: AdMeasurement;
  expected: null | { width: number; height: number; shiftX: number };
};
const fixtures: Fixture[] = JSON.parse(
  readFileSync('tests/fixtures/web-ad-placement-2026-11-16.json', 'utf8'),
);
const shifted = (rect: AdRect, x: number) => ({ ...rect, x: rect.x + x });
const valid = (m: AdMeasurement) => {
  const original = JSON.stringify(m);
  const p = planAdPlacement(m);
  assert.equal(JSON.stringify(m), original, 'measurement never mutated');
  if (!p) return;
  assert.ok(p.frame.x >= 20 && p.frame.y >= 20);
  assert.ok(p.frame.x + p.frame.width <= m.width - 20 + 0.01);
  assert.ok(p.frame.y + p.frame.height <= m.height - 20 + 0.01);
  assert.ok(p.shiftX <= 0 && m.app.x + p.shiftX >= 12);
  for (const r of [m.board, m.battle, m.dock, m.hud])
    assert.ok(rectGap(shifted(r, p.shiftX), p.creative) >= 149.9);
  assert.equal(p.creative.width + 24, p.frame.width);
  assert.equal(p.creative.height + 50, p.frame.height);
};

for (const f of fixtures)
  test(`ad placement follows approved preview: ${f.name}`, () => {
    const p = planAdPlacement(f.measurement);
    if (!f.expected) assert.equal(p, null);
    else {
      assert.ok(p);
      assert.equal(p.creative.width, f.expected.width);
      assert.equal(p.creative.height, f.expected.height);
      assert.ok(Math.abs(p.shiftX - f.expected.shiftX) < 0.1);
    }
    valid(f.measurement);
  });

test('no creative can cross the 150px buffer or screen edge in the nearby viewport grid', () => {
  const base = fixtures.find((f) => f.name === '1920x1080')!.measurement;
  for (let width = 1800; width <= 2600; width += 29)
    for (let height = 720; height <= 1450; height += 31) {
      const x = Math.max(0, (width - 1640) / 2);
      const dx = x - base.app.x;
      const m = {
        ...base,
        width,
        height,
        app: shifted(base.app, dx),
        board: shifted(base.board, dx),
        battle: shifted(base.battle, dx),
        dock: shifted(base.dock, dx),
        hud: shifted(base.hud, dx),
      };
      valid(m);
    }
});

test('narrow viewports and nonfinite or zero rectangles fail closed', () => {
  const base = fixtures.find((f) => f.name === '1920x1080')!.measurement;
  assert.equal(planAdPlacement({ ...base, width: 1919 }), null);
  for (const value of [0, -1, NaN, Infinity]) {
    assert.equal(planAdPlacement({ ...base, width: value }), null);
    for (const key of ['app', 'board', 'battle', 'dock', 'hud'] as const)
      assert.equal(planAdPlacement({ ...base, [key]: { ...base[key], width: value } }), null);
  }
  assert.equal(planAdPlacement({ ...base, board: { ...base.board, x: NaN } }), null);
});

test('the prepared account contract is child-directed and cannot enable delivery', () => {
  assert.equal(WEB_AD_DELIVERY, 'disabled');
  assert.deepEqual(PREPARED_DISPLAY_ATTRIBUTES, {
    'data-ad-client': 'ca-pub-8498417364292905',
    'data-ad-slot': '7092707633',
    'data-tag-for-age-treatment': '1',
    'data-full-width-responsive': 'false',
  });
  assert.ok(Object.isFrozen(PREPARED_DISPLAY_ATTRIBUTES));
});
