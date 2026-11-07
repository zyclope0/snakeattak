import test from 'node:test';
import assert from 'node:assert/strict';
import { FramePool } from '../src/render/framePool.ts';

function fixture(maxIdle = 2) {
  let next = 0;
  const pool = new FramePool<
    string,
    { id: number; visible: boolean; tint: string; destroyed: boolean }
  >({
    maxIdle,
    create: () => ({ id: ++next, visible: false, tint: 'white', destroyed: false }),
    activate: (item) => {
      item.visible = true;
      item.tint = 'white';
    },
    deactivate: (item) => {
      item.visible = false;
    },
    destroy: (item) => {
      item.destroyed = true;
      item.visible = false;
    },
  });
  return pool;
}
test('une clef active conserve la même vue sans réinitialisation par image', () => {
  const p = fixture();
  p.beginFrame();
  const first = p.acquire('ally');
  first.tint = 'hurt';
  p.endFrame();
  p.beginFrame();
  assert.equal(p.acquire('ally'), first);
  assert.equal(first.tint, 'hurt');
  p.endFrame();
  assert.deepEqual(p.stats, { active: 1, idle: 0, created: 1, reused: 0, destroyed: 0 });
});

test('la consultation des vues ne prolonge pas leur durée de vie', () => {
  const p = fixture();
  p.beginFrame();
  const view = p.acquire('a');
  p.endFrame();
  p.beginFrame();
  assert.equal(p.get('a'), view);
  assert.equal(p.get('missing'), undefined);
  p.endFrame();
  assert.equal(p.get('a'), undefined);
  assert.equal(view.visible, false);
});
test('une vue disparue est cachée puis recyclée et réinitialisée pour la nouvelle clef', () => {
  const p = fixture();
  p.beginFrame();
  const first = p.acquire('enemy');
  first.tint = 'poison';
  p.endFrame();
  p.beginFrame();
  p.endFrame();
  assert.equal(first.visible, false);
  p.beginFrame();
  const next = p.acquire('egg');
  p.endFrame();
  assert.equal(next, first);
  assert.equal(next.visible, true);
  assert.equal(next.tint, 'white');
  assert.equal(p.stats.reused, 1);
});
test('la réserve inactive reste bornée et les surplus sont détruits', () => {
  const p = fixture(2);
  p.beginFrame();
  const images = ['a', 'b', 'c', 'd'].map((k) => p.acquire(k));
  p.endFrame();
  p.beginFrame();
  p.endFrame();
  assert.equal(p.stats.idle, 2);
  assert.equal(p.stats.destroyed, 2);
  assert.equal(images.filter((i) => i.destroyed).length, 2);
  assert.ok(images.every((i) => !i.visible));
});
test('une réserve pleine ne limite jamais les acteurs vivants', () => {
  const p = fixture(1);
  p.beginFrame();
  for (let i = 0; i < 20; i++) p.acquire(String(i));
  p.endFrame();
  assert.equal(p.stats.active, 20);
  assert.equal(p.stats.destroyed, 0);
});
test('clear libère actifs et inactifs une seule fois et accepte une nouvelle scène', () => {
  const p = fixture();
  p.beginFrame();
  const a = p.acquire('a'),
    b = p.acquire('b');
  p.endFrame();
  p.beginFrame();
  p.acquire('a');
  p.endFrame();
  p.clear();
  p.clear();
  assert.equal(a.destroyed, true);
  assert.equal(b.destroyed, true);
  assert.equal(p.stats.destroyed, 2);
  p.beginFrame();
  assert.notEqual(p.acquire('new'), a);
  p.endFrame();
});
test('les capacités invalides sont rejetées et une réserve nulle ne retient rien', () => {
  for (const n of [-1, NaN, Infinity, 1.5]) assert.throws(() => fixture(n), RangeError);
  const p = fixture(0);
  p.beginFrame();
  p.acquire('a');
  p.endFrame();
  p.beginFrame();
  p.endFrame();
  assert.equal(p.stats.idle, 0);
  assert.equal(p.stats.destroyed, 1);
});
