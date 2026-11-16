import test from 'node:test';
import assert from 'node:assert/strict';
import type Phaser from 'phaser';
import { bindBoardResize } from '../src/render/boardResize.ts';

test('board bounds refresh is coalesced, skips hidden parents and stays inert after destroy', () => {
  const names = ['requestAnimationFrame', 'cancelAnimationFrame', 'ResizeObserver'] as const;
  const originals = names.map((n) => Object.getOwnPropertyDescriptor(globalThis, n));
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0;
  let destroyed: () => void = () => {};
  let resized: (entries: { contentRect: { width: number; height: number } }[]) => void = () => {};
  let disconnected = false;
  const calls: string[] = [];
  const replacements = [
    (cb: FrameRequestCallback) => {
      frames.set(++sequence, cb);
      return sequence;
    },
    (id: number) => frames.delete(id),
    class {
      constructor(cb: typeof resized) {
        resized = cb;
      }
      observe() {}
      disconnect() {
        disconnected = true;
      }
    },
  ];
  const parent = { clientWidth: 100, clientHeight: 60 };
  try {
    names.forEach((n, i) =>
      Object.defineProperty(globalThis, n, { value: replacements[i], configurable: true }),
    );
    const invalidate = bindBoardResize(
      {
        scale: {
          getParentBounds: () => calls.push('parent'),
          refresh: () => calls.push('refresh'),
          updateBounds: () => calls.push('bounds'),
        },
        events: {
          once: (_event: string, cb: () => void) => {
            destroyed = cb;
          },
        },
      } as unknown as Phaser.Game,
      parent as HTMLElement,
    );
    const flush = () => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((cb) => cb(0));
    };
    invalidate();
    invalidate();
    assert.equal(frames.size, 1);
    flush();
    assert.deepEqual(calls, ['parent', 'refresh', 'bounds']);
    parent.clientWidth = 0;
    invalidate();
    flush();
    assert.equal(calls.length, 3);
    parent.clientWidth = 100;
    resized([{ contentRect: { width: 100, height: 60 } }]);
    assert.equal(frames.size, 1);
    destroyed();
    assert.ok(disconnected);
    assert.equal(frames.size, 0);
    invalidate();
    resized([{ contentRect: { width: 100, height: 60 } }]);
    assert.equal(frames.size, 0, 'late cleanup callbacks cannot touch a destroyed ScaleManager');
  } finally {
    names.forEach((n, i) => {
      if (originals[i]) Object.defineProperty(globalThis, n, originals[i]!);
      else Reflect.deleteProperty(globalThis, n);
    });
  }
});
